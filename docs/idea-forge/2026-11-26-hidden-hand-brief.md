# Idea Forge Brief — Hidden Hand: a 90-second on-chain trading pit where the market finds a sealed secret

> Working title "Hidden Hand" is provisional — the builder may rename. This brief is the single source of
> truth handed to the architect (Step 1). It is a brief, not a spec: it fixes *what* and *why*, not *how*.

## Event + constraints

- **Date written:** 2026-11-26, ~15:00 UTC (idea-forge Step 0 · `claude-opus-5-5` · tier `top` · effort `max`).
- **Hackathon:** Solana Blitz v10 — "Entertainment Finance" (host and only prize sponsor: MagicBlock). Fully online.
  - Luma: https://luma.com/hedv5sgh
  - Portal / submit: https://build.magicblock.app/?stage=blitz#submit (event id 17, stage `blitz`)
  - Resource pack (pre-verified, primary source): `docs/resources/2026-11-26-solana-blitz-v10/`
- **Hard deadline (an inert calendar fact; idea-forge does not gate on it):** **2026-11-27 14:00 UTC**
  (15:00 WAT); the runsheet's internal submit-by is 12:00 UTC. No mainnet rule: the portal "check[s] recent
  devnet and mainnet activity", so devnet integration activity counts.
- **Eligibility (verbatim):** "Every submission must integrate MagicBlock's Ephemeral Rollup or VRF. The top
  prize rewards the strongest overall build."
- **Team:** solo + AI build pipeline (architect → executor pool → reviewer). Builder skills: Solidity/DeFi,
  TypeScript/React, Python/ML. **No Rust:** every line of program code is executor-written, so the on-chain
  surface stays one small Anchor program and everything else is TS/Python.
- **Risk posture:** `safe-feasible`. The one less-trodden primitive (the Private ER read path) has a stated
  fallback that keeps the money shot (see Feasibility notes).
- **Toolchain state (tollgate 2026-11-26):** Step 2 is **BLOCKED for any custom program** until rows C1–C4
  pass: no WSL distro, no `solana` CLI / `cargo build-sbf`, anchor-cli 0.30.1 vs the 1.0.2 pin. Fix order
  C4 → C1/C2 → C3, then C7 (yarn). This holds for every eligible idea (ER delegation and VRF callbacks both
  live in your own program). It is a prerequisite the builder controls, not a blocker of this idea.

## Problem

Entertainment-finance players choose between trading games that are coin flips on a live chart (the outcome
rides a price nobody in the room controls, so skill barely matters) and hidden-information games that reward
skill but need a trusted dealer, because a public chain keeps no secrets. So the best thing markets do, turning
what each trader privately knows into one public price, has never been playable fully on-chain.

## Solution (one line)

**Hidden Hand** — a 90-second on-chain trading pit: VRF deals each player a sealed hand only they can read
(MagicBlock Private ER), everyone trades a contract worth the hidden sum of all hands on a zero-fee Ephemeral
Rollup, and at the bell the hands flip and the best trader takes the pot.

## Must-have demo features (the minimum that makes the money shot land)

1. **The sealed deal (the one custom on-chain surface: a single Anchor program).** A round's accounts are
   delegated to the Private ER. One VRF request deals every seat a private hand that only its owner can read
   (Private ER permissions), and the hidden value is the sum of every dealt card. A spectator / explorer view
   shows every other hand as unreadable.
2. **The live pit.** A zero-fee market on the ER. For ~90 seconds the human player and a few scripted bot
   traders (each bot holds its own sealed hand and trades on it) buy and sell the contract against an on-chain
   market maker. A live price chart and a trade tape show every trade, each linked to its ER transaction. No
   wallet prompt per trade.
3. **The bell.** Settlement reveals every hand on-chain, computes the hidden value and each seat's P&L, pays the
   entry pot to the top trader on-chain, and commits/undelegates the round back to Solana. A reveal overlay
   draws the hidden value across the price chart.

## Target sponsor track(s)

