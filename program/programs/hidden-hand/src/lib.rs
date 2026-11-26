#![allow(unused_imports)]
#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use ephemeral_rollups_sdk::access_control::instructions::{
    CreateEphemeralPermissionCpi, UpdateEphemeralPermissionCpi,
};
use ephemeral_rollups_sdk::access_control::structs::{
    EphemeralMembersArgs, EphemeralPermission, Member, AUTHORITY_FLAG, TX_LOGS_FLAG,
};
use ephemeral_rollups_sdk::anchor::{commit, delegate, ephemeral, vrf, vrf_callback};
use ephemeral_rollups_sdk::consts::{EPHEMERAL_VAULT_ID, MAGIC_PROGRAM_ID, PERMISSION_PROGRAM_ID};
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use ephemeral_rollups_sdk::ephem::{FoldableIntentBuilder, MagicIntentBundleBuilder};
use ephemeral_rollups_sdk::vrf::consts::{program_identity_pubkey, DEFAULT_EPHEMERAL_QUEUE};
use ephemeral_rollups_sdk::vrf::instructions::{
    create_request_randomness_ix_const, RequestRandomnessParams,
};
use ephemeral_rollups_sdk::vrf::types::SerializableAccountMeta;
use hidden_hand_engine::{
    cards_from_randomness, hidden_sum, pnl_c, quote, winner, Side, TradeError, CARD_COUNT, SEATS,
    START_PRICE_C,
};

pub mod errors;
pub mod state;

pub use errors::HhError;
pub use state::*;

declare_id!("HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb");

/// Scoped VRF identity of this program; the oracle signs our callbacks with it.
pub const PROGRAM_IDENTITY: Pubkey = program_identity_pubkey(&crate::ID);

#[ephemeral]
#[program]
pub mod hidden_hand {
    use super::*;

    /// Base layer. Create a table; TEE tables pre-fund the rent of their public permission.
    pub fn open_table(
        ctx: Context<OpenTable>,
        round_id: u64,
        mode: DealMode,
        duration_secs: u16,
        entry_lamports: u64,
    ) -> Result<()> {
        require!(
            duration_secs >= MIN_DURATION_SECS && duration_secs <= MAX_DURATION_SECS,
            HhError::BadDuration
        );
        if mode == DealMode::Tee {
            transfer(
                CpiContext::new(
                    ctx.accounts.system_program.key(),
                    Transfer {
                        from: ctx.accounts.authority.to_account_info(),
                        to: ctx.accounts.table.to_account_info(),
                    },
                ),
                ephemeral_rollups_sdk::ephemeral_accounts::rent(EphemeralPermission::size_of(0) as u32),
            )?;
        }
        let authority = ctx.accounts.authority.key();
        let table = &mut ctx.accounts.table;
        table.round_id = round_id;
        table.authority = authority;
        table.mode = mode;
        table.phase = Phase::Open;
        table.duration_secs = duration_secs;
        table.entry_lamports = entry_lamports;
        table.seat_count = 0;
        table.price_c = START_PRICE_C;
        table.winner = NO_WINNER;
        msg!("hh:open round={} mode={:?} duration={}", round_id, mode, duration_secs);
        Ok(())
    }

    /// Base layer. Take the next seat: pay the entry into the vault, create the hand.
    pub fn join_table(ctx: Context<JoinTable>, commitment: [u8; 32]) -> Result<()> {
        let player = ctx.accounts.player.key();
        let hand_key = ctx.accounts.hand.key();
        let table_key = ctx.accounts.table.key();
        let phase = ctx.accounts.table.phase;
        let mode = ctx.accounts.table.mode;
        let entry = ctx.accounts.table.entry_lamports;
        let n = ctx.accounts.table.seat_count as usize;
        require!(phase == Phase::Open, HhError::WrongPhase);
        require!(n < SEATS, HhError::TableFull);
        require!(
            !ctx.accounts.table.seats[..n].iter().any(|s| s.owner == player),
            HhError::AlreadySeated
        );
        if entry > 0 {
            transfer(
                CpiContext::new(
                    ctx.accounts.system_program.key(),
                    Transfer {
                        from: ctx.accounts.player.to_account_info(),
                        to: ctx.accounts.vault.to_account_info(),
                    },
                ),
                entry,
            )?;
        }
        if mode == DealMode::Tee {
            transfer(
                CpiContext::new(
                    ctx.accounts.system_program.key(),
                    Transfer {
                        from: ctx.accounts.player.to_account_info(),
                        to: ctx.accounts.hand.to_account_info(),
                    },
                ),
                ephemeral_rollups_sdk::ephemeral_accounts::rent(EphemeralPermission::size_of(1) as u32),
            )?;
        }
        let hand = &mut ctx.accounts.hand;
        hand.table = table_key;
        hand.owner = player;
        hand.seat = n as u8;
        hand.cards = [0, 0];
        hand.dealt = false;
        let table = &mut ctx.accounts.table;
        table.seats[n] = Seat {
            owner: player,
            hand: hand_key,
            cash_c: 0,
            pos: 0,
            commitment,
            revealed: false,
        };
        table.seat_count = (n + 1) as u8;
        msg!("hh:join round={} seat={} owner={}", table.round_id, n, player);
        Ok(())
    }

