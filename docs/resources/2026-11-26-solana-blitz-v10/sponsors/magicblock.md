# MagicBlock — what they reward and the architect's feasibility fuel

Fetched 2026-11-26. Primary sources:
- **Canonical docs: `docs.magicblock.gg`.** `docs.magicblock.xyz` returns `301 → https://docs.magicblock.gg/`. Read via the Mintlify `llms-full.txt` dump (493 KB, 13,417 lines).
- The examples repo `magicblock-labs/magicblock-engine-examples`, read via `gh api`; last push 2026-11-26T13:14Z.
- The payments OpenAPI.
- The portal bundle.

Line refs below (`L1234`) point into `https://docs.magicblock.gg/llms-full.txt` as of the fetch date.

## What they reward

- Eligibility: *"Every submission must integrate MagicBlock's Ephemeral Rollup or VRF."*
- Judging: *"creativity, technical depth, and how compellingly they showcase what's possible on Solana."*
- On-chain activity that counts: **delegations, VRF requests, private payments** from your own program, wallet or fee vault, on devnet or mainnet. *"Ordinary transfers and swaps don't count."* (See event.md.)
- What the theme pitches: "zero-fee transactions, VRF and privacy".

## ⚠️ Version pins (load-bearing)

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

## Devnet endpoints and validator identities (verbatim, L1640–1716, L2036–2046)

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

## Program IDs (shared accounts; the portal rejects them as "your" address)

From the portal bundle, cross-checked with the docs where noted:

| Program | Address |
|---|---|
| Delegation program | `DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh` |
| Permission / ACL (Private ER) | `ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1` |
| VRF program (`VRF_PROGRAM_ID`) | `Vrf1RNUjXmQGjmQrQLvJHs9SNkvDJEsRVFPkfSQUwGz` (docs L12948 ✓) |
| Ephemeral SPL token | `SPLxh1LVZzEkX99H6rqYizhytLWPZVV296zyYDPagv2` |
| Magic program / context | `Magic11111111111111111111111111111111111111` / `MagicContext1111111111111111111111111111111` |
| Others in the portal list (role not confirmed in docs) | `5inNvZhedNg28nwPSdZQ2tJue9VtDxgyf1oiSGbhHxuw`, `CrankS2fXgMGvQJ3VBrZmRfGrfogDY6pq5YcgkPEpSNf`, `vrfkfM4uoisXZQPrFiS2brY4oMkU9EWjyvmvqaFd5AS` |

## 1. Ephemeral Rollups: delegate → execute → commit → undelegate

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

## 2. VRF (L12826–12955, L13177–13402)

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

## 3. Private payments and the Private ER (TEE)

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

## 4. Cranks / automation (L10695–10870)

- Schedule a task **on the ER** by CPI to the Magic program with `MagicBlockInstruction::ScheduleTask(ScheduleTaskArgs { task_id, execution_interval_millis, iterations, instructions })`, serialized with `bincode`. Accounts: payer (signer), the target PDA.
- Gotchas:
  - On **validator 1.1.1, `task_id`s are shared across all programs**. A colliding ID still "succeeds" but the task never runs, so derive a unique ID rather than hardcoding `1`.
  - On devnet-us (2.0), cranks run through Hydra, and `ScheduleTask` rejects signer accounts in the scheduled ix.
  - Scheduled instructions are publicly callable, so guard privileged ones.
  - Use `AccountInfo` (not `Account<T>`) for the PDA in the scheduling context, to avoid stale re-serialization.

## 5. Session keys and zero-fee transactions

- Rust: `session-keys = { version = "3.1.1", features = ["no-entrypoint"] }`.
  - Imports: `use session_keys::{SessionError, SessionToken, session_auth_or, Session};`
  - Derive `#[derive(Accounts, Session)]`.
  - Add the field `#[session(signer = signer, authority = counter.authority.key())] pub session_token: Option<Account<'info, SessionToken>>`.
  - Gate with `#[session_auth_or(ctx.accounts.counter.authority.key() == ctx.accounts.signer.key(), SessionError::InvalidToken)]`.
- React: `@magicblock-labs/gum-react-sdk` (`SessionWalletProvider`, `useSessionKeyManager().createSession` / `revokeSession`). These create **V1** tokens. V2 (`create_session_v2`) is not interchangeable: mixing them gives error 3002 `AccountDiscriminatorMismatch` (L11925–11932).
- **GAP:** the session-keys program ID wasn't extracted.
- Zero-fee: *"Normal ER transaction: `0` in the current release"*. The Private Payments API also offers `gasless: true` for USDC.

## Examples repo: `github.com/magicblock-labs/magicblock-engine-examples` (main, pushed 2026-11-26)

Folders: `binary-prediction`, `counter` (anchor / native-rust / pinocchio), `crank-counter`, `delegation-actions`, `ephemeral-account-chats`, **`gachapon-example`** (VRF → Metaplex Core NFT, devnet program `5q1a1rA56zJTmEUeNdceFGPR6QQRWYmFJjckucTadnDd`, Metaplex Core `CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d`), `gasless-starter`, `magic-actions`, `oncurve-delegation`, `oracle-priced-purchase`, `private-counter`, `private-payments`, `rewards-delegated-vrf`, `rock-paper-scissor`, `roll-dice`, `sealed-auction`, `session-keys`, `spl-tokens`, `test-utils`, `00-LEGACY_EXAMPLES`.

Tests in gachapon use **MagicSVM** (`tests-magicsvm-rs/`). The local dev stack is `mb-test-validator` (8899/8900, pre-clones the delegation and permission programs) plus `ephemeral-validator` (L8826).

**AI dev skill (official):** `npx skills add https://github.com/magicblock-labs/magicblock-dev-skill`. The docs say: *"Hit an error? Ask your coding agent with the skill installed, not the docs assistant."* Worth installing in the project repo at Step 2 (architect's call).

## Gaps in this file

- Private-ER TS auth flow (`getAuthToken` / integrity check) not extracted.
- Session-keys program ID not extracted.
- Magic Router TS API, and the `ephemeral-rollups-kit` vs `-sdk` difference, not extracted.
- Roles of `5inNvZ…`, `CrankS2…` and `vrfkfM4…` not confirmed in the docs.
- No live devnet probe of any endpoint was run. Facts come from the docs only.