- **No tracks exist.** There is one leaderboard: 1st 500 · 2nd 250 · 3rd 150 USDC · Wizardio's Choice 100 USDC
  (Wizardio's criteria unpublished). Goal (runsheet): top-3 overall, in range for Wizardio's Choice.
- **Lanes from the kickoff's steer:**
  - (1) Trading game on an Ephemeral Rollup: **primary**. Zero-fee, real-time trading is the core loop.
  - (3) Skill game with real prizes: the entry pot goes to the best trader, with a private-payments cash-out
    as the stretch.
  - VRF is load-bearing (it deals the hands), but lane (2), pack opening, is not targeted.
- **Portal categories (pick ≤3):** Games · DeFi · Privacy.

## Judging criteria (published)

- **Verbatim** (portal `/api/panels` → `blitz.judging`, shown as "SELECTION CRITERIA"): "Projects are judged on
  creativity, technical depth, and how compellingly they showcase what's possible on Solana."
- **No numeric weights are published** (Luma, portal, API). The pack treats the three as equal-weight and
  unconfirmed (GAP). Wizardio's Choice criteria: unpublished.
- **Integration proof the form checks:** an "Explorer link (integration proof)" URL, plus optional on-chain
  addresses (≤28) checked against recent devnet + mainnet activity. The tooltips: "Program: your deployed
  program. Its delegations, VRF requests and private payments count." · "We check recent devnet and mainnet
  activity. Ordinary transfers and swaps don't count." MagicBlock's shared programs are rejected as "your"
  address.
- **The form also needs:**
  - a GitHub repo (public, or private with `@jonasXchen` invited)
  - a "Pitch & Demo" URL. There is no dedicated video field, but plan a video: 34 of 40 past winners linked
    one, and all 8 V8/V9 winners did.
  - Telegram sign-in, X handle(s), and a connected wallet (prizes pay there)

## Why it wins

The privacy entries among the 40 past Blitz winners hide trades (Noirwire, Eclipse, VeilMarket) or hide game
state for fairness (Blackout, Herd, Nightfall), and the trading games ride a live SOL/USD feed (HoldOut,
MagicBlock's own Binary Prediction template); Hidden Hand instead hides *information* inside a synthetic asset
and makes every trade public, so the market itself uncovers the secret, a mechanism no captured winner
description (V0's four and V4's Forge have none), MagicBlock template, or portal-listed idea uses. Against the
strongest prior art, **Blackout** (V9 2nd: Private ER, permissioned per-player views, VRF), it **wins on
creativity** because the sealed state *is* the asset's value and the payoff is a visible price-discovery reveal
rather than a fairness guarantee, and it **ties on technical depth and showcase**: both run the same
Private-ER-plus-VRF stack live, Blackout's 20-tick/s simulation is the heavier engine, and Hidden Hand adds an
on-chain market maker and pot settlement.

## Demo money shot (~15 seconds)

Ninety seconds in, the price line has climbed from 64 toward a target nobody can see, because the bots holding
high cards kept buying. The bell rings. Every sealed hand flips face-up, and the hidden sum draws in as a dotted
line at 79, close to where the price closed. The pot lands in the top trader's wallet with an explorer link. A
market has just pieced together a secret no single player held, on-chain and in real time. *(The numbers are
illustrative; they change with every deal.)*

## Out of scope (explicit, to keep the build on the money shot)

- **No live price oracle or real-world market data.** The asset is synthetic (the hidden sum), so the money shot
  never rides a live market.
- **No order book or matching engine; no leverage, margin, or liquidations.**
- **No lobby, matchmaking, profiles, or cross-round ladders.** One room, one round at a time; bots fill the
  empty seats.
- **No off-chain game server.** The deal, every trade, and settlement are authoritative on-chain; the frontend
  and the bot runner are clients only.
- **No LLM agents.** Bots are scripted (a simple rule over their own hand and the live price).
- **No NFTs / Metaplex, no token launch, no mainnet, no real funds** (devnet only).
- **No mobile / Seeker or Telegram mini-app build.**
- **Stretch goals, not must-haves (only after the money shot lands):** the winner's private cash-out through the
  Private Payments API, with a platform fee to the app's own fee vault (a third counted primitive); a crank
  that rings the bell automatically.

## Feasibility notes for the architect (primitives, not design)

### What this build touches (facts mapped from the pack; the design is yours)

- **Critical-path primitives:**
  - ER delegation on the **Private ER (devnet TEE)**
  - **VRF**
  - **Private ER permissions** (`ephemeral-rollups-sdk` feature `access-control`; with `is_private: true` only
    members can read)
  - Optional: cranks (the bell), session keys (no per-trade wallet prompt). Stretch: Private Payments API.
- **Closest official reference code** (`magicblock-labs/magicblock-engine-examples`, `main`; `DEMOS.md` and
  READMEs read via `gh api` 2026-11-26):
  - `private-counter` (TEE: "only permitted readers see the value, everyone else sees it blurred")
  - `rock-paper-scissor` ("Both moves stay private inside a TEE until the round is revealed")
  - `roll-dice` (a delegated dice account; VRF "result lands in under 200 ms")
  - `binary-prediction` (an ER market staking SPL tokens, with an e-token vault and a session signer; it reads
    a live `ephemeral-oracle` feed, which this build does not need)
  - `crank-counter` (`ScheduleTask` on the ER)
  - `magic-actions` (a post-commit base-layer handler)
- **Day-1 spike (decides the primary path vs the fallback):** on devnet-tee, confirm:
  - (a) the TS auth-token read of a permissioned account (a pack GAP)
  - (b) a VRF request + callback served inside the TEE ER (`DEFAULT_EPHEMERAL_QUEUE`)
  - (c) revealing private state at settlement

  **If they fail:** sealed hands are still reachable without a TEE via commit-reveal over VRF. Each card is
  derived from the VRF output plus a secret the player committed before the VRF request, and is checked at
  reveal. That keeps eligibility (ER + VRF), the sealed hands, and the money shot; it gives up only the
  Private ER primitive.
- **Integration proof for the form:** the deployed program's own delegations and VRF requests on devnet, plus an
  explorer link to one of those transactions. Never list MagicBlock's shared accounts (list below).
- **The one external dependency to request on day 1:** devnet SOL from the public devnet faucet, for the program
  deploy (rent scales with the `.so` size) and for round funding. The kit has no Solana faucet playbook yet
  (gate-concierge's job). Everything else is permissionless MagicBlock devnet infra: no API key, allowlist, or
  approval.
- **Longest pole / highest-effort tasks:** the Private ER permission + VRF-in-TEE deal, and the settlement/reveal
  instruction. Give them the highest reasoning effort and the most review; the frontend and the bots are
  TS/Python against fixed interfaces.
- **Pack gaps that touch this build:** the Private-ER TS auth flow, the session-keys program ID, and the Magic
  Router TS API were not extracted, and no live devnet probe of any endpoint was run.

### Verbatim from the pack: `sponsors/magicblock.md`

Source: `docs/resources/2026-11-26-solana-blitz-v10/sponsors/magicblock.md` (fetched 2026-11-26; `L####` are
line refs into `https://docs.magicblock.gg/llms-full.txt`). Spliced by script from the pack file; headings are
demoted to nest here, content unchanged.

#### ⚠️ Version pins (load-bearing)

| Item | Pin | Source |
|---|---|---|
| Solana (Agave) CLI | **3.1.9** | docs "Software / Version" tables (L867, L1533, L6410, L9269) + gachapon README `agave-install init 3.1.9` |
| Rust | **1.89.0** | same tables; `rustup install 1.89.0` |
| Anchor | **1.0.2** | same tables; `counter/anchor/Anchor.toml` + `gachapon-example/Anchor.toml` → `anchor_version = "1.0.2"`; `avm use 1.0.2` |
| Node | **24.10.0** | same tables |
| `ephemeral-rollups-sdk` (Rust) | **0.18.x** | L1721–1724: *"Use `0.18.x` with the public ERs, which run validator 1.1.1. A plain `cargo add` without a version installs `0.20.x`, the validator 2.0 line (currently only `devnet-us`), which needs `anchor-lang` 1.2.2 or later."* |
| `@magicblock-labs/ephemeral-rollups-sdk` (TS) | **0.18.0** (`yarn add @magicblock-labs/ephemeral-rollups-sdk@0.18.0`) | L6418. Also `@magicblock-labs/ephemeral-rollups-kit@0.18` (L3861). *"An unpinned `yarn add` installs v0.20.x."* (L6375) |
| `session-keys` (Rust) | **3.1.1**, `features = ["no-entrypoint"]` | L11914 |
| Session keys React | `@magicblock-labs/gum-react-sdk` | L11891 |
| Cranks | `magicblock-magic-program-api = "0.10.1"`, `bincode = "1.3.3"` | L10751 |
| Local ER validator | `npm install -g @magicblock-labs/ephemeral-validator@1.1.1` | L1187 |
| Validator versions | devnet-us = **validator 2.0**; every other public ER = **1.1.1** | L1501–1503 |

Docs caveat: *"other versions may also be compatible"*. This machine has anchor-cli 0.30.1 and no Solana CLI (see the tollgate, rows C1–C4).

#### Devnet endpoints and validator identities (verbatim, L1640–1716, L2036–2046)

| ER | RPC | Validator pubkey (pass in delegation) |
|---|---|---|
| Devnet Asia | `https://devnet-as.magicblock.app` (ws `wss://devnet-as.magicblock.app/`) | `MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57` |
| Devnet EU | `https://devnet-eu.magicblock.app` | `MEUGGrYPxKk17hCr7wpT6s8dtNokZj5U2L57vjYMS8e` |
| Devnet US (**validator 2.0**) | `https://devnet-us.magicblock.app` | `MUS3hc9TCw4cGC12vHNoYcCGzJG1txjgQLZWVoeNHNd` |
| Devnet TEE (Private ER) | `https://devnet-tee.magicblock.app/` | `MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo` |
| Magic Router Devnet | `https://devnet-router.magicblock.app` | routes each tx to the ER or the base layer |
| Solana Devnet | `https://api.devnet.solana.com` (gachapon uses `https://rpc.magicblock.app/devnet`) | — |
| Localnet ER | `localhost:7799` | `mAGicPQYBMvcYveUZA5F5UNNwyHvfYh5xkLS2Fr1mev` |

Mainnet: `as.` `MAS1Dt…`, `eu.` `MEUGGr…`, `us.` `MUS3hc…`, `mainnet-tee.` `MTEWGu…`, `as-tyo.` `MSHuBweMkNp4yPLDkPLA8bLRHbDmURWjYzsxrcBjix8`, `sa.` `MSARyz2yVTkqiYQWWgaEtUKug7oCF7PphE9GjEYHtDh` (all `*.magicblock.app`).

**Pick devnet-as or devnet-eu (1.1.1) with SDK 0.18.x.** Use devnet-us only with SDK 0.20.x.

#### Program IDs (shared accounts; the portal rejects them as "your" address)

From the portal bundle, cross-checked with the docs where noted:

| Program | Address |
|---|---|
| Delegation program | `DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh` |
| Permission / ACL (Private ER) | `ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1` |
| VRF program (`VRF_PROGRAM_ID`) | `Vrf1RNUjXmQGjmQrQLvJHs9SNkvDJEsRVFPkfSQUwGz` (docs L12948 ✓) |
| Ephemeral SPL token | `SPLxh1LVZzEkX99H6rqYizhytLWPZVV296zyYDPagv2` |
| Magic program / context | `Magic11111111111111111111111111111111111111` / `MagicContext1111111111111111111111111111111` |
| Others in the portal list (role not confirmed in docs) | `5inNvZhedNg28nwPSdZQ2tJue9VtDxgyf1oiSGbhHxuw`, `CrankS2fXgMGvQJ3VBrZmRfGrfogDY6pq5YcgkPEpSNf`, `vrfkfM4uoisXZQPrFiS2brY4oMkU9EWjyvmvqaFd5AS` |

#### 1. Ephemeral Rollups: delegate → execute → commit → undelegate

**Model:** your program's PDAs are handed to the Delegation Program. The ER validator then executes transactions on them gaslessly (~10 ms slots) and commits state back to Solana **only when your program commits** (*"the ER does not commit on a timer"*, L1738).

Rust (Anchor, SDK 0.18; L1718–1816):

```rust
use ephemeral_rollups_sdk::anchor::{commit, delegate, ephemeral};
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use ephemeral_rollups_sdk::ephem::MagicIntentBundleBuilder; // replaces deprecated commit_accounts / commit_and_undelegate_accounts

#[ephemeral]            // injects the undelegation callback (discriminator [196, 28, 41, 206, 48, 37, 51, 167])
#[program]
pub mod public_counter { /* initialize, increment, delegate, commit, undelegate */ }

#[delegate]
#[derive(Accounts)]
pub struct DelegateInput<'info> {
    pub payer: Signer<'info>,
    /// CHECK: The pda to delegate
    #[account(mut, del)]
    pub pda: AccountInfo<'info>,
}

pub fn delegate(ctx: Context<DelegateInput>) -> Result<()> {
    ctx.accounts.delegate_pda(&ctx.accounts.payer, &[COUNTER_SEED],
        DelegateConfig { validator: ctx.remaining_accounts.first().map(|acc| acc.key()), ..Default::default() })?;
    Ok(())
}

pub fn undelegate(ctx: Context<IncrementAndCommit>) -> Result<()> {
    MagicIntentBundleBuilder::new(
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.magic_context.to_account_info(),
        ctx.accounts.magic_program.to_account_info(),
    ).commit_and_undelegate(&[ctx.accounts.counter.to_account_info()]).build_and_invoke()?;
    Ok(())
}
// commit-only: `.commit(&[...])`. When mutating then committing in one ix, call `counter.exit(&crate::ID)?` before the CPI.
```

Where each call runs: `Delegate` runs on the **base layer**. `Commit` / `CommitAndUndelegate` run **on the ER**. The undelegation callback is invoked on the base layer by validator CPI.

TypeScript (L1926–2030) uses a **dual-connection pattern**:
- Provider A → `https://api.devnet.solana.com` for `initialize` and `delegate`. Pin the validator via `.remainingAccounts([{ pubkey: ER_VALIDATOR, isSigner:false, isWritable:false }])`.
- Provider B → `https://devnet-as.magicblock.app/` for `increment` and `undelegate`. Set `tx.feePayer`, fetch the blockhash **from the ER connection**, sign, then `sendAndConfirm`.
- The alternative is Magic Router (`devnet-router.magicblock.app`), which auto-routes.

**Fees (L4881–4896; values "checked on November 19, 2026"):**

| Charge | Price |
|---|---|
| Normal ER transaction | `0` in the current release |
| One delegation session | 0.003 SOL, taken from the Solana deposit at undelegate |
| Commits after the first | 0.001 SOL each, taken from the deposit |
| Live commits starting at commit 26 | 0.001 SOL per account, from the delegated fee payer |
| Callback | 5,000 lamports |

Commit limit: *"Without a delegated fee payer, an account can commit 10 times. For a longer session, add a delegated fee payer and `magic_fee_vault`."* (L4868)

**Runtime limits (L5246–5253):**

| Limit | Value |
|---|---|
| Compute units | 200k per instruction / 1.4M per transaction |
| Transaction size on the ER | **64 KB** (vs 1,232 bytes on Solana) |
| Committable account size | **10,240 bytes** |
| ER slot time | ~10 ms |

#### 2. VRF (L12826–12955, L13177–13402)

Install: `cargo add ephemeral-rollups-sdk@0.18 --features anchor,vrf` and `cargo add anchor-lang --features init-if-needed`.

> ⚠️ *"Without `@0.18`, `cargo add` installs 0.20 … Its `#[vrf]` macro also fails to compile on 0.20.0 (`cannot find slot_hashes in sysvar`) … `create_request_scoped_randomness_ix` from SDK 0.16 was removed in 0.17."*

```rust
use ephemeral_rollups_sdk::{anchor::{vrf, vrf_callback}, vrf::{self, consts::program_identity_pubkey,
    instructions::{create_request_randomness_ix_const, RequestRandomnessParams}, types::SerializableAccountMeta}};
const PROGRAM_IDENTITY: Pubkey = program_identity_pubkey(&crate::ID);

pub fn roll_dice(ctx: Context<DoRollDiceCtx>, client_seed: u8) -> Result<()> {
    let params = RequestRandomnessParams {
        payer: ctx.accounts.payer.key(),
        oracle_queue: ctx.accounts.oracle_queue.key(),
        callback_program_id: ID,
        callback_discriminator: instruction::CallbackRollDice::DISCRIMINATOR.to_vec(),
        caller_seed: [client_seed; 32],
        accounts_metas: Some(vec![SerializableAccountMeta { pubkey: ctx.accounts.player.key(), is_signer: false, is_writable: true }]),
        callback_args: Some(vec![client_seed]),
        ..Default::default()
    };
    let ix = create_request_randomness_ix_const(params, PROGRAM_IDENTITY);
    ctx.accounts.invoke_signed_vrf(&ctx.accounts.payer.to_account_info(), &ix)?;
    Ok(())
}
pub fn callback_roll_dice(ctx: Context<CallbackRollDiceCtx>, randomness: [u8; 32], client_seed: u8) -> Result<()> {
    let rnd_u8 = vrf::rnd::random_u8_with_range(&randomness, 1, 6); /* … */ Ok(())
}
#[vrf] #[derive(Accounts)] pub struct DoRollDiceCtx<'info> { #[account(mut)] pub payer: Signer<'info>, /* player */
    /// CHECK: oracle queue — constraint = key ∈ {DEFAULT_QUEUE, DEFAULT_TEST_QUEUE, DEFAULT_EPHEMERAL_QUEUE, DEFAULT_EPHEMERAL_TEST_QUEUE}
    #[account(mut)] pub oracle_queue: UncheckedAccount<'info> }
#[vrf_callback] #[derive(Accounts)] pub struct CallbackRollDiceCtx<'info> { #[account(mut)] pub player: Account<'info, Player> }
```

**Constants (`ephemeral_rollups_sdk::vrf::consts`, L12946–12953):**

| Constant | Address |
|---|---|
| `VRF_PROGRAM_ID` | `Vrf1RNUjXmQGjmQrQLvJHs9SNkvDJEsRVFPkfSQUwGz` |
| `DEFAULT_QUEUE` (base layer, mainnet **and devnet**) | `Cuj97ggrhhidhbu39TijNVqE74xvKJ69gDervRUXAxGh` |
| `DEFAULT_EPHEMERAL_QUEUE` (inside an ER, mainnet and devnet) | `5hBR571xnXppuCPveTrctfTU7tJLSN94nq7kv7FRK5Tc` |
| `DEFAULT_TEST_QUEUE` / `DEFAULT_EPHEMERAL_TEST_QUEUE` (localnet) | `GKE6d7iv8kCBrsxr78W3xVdjGLLLJnxsGiuzrsZCGEvb` / `Sc9MJUngNbQXSXGP3F67KvKwVnhaYn6kcioxXNVowYT` |
| `VRF_PROGRAM_IDENTITY` (legacy; **deprecated**, don't check it) | `9irBy75QS2BN81FUgXuHcjqceJJRuc9oDkAe8TKVvvAw` |

**VRF gotchas:**
- Callbacks are signed by the scoped `PDA(["identity", your_program_id], VRF_PROGRAM_ID)`, and `#[vrf_callback]` checks it.
- **Don't** declare your own `vrf_program_identity` field. If you do, the macro skips its check and every request fails with Anchor error 2012 `ConstraintAddress` (L13285).
- Use the queue that matches where the tx runs: `DEFAULT_QUEUE` on Solana, `DEFAULT_EPHEMERAL_QUEUE` in an ER (already delegated, so there's nothing to delegate).

**Pricing (L13205–13230):**

| Request type | Price |
|---|---|
| ER queue (<50 ms) | **Free** |
| Solana (<500 ms) | **0.0008 SOL** per request |

The fee is not refunded if a request expires.

#### 3. Private payments and the Private ER (TEE)

**Private ER:** an ER inside a TEE on **Intel TDX**.
- Devnet TEE: `https://devnet-tee.magicblock.app/`, validator `MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo`.
- Permission program: `ACLseo…`, configured through `ephemeral-rollups-sdk = { version = "0.18", features = ["anchor", "access-control"] }` (L8036).
- Member flags `AUTHORITY`, `TX_LOGS`, `TX_BALANCES`, `TX_MESSAGE`, `ACCOUNT_SIGNATURES`. With `is_private: true`, only members can read the account (L7865–7881).
- **GAP:** the TS auth-token flow for reading from the TEE RPC wasn't extracted (time box). See `/pages/private-ephemeral-rollups-pers/how-to-guide/quickstart` (L9115).

**Private Payments API** (hosted; returns *unsigned* transactions):
- Base URL `https://payments.magicblock.app`, reference at `payments.magicblock.app/reference`. The OpenAPI `servers` entry lists it as "Mainnet - Private Payments API"; devnet is selected per request with `cluster: "devnet"` or `"devnet-private"`.
- **Privacy needs `cluster` = `devnet-private` / `mainnet-private`**. Plain `devnet` routes to the public ER (L6170).
- Endpoints:
  - `GET /v1/spl/challenge?pubkey=&cluster=`, then `POST /v1/spl/login` (bearer token)
  - `POST /v1/spl/deposit` (`private: true`; response includes `sendTo: base|ephemeral`)
  - `POST /v1/spl/transfer`
  - `POST /v1/spl/withdraw`
  - `GET /v1/spl/balance`, `GET /v1/spl/private-balance` (auth)
  - `POST|GET /v1/spl/stealth-pool` (handles like `alice@magicblock.id`, 1–10 keys)
  - `POST /v1/transaction/send`
  - also swap quote/swap, initialize-mint, transfer-queue ensure-crank, and an MCP endpoint
- `POST /v1/spl/transfer` (OpenAPI, fetched):
  - Required fields: `from`, `to`, `mint`, `amount`.
  - Optional fields:
    - routing and balances: `cluster`, `visibility` (`public`/`private`, **default `private`**), `fromBalance`/`toBalance` (`base`/`ephemeral`), `exactOut`, `validator`
    - initialization: `initIfMissing`, `initAtasIfMissing`, `initVaultIfMissing`
    - fees: **`platformFeeBps`** (0–10000), **`platformFeeAccount`**
    - private transfers only: `memo`, `minDelayMs`/`maxDelayMs`, `clientRefId`, `split` (1–15)
    - `gasless`, `legacy`
- **`platformFeeAccount`** (verbatim): *"Required when platformFeeBps is greater than 0. Token account (not a wallet address) that collects the platform fee, for the transferred mint, e.g. the fee collector's USDC ATA for a USDC transfer … Expected to already exist on-chain; the API does not verify it, so a wallet address, uninitialized ATA, or wrong-mint token account still returns 200 and the built transaction fails at simulation."* This is the portal's **"Fee vault"** address.
- Fees (L6254–6274):
  - **0.1% privacy fee** on private base→base transfers, charged in tokens.
  - `gasless: true` adds a flat **0.2 USDC/USDT** relay fee, with a min of **0.5 USDC/USDT**. Gasless mints: mainnet USDC/USDT and **devnet USDC**.
  - Per-transfer setup charge of **4,539,280 lamports (~0.00454 SOL) on devnet** (2,039,280 on mainnet).
- Privacy reduces *linkability*: *"The amount is visible on the base layer."*
- Reference: on-chain program `github.com/magicblock-labs/ephemeral-spl-token`; demo apps `one.magicblock.app` and `spl-demo.magicblock.app`.

#### 4. Cranks / automation (L10695–10870)

- Schedule a task **on the ER** by CPI to the Magic program with `MagicBlockInstruction::ScheduleTask(ScheduleTaskArgs { task_id, execution_interval_millis, iterations, instructions })`, serialized with `bincode`. Accounts: payer (signer), the target PDA.
- Gotchas:
  - On **validator 1.1.1, `task_id`s are shared across all programs**. A colliding ID still "succeeds" but the task never runs, so derive a unique ID rather than hardcoding `1`.
  - On devnet-us (2.0), cranks run through Hydra, and `ScheduleTask` rejects signer accounts in the scheduled ix.
  - Scheduled instructions are publicly callable, so guard privileged ones.
  - Use `AccountInfo` (not `Account<T>`) for the PDA in the scheduling context, to avoid stale re-serialization.

#### 5. Session keys and zero-fee transactions

- Rust: `session-keys = { version = "3.1.1", features = ["no-entrypoint"] }`.
  - Imports: `use session_keys::{SessionError, SessionToken, session_auth_or, Session};`
  - Derive `#[derive(Accounts, Session)]`.
  - Add the field `#[session(signer = signer, authority = counter.authority.key())] pub session_token: Option<Account<'info, SessionToken>>`.
  - Gate with `#[session_auth_or(ctx.accounts.counter.authority.key() == ctx.accounts.signer.key(), SessionError::InvalidToken)]`.
- React: `@magicblock-labs/gum-react-sdk` (`SessionWalletProvider`, `useSessionKeyManager().createSession` / `revokeSession`). These create **V1** tokens. V2 (`create_session_v2`) is not interchangeable: mixing them gives error 3002 `AccountDiscriminatorMismatch` (L11925–11932).
- **GAP:** the session-keys program ID wasn't extracted.
- Zero-fee: *"Normal ER transaction: `0` in the current release"*. The Private Payments API also offers `gasless: true` for USDC.

#### Examples repo: `github.com/magicblock-labs/magicblock-engine-examples` (main, pushed 2026-11-26)

Folders: `binary-prediction`, `counter` (anchor / native-rust / pinocchio), `crank-counter`, `delegation-actions`, `ephemeral-account-chats`, **`gachapon-example`** (VRF → Metaplex Core NFT, devnet program `5q1a1rA56zJTmEUeNdceFGPR6QQRWYmFJjckucTadnDd`, Metaplex Core `CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d`), `gasless-starter`, `magic-actions`, `oncurve-delegation`, `oracle-priced-purchase`, `private-counter`, `private-payments`, `rewards-delegated-vrf`, `rock-paper-scissor`, `roll-dice`, `sealed-auction`, `session-keys`, `spl-tokens`, `test-utils`, `00-LEGACY_EXAMPLES`.

Tests in gachapon use **MagicSVM** (`tests-magicsvm-rs/`). The local dev stack is `mb-test-validator` (8899/8900, pre-clones the delegation and permission programs) plus `ephemeral-validator` (L8826).

**AI dev skill (official):** `npx skills add https://github.com/magicblock-labs/magicblock-dev-skill`. The docs say: *"Hit an error? Ask your coding agent with the skill installed, not the docs assistant."* Worth installing in the project repo at Step 2 (architect's call).

#### Gaps in this file

- Private-ER TS auth flow (`getAuthToken` / integrity check) not extracted.
- Session-keys program ID not extracted.
- Magic Router TS API, and the `ephemeral-rollups-kit` vs `-sdk` difference, not extracted.
- Roles of `5inNvZ…`, `CrankS2…` and `vrfkfM4…` not confirmed in the docs.
- No live devnet probe of any endpoint was run. Facts come from the docs only.

### Verbatim from the pack: `event.md` (on-chain address rules)

- **On-chain address rules (verbatim tooltip):**
  > "Add the addresses your app runs through. We work out what each one is."
  > "**Program:** your deployed program. Its delegations, VRF requests and private payments count."
  > "**Wallet:** your relayer, fee payer or app wallet. Private payments it signs count."
  > "**Fee vault:** receives your app's private payment fees (your `platformFeeAccount` or its owner wallet). Every payment that pays your fee counts."
  > "We check recent devnet and mainnet activity. Ordinary transfers and swaps don't count."
- **Shared accounts are rejected** ("That's a shared account. Add your app's own address"). The list: MagicBlock's delegation `DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh`, ACL `ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1`, VRF `Vrf1RNUjXmQGjmQrQLvJHs9SNkvDJEsRVFPkfSQUwGz`, SPL `SPLxh1LVZzEkX99H6rqYizhytLWPZVV296zyYDPagv2`, `5inNvZhedNg28nwPSdZQ2tJue9VtDxgyf1oiSGbhHxuw`, `CrankS2fXgMGvQJ3VBrZmRfGrfogDY6pq5YcgkPEpSNf`, `vrfkfM4uoisXZQPrFiS2brY4oMkU9EWjyvmvqaFd5AS`, `Magic11111111111111111111111111111111111111`, `MagicContext1111111111111111111111111111111`, System, Token, Token-2022, ATA.

## Rubric mapping (why this won, for the record)

Scored on the four axes of `references/ideation-rubric.md`, re-mapped to the event's three published,
unweighted criteria: creativity → Novelty, "technical depth" → folded into Theme fit, "showcase what's possible
on Solana" → Demo WOW + story. The three get equal shares, intrinsic buildability stays highest (floor 30), and
`safe-feasible` moves 5 points from Novelty to buildability: **Intrinsic buildability 40 · Showcase (Demo WOW +
story) 22 · Theme fit + MagicBlock technical depth 22 · Creativity (Novelty) 16.** The field had 35 candidates
(25 plus 10 bolder-pass rewrites). Three were knocked out at the gate: one needed live sports scores, one needed
physical card inventory, and one needed a streaming-platform API plus a human resolver.

| Candidate | Build ×40 | Showcase ×22 | Fit + depth ×22 | Creativity ×16 | Total |
|---|:-:|:-:|:-:|:-:|:-:|
| **Hidden Hand** (sealed-signal trading pit) | 4 | 5 | 5 | 5 | **460** |
| Collect-to-win set jackpot (VRF pieces from a fixed print run) | 5 | 4 | 4 | 3 | 424 |
| Finite-pool pack exchange (every pull reprices the sealed packs) | 4 | 4 | 5 | 4 | 422 |
| On-chain race + in-play parimutuel book | 4 | 5 | 4 | 4 | 422 |
| Tug-of-war tape (price = two teams' net order flow) | 5 | 4 | 3 | 4 | 418 |

The judge's-eye head-to-head held Hidden Hand's scores: it won on creativity, with ties on depth and showcase
against Blackout, and its privacy produces a visible signal where a hidden order book shows nothing. **The win
depends on buildability 4** (at 3 it would score 420 and lose). That holds because MagicBlock runs two TEE
templates live on devnet, at least 11 past Blitz winners shipped on the Private ER/TEE, and the commit-reveal
fallback keeps the money shot without a TEE.