    /// Base layer. Delegate the table or a hand to the ER validator passed as `validator`.
    pub fn delegate_pda(ctx: Context<DelegatePda>, target: DelegateTarget) -> Result<()> {
        let seeds = target_seeds(&target);
        let seed_refs: Vec<&[u8]> = seeds.iter().map(|s| s.as_slice()).collect();
        let validator = ctx.accounts.validator.as_ref().map(|v| v.key());
        ctx.accounts.delegate_pda(
            &ctx.accounts.payer,
            &seed_refs,
            DelegateConfig {
                validator,
                ..Default::default()
            },
        )?;
        Ok(())
    }

    /// ER (TEE). Make the table readable by anyone holding a TEE auth token. Idempotent.
    pub fn create_table_permission(ctx: Context<CreateTablePermission>) -> Result<()> {
        if !ctx.accounts.permission.data_is_empty() || ctx.accounts.permission.lamports() > 0 {
            return Ok(());
        }
        let round = ctx.accounts.table.round_id.to_le_bytes();
        let bump = ctx.bumps.table;
        CreateEphemeralPermissionCpi {
            payer: ctx.accounts.table.to_account_info(),
            permissioned_account: ctx.accounts.table.to_account_info(),
            permission: ctx.accounts.permission.to_account_info(),
            vault: ctx.accounts.ephemeral_vault.to_account_info(),
            magic_program: ctx.accounts.magic_program.to_account_info(),
            permission_program: ctx.accounts.permission_program.to_account_info(),
            args: EphemeralMembersArgs {
                is_private: false,
                members: vec![],
            },
        }
        .invoke_signed(&[&[TABLE_SEED, &round, &[bump]]])?;
        Ok(())
    }

    /// ER (TEE). Make one hand private to its owner. Members come from the account, never from args. Idempotent.
    pub fn create_hand_permission(ctx: Context<CreateHandPermission>, owner: Pubkey) -> Result<()> {
        if !ctx.accounts.permission.data_is_empty() || ctx.accounts.permission.lamports() > 0 {
            return Ok(());
        }
        require_keys_eq!(ctx.accounts.hand.owner, owner, HhError::WrongHand);
        let table_key = ctx.accounts.table.key();
        let bump = ctx.bumps.hand;
        CreateEphemeralPermissionCpi {
            payer: ctx.accounts.hand.to_account_info(),
            permissioned_account: ctx.accounts.hand.to_account_info(),
            permission: ctx.accounts.permission.to_account_info(),
            vault: ctx.accounts.ephemeral_vault.to_account_info(),
            magic_program: ctx.accounts.magic_program.to_account_info(),
            permission_program: ctx.accounts.permission_program.to_account_info(),
            args: EphemeralMembersArgs {
                is_private: true,
                members: vec![Member {
                    flags: AUTHORITY_FLAG | TX_LOGS_FLAG,
                    pubkey: owner,
                }],
            },
        }
        .invoke_signed(&[&[HAND_SEED, table_key.as_ref(), owner.as_ref(), &[bump]]])?;
        Ok(())
    }

