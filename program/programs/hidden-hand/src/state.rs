use anchor_lang::prelude::*;

pub const TABLE_SEED: &[u8] = b"table";
pub const HAND_SEED: &[u8] = b"hand";
pub const VAULT_SEED: &[u8] = b"vault";
pub const TRADE_RING: usize = 128;
pub const NO_WINNER: u8 = 255;
pub const MIN_DURATION_SECS: u16 = 30;
pub const MAX_DURATION_SECS: u16 = 180;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum DealMode {
    Tee,
    CommitReveal,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum Phase {
    Open,
    Dealing,
    Trading,
    Revealed,
    Settled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default, PartialEq, Eq, Debug)]
pub struct Seat {
    pub owner: Pubkey,
    pub hand: Pubkey,
    pub cash_c: i64,
    pub pos: i32,
    pub commitment: [u8; 32],
    pub revealed: bool,
}
impl Seat {
    pub const LEN: usize = 32 + 32 + 8 + 4 + 32 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default, PartialEq, Eq, Debug)]
pub struct TradeEntry {
    pub seat: u8,
    pub side: u8, // 0 = buy, 1 = sell
    pub qty: u8,
    pub price_after_c: u32,
    pub ts: i64,
}
impl TradeEntry {
    pub const LEN: usize = 1 + 1 + 1 + 4 + 8;
}

#[account]
pub struct Table {
    pub round_id: u64,
    pub authority: Pubkey,
    pub mode: DealMode,
    pub phase: Phase,
    pub duration_secs: u16,
    pub entry_lamports: u64,
    pub seat_count: u8,
    pub seats: [Seat; 4],
    pub price_c: u32,
    pub start_ts: i64,
    pub end_ts: i64,
    pub seed: [u8; 32],
    pub cards: [u8; 8],
    pub hidden_sum: u16,
    pub winner: u8,
    pub pnl_c: [i64; 4],
    pub paid: bool,
    pub trade_count: u32,
    pub trades: [TradeEntry; 128],
}
impl Table {
    pub const LEN: usize = 8 + 32 + 1 + 1 + 2 + 8 + 1 + Seat::LEN * 4 + 4 + 8 + 8 + 32 + 8 + 2 + 1 + 8 * 4 + 1 + 4
        + TradeEntry::LEN * TRADE_RING;
}

#[account]
pub struct Hand {
    pub table: Pubkey,
    pub owner: Pubkey,
    pub seat: u8,
    pub cards: [u8; 2],
    pub dealt: bool,
}
impl Hand {
    pub const LEN: usize = 32 + 32 + 1 + 2 + 1;
}