    /// ER. One VRF request deals every seat (queue: DEFAULT_EPHEMERAL_QUEUE).
    pub fn request_deal(ctx: Context<RequestDeal>, client_seed: u8) -> Result<()> {
        let table_key = ctx.accounts.table.key();
        let callback_discriminator = {
            let table = &mut ctx.accounts.table;
            require!(table.phase == Phase::Open, HhError::WrongPhase);
            require!(table.seat_count as usize == SEATS, HhError::TableNotFull);
            table.phase = Phase::Dealing;
            match table.mode {
                DealMode::Tee => instruction::CallbackDeal::DISCRIMINATOR.to_vec(),
                DealMode::CommitReveal => return err!(HhError::ModeNotSupported),
            }
        };
        let mut metas = vec![SerializableAccountMeta {
            pubkey: table_key,
            is_signer: false,
            is_writable: true,
        }];
        for seat in ctx.accounts.table.seats.iter() {
            metas.push(SerializableAccountMeta {
                pubkey: seat.hand,
                is_signer: false,
                is_writable: true,
            });
        }
        let ix = create_request_randomness_ix_const(
            RequestRandomnessParams {
                payer: ctx.accounts.payer.key(),
                oracle_queue: ctx.accounts.oracle_queue.key(),
                callback_program_id: crate::ID,
                callback_discriminator,
                accounts_metas: Some(metas),
                caller_seed: [client_seed; 32],
                callback_args: None,
            },
            PROGRAM_IDENTITY,
        );
        ctx.accounts.table.exit(&crate::ID)?;
        ctx.accounts
            .invoke_signed_vrf(&ctx.accounts.payer.to_account_info(), &ix)?;
        msg!("hh:deal-requested round={}", ctx.accounts.table.round_id);
        Ok(())
    }

    /// ER (VRF callback, TEE mode). Two cards into each private hand; the clock starts.
    pub fn callback_deal(ctx: Context<CallbackDeal>, randomness: [u8; 32]) -> Result<()> {
        let accounts = &mut *ctx.accounts;
        require!(accounts.table.phase == Phase::Dealing, HhError::WrongPhase);
        require!(accounts.table.mode == DealMode::Tee, HhError::ModeNotSupported);
        let cards = cards_from_randomness(&randomness);
        let expected = [
            accounts.table.seats[0].hand,
            accounts.table.seats[1].hand,
            accounts.table.seats[2].hand,
            accounts.table.seats[3].hand,
        ];
        let hands = [
            &mut accounts.hand0,
            &mut accounts.hand1,
            &mut accounts.hand2,
            &mut accounts.hand3,
        ];
        for (i, hand) in hands.into_iter().enumerate() {
            require_keys_eq!(hand.key(), expected[i], HhError::WrongHand);
            hand.cards = [cards[2 * i], cards[2 * i + 1]];
            hand.dealt = true;
        }
        let now = Clock::get()?.unix_timestamp;
        let table = &mut accounts.table;
        table.start_ts = now;
        table.end_ts = now + table.duration_secs as i64;
        table.phase = Phase::Trading;
        msg!("hh:dealt round={} end_ts={}", table.round_id, table.end_ts);
        Ok(())
    }

    /// ER (TEE). After the bell: copy every hand to the table and flip every hand permission public.
    pub fn reveal_hands(ctx: Context<RevealHands>) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        require!(ctx.accounts.table.mode == DealMode::Tee, HhError::ModeNotSupported);
        require!(ctx.accounts.table.phase == Phase::Trading, HhError::WrongPhase);
        require!(now >= ctx.accounts.table.end_ts, HhError::BellNotRung);
        let table_key = ctx.accounts.table.key();
        let bumps = [ctx.bumps.hand0, ctx.bumps.hand1, ctx.bumps.hand2, ctx.bumps.hand3];
        let owners = [
            ctx.accounts.hand0.owner,
            ctx.accounts.hand1.owner,
            ctx.accounts.hand2.owner,
            ctx.accounts.hand3.owner,
        ];
        let hand_cards = [
            ctx.accounts.hand0.cards,
            ctx.accounts.hand1.cards,
            ctx.accounts.hand2.cards,
            ctx.accounts.hand3.cards,
        ];
        let hands = [
            ctx.accounts.hand0.to_account_info(),
            ctx.accounts.hand1.to_account_info(),
            ctx.accounts.hand2.to_account_info(),
            ctx.accounts.hand3.to_account_info(),
        ];
        let perms = [
            ctx.accounts.permission0.to_account_info(),
            ctx.accounts.permission1.to_account_info(),
            ctx.accounts.permission2.to_account_info(),
            ctx.accounts.permission3.to_account_info(),
        ];
        let mut cards = [0u8; CARD_COUNT];
        for i in 0..SEATS {
            cards[2 * i] = hand_cards[i][0];
            cards[2 * i + 1] = hand_cards[i][1];
        }
        for i in 0..SEATS {
            UpdateEphemeralPermissionCpi {
                permissioned_account: hands[i].clone(),
                permission: perms[i].clone(),
                payer: hands[i].clone(),
                authority: hands[i].clone(),
                vault: ctx.accounts.ephemeral_vault.to_account_info(),
                magic_program: ctx.accounts.magic_program.to_account_info(),
                permission_program: ctx.accounts.permission_program.to_account_info(),
                authority_is_signer: false,
                args: EphemeralMembersArgs {
                    is_private: false,
                    members: vec![],
                },
            }
            .invoke_signed(&[&[HAND_SEED, table_key.as_ref(), owners[i].as_ref(), &[bumps[i]]]])?;
        }
        let table = &mut ctx.accounts.table;
        table.cards = cards;
        table.hidden_sum = hidden_sum(&cards);
        table.phase = Phase::Revealed;
        msg!("hh:revealed round={} hidden_sum={}", table.round_id, table.hidden_sum);
        Ok(())
    }

    /// ER. Trade against the market maker. No wallet prompt: the seat's own key signs, zero fee on the ER.
    pub fn trade(ctx: Context<Trade>, side: u8, qty: u8) -> Result<()> {
        let trader = ctx.accounts.trader.key();
        let now = Clock::get()?.unix_timestamp;
        let table = &mut ctx.accounts.table;
        require!(table.phase == Phase::Trading, HhError::WrongPhase);
        require!(now < table.end_ts, HhError::RoundClosed);
        let seat = table
            .seats
            .iter()
            .position(|s| s.owner == trader)
            .ok_or(HhError::NotSeated)?;
        let side_e = Side::from_u8(side).ok_or(HhError::BadSide)?;
        let fill = quote(table.price_c, table.seats[seat].pos, side_e, qty).map_err(|e| match e {
            TradeError::LotSize => HhError::LotSize,
            TradeError::PositionCap => HhError::PositionCap,
            TradeError::PriceBound => HhError::PriceBound,
        })?;
        table.price_c = fill.price_after_c;
        table.seats[seat].cash_c = table.seats[seat]
            .cash_c
            .checked_add(fill.cash_delta_c)
            .ok_or(HhError::MathOverflow)?;
        table.seats[seat].pos += fill.pos_delta;
        let idx = (table.trade_count as usize) % TRADE_RING;
        table.trades[idx] = TradeEntry {
            seat: seat as u8,
            side,
            qty,
            price_after_c: fill.price_after_c,
            ts: now,
        };
        table.trade_count = table.trade_count.checked_add(1).ok_or(HhError::MathOverflow)?;
        msg!("hh:trade seat={} side={} qty={} price={}", seat, side, qty, fill.price_after_c);
        Ok(())
    }

    // [hh:instructions:market]
    // [hh:instructions:settle]
    // [hh:instructions:commit-reveal]
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum DelegateTarget {
    Table { round_id: u64 },
    Hand { table: Pubkey, owner: Pubkey },
}

fn target_seeds(target: &DelegateTarget) -> Vec<Vec<u8>> {
    match target {
        DelegateTarget::Table { round_id } => vec![TABLE_SEED.to_vec(), round_id.to_le_bytes().to_vec()],
        DelegateTarget::Hand { table, owner } => vec![
            HAND_SEED.to_vec(),
            table.to_bytes().to_vec(),
            owner.to_bytes().to_vec(),
        ],
    }
}

#[derive(Accounts)]
#[instruction(round_id: u64)]
pub struct OpenTable<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Table::LEN,
        seeds = [TABLE_SEED, &round_id.to_le_bytes()],
        bump
    )]
    pub table: Box<Account<'info, Table>>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinTable<'info> {
    #[account(mut, seeds = [TABLE_SEED, &table.round_id.to_le_bytes()], bump)]
    pub table: Box<Account<'info, Table>>,
    #[account(
        init,
        payer = player,
        space = 8 + Hand::LEN,
        seeds = [HAND_SEED, table.key().as_ref(), player.key().as_ref()],
        bump
    )]
    pub hand: Account<'info, Hand>,
    #[account(mut, seeds = [VAULT_SEED, table.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,
    #[account(mut)]
    pub player: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[delegate]
#[derive(Accounts)]
pub struct DelegatePda<'info> {
    /// CHECK: the PDA to delegate (table or hand), signed for by its seeds
    #[account(mut, del)]
    pub pda: UncheckedAccount<'info>,
    pub payer: Signer<'info>,
    /// CHECK: the ER validator identity, checked by the delegation program
    pub validator: Option<UncheckedAccount<'info>>,
}

#[derive(Accounts)]
pub struct CreateTablePermission<'info> {
    #[account(mut, seeds = [TABLE_SEED, &table.round_id.to_le_bytes()], bump)]
    pub table: Box<Account<'info, Table>>,
    /// CHECK: the table's permission PDA, checked by the permission program
    #[account(mut)]
    pub permission: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: the permission program
    #[account(address = PERMISSION_PROGRAM_ID)]
    pub permission_program: UncheckedAccount<'info>,
    /// CHECK: the ephemeral vault, checked by the magic program
    #[account(mut, address = EPHEMERAL_VAULT_ID)]
    pub ephemeral_vault: UncheckedAccount<'info>,
    /// CHECK: the magic program
    #[account(address = MAGIC_PROGRAM_ID)]
    pub magic_program: UncheckedAccount<'info>,
}

#[derive(Accounts)]
#[instruction(owner: Pubkey)]
pub struct CreateHandPermission<'info> {
    #[account(seeds = [TABLE_SEED, &table.round_id.to_le_bytes()], bump)]
    pub table: Box<Account<'info, Table>>,
    #[account(
        mut,
        seeds = [HAND_SEED, table.key().as_ref(), owner.as_ref()],
        bump,
        constraint = hand.table == table.key() @ HhError::WrongHand
    )]
    pub hand: Account<'info, Hand>,
    /// CHECK: the hand's permission PDA, checked by the permission program
    #[account(mut)]
    pub permission: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: the permission program
    #[account(address = PERMISSION_PROGRAM_ID)]
    pub permission_program: UncheckedAccount<'info>,
    /// CHECK: the ephemeral vault, checked by the magic program
    #[account(mut, address = EPHEMERAL_VAULT_ID)]
    pub ephemeral_vault: UncheckedAccount<'info>,
    /// CHECK: the magic program
    #[account(address = MAGIC_PROGRAM_ID)]
    pub magic_program: UncheckedAccount<'info>,
}

#[vrf]
#[derive(Accounts)]
pub struct RequestDeal<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, seeds = [TABLE_SEED, &table.round_id.to_le_bytes()], bump)]
    pub table: Box<Account<'info, Table>>,
    /// CHECK: the VRF queue inside the ER
    #[account(mut, address = DEFAULT_EPHEMERAL_QUEUE)]
    pub oracle_queue: UncheckedAccount<'info>,
}

#[vrf_callback]
#[derive(Accounts)]
pub struct CallbackDeal<'info> {
    #[account(mut)]
    pub table: Box<Account<'info, Table>>,
    #[account(mut)]
    pub hand0: Account<'info, Hand>,
    #[account(mut)]
    pub hand1: Account<'info, Hand>,
    #[account(mut)]
    pub hand2: Account<'info, Hand>,
    #[account(mut)]
    pub hand3: Account<'info, Hand>,
}

#[derive(Accounts)]
pub struct RevealHands<'info> {
    #[account(mut, seeds = [TABLE_SEED, &table.round_id.to_le_bytes()], bump)]
    pub table: Box<Account<'info, Table>>,
    #[account(mut, seeds = [HAND_SEED, table.key().as_ref(), table.seats[0].owner.as_ref()], bump)]
    pub hand0: Account<'info, Hand>,
    #[account(mut, seeds = [HAND_SEED, table.key().as_ref(), table.seats[1].owner.as_ref()], bump)]
    pub hand1: Account<'info, Hand>,
    #[account(mut, seeds = [HAND_SEED, table.key().as_ref(), table.seats[2].owner.as_ref()], bump)]
    pub hand2: Account<'info, Hand>,
    #[account(mut, seeds = [HAND_SEED, table.key().as_ref(), table.seats[3].owner.as_ref()], bump)]
    pub hand3: Account<'info, Hand>,
    /// CHECK: hand 0's permission PDA, checked by the permission program
    #[account(mut)]
    pub permission0: UncheckedAccount<'info>,
    /// CHECK: hand 1's permission PDA
    #[account(mut)]
    pub permission1: UncheckedAccount<'info>,
    /// CHECK: hand 2's permission PDA
    #[account(mut)]
    pub permission2: UncheckedAccount<'info>,
    /// CHECK: hand 3's permission PDA
    #[account(mut)]
    pub permission3: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: the permission program
    #[account(address = PERMISSION_PROGRAM_ID)]
    pub permission_program: UncheckedAccount<'info>,
    /// CHECK: the ephemeral vault, checked by the magic program
    #[account(mut, address = EPHEMERAL_VAULT_ID)]
    pub ephemeral_vault: UncheckedAccount<'info>,
    /// CHECK: the magic program
    #[account(address = MAGIC_PROGRAM_ID)]
    pub magic_program: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct Trade<'info> {
    #[account(mut, seeds = [TABLE_SEED, &table.round_id.to_le_bytes()], bump)]
    pub table: Box<Account<'info, Table>>,
    #[account(mut)]
    pub trader: Signer<'info>,
}

// [hh:accounts:market]
// [hh:accounts:settle]
// [hh:accounts:commit-reveal]
