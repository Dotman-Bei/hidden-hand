# Hidden Hand: wallet mode (mid-build amendment)

**Amends:** `docs/superpowers/specs/2026-11-26-hidden-hand-design.md` (additive subtree, `references/roles.md` §Mid-build regeneration; no task in flight, landed at a checkpoint).
**Branch:** `wallet-mode`. `main`, hiddenhand.suitz.xyz and the submission draft on the platform do not change until the user's GO (task `gates:30`).
**Target:** Solana devnet, the deployed program `HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb`, the MagicBlock Private ER (TEE) at `https://devnet-tee.magicblock.app`.
**Deadline:** event 2026-11-27 14:00 UTC; user submit-by 12:00 UTC; build ≤ 2 h (by ~11:15Z); user's manual test 11:15–12:15Z; **GO/NO-GO 11:30Z**: if a full wallet round has not passed on the user's machine, wallet mode is dropped and `main` ships as is.

## Goal

`/app/` becomes a live, self-serve pit played with the visitor's real wallet (Phantom, Solflare or Backpack on devnet) and real popups, instead of a throwaway browser key plus the runner script. The runner flow stays as **Express mode**.

## Hard constraints (verbatim from the user, condensed)

1. **No program change, no redeploy.** Everything is client-side. Verified in `program/programs/hidden-hand/src/lib.rs`: only `open_table` (`authority`), `join_table` (`player`, who also pays the hand rent and the entry) and `trade` (`trader`) need a specific signer. `delegate_pda`, `create_table_permission`, `create_hand_permission`, `request_deal`, `reveal_hands`, `settle_round` and `claim_pot` take any funded `payer`. The Hand permission member is a passed pubkey (`create_hand_permission(owner)`). `claim_pot` pays `table.seats[winner].owner`.
2. **The player is the user's wallet.** Its popups: `join_table` (signTransaction), the TEE auth token (signMessage, `getAuthToken(rpcUrl, pubkey, signMessage)`), every trade (signTransaction of a tx built for the TEE connection and sent by the app), and one funding transfer. The **house** key and **three bot** keys are generated in the tab, funded by that one transfer, held in memory and sessionStorage only, and swept back to the wallet at the end of the round. The seat key of the user is never generated: the seat owner is the wallet pubkey.
3. **Express mode stays.** The burner seat, the runner-printed `/app/?round=<id>` link and `?mode=express` keep today's code path byte-for-byte (`useRound.ts`, `burner.ts`, `bots/src/runner.ts` untouched); its gates stay green. Wallet mode is the default for visitors; the copy states both honestly.
4. **UX facts are shown, not hidden:** one popup per trade (popup counter, round timer, lot 1–5 per popup, the hint "Your hand is worth +N contracts"); a balance precheck naming the exact devnet SOL needed, with a faucet.solana.com link when short; explicit states (connect / insufficient funds / funding / opening / joining / signing in / dealing / trading / bell / settled / claim / error with retry); the wallet's simulation warning on Rollup transactions explained in the UI; the honest line that a random or idle human breaks the reveal (bots fill the other 3 seats).
5. **Testing:** unit tests with a mock Wallet Standard wallet backed by a local keypair; a devnet integration script that runs the same orchestration code in Node with the mock wallet signing for real (human gate, the `.env` burner plays the wallet); a manual Phantom checklist run by the user (human gate); the taste-skill gate and its §5 checklist on every UI task.
6. **Isolation:** branch `wallet-mode`; Vercel preview first; production and the merge only on the user's go (human gates).

## Design decisions (made by the user or derived; no brainstorm)

| # | Decision | Source |
|---|---|---|
| D1 | Wallets connect through the **Wallet Standard** directly (`@wallet-standard/app` `getWallets()`, features `standard:connect`, `solana:signTransaction`, `solana:signMessage`, chain `solana:devnet`). No `@solana/wallet-adapter-react-ui`: its modal would set visual decisions, and design-taste-frontend is the only visual authority. Phantom, Solflare and Backpack all register as Wallet Standard wallets. | user (Wallet Standard allowed) + FRONTEND SOURCE OF TRUTH |
| D2 | Wallet mode is **TEE only** (`DealMode "tee"`, the Private ER). The wallet reads its own hand through a TEE connection authorized by its signMessage token; `reveal_hands` is house-paid, so the human never acts at the bell. | user (sealed hands on the Private ER) + lib.rs |
| D3 | In-tab keys: `house` + `bots[0..2]` from `Keypair.generate()`, kept in memory and mirrored to `sessionStorage["hh-wallet-round-v1"]` so a reload can still sweep. Never localStorage, never sent anywhere, never printed. | user |
| D4 | **Funding = one base-layer tx signed by the wallet with 4 `SystemProgram.transfer`s** (house + 3 bots). Amounts come from `walletRoundBudget(rent)`. Precheck: wallet balance ≥ `budget.total` before the first popup. | user (one funding transfer) |
| D5 | Popup order: **fund → join (seat 0) → sign in (signMessage) → trades**. The wallet joins before the bots, so a rejected join aborts before the bots pay their entries. | derived |
| D6 | Rollup tx path: build with the blockhash of the **wallet's own TEE connection**, `feePayer = wallet`, `signTransaction`, `sendRawTransaction(skipPreflight)` on that connection, confirm by signature (same path `sendIxs` proves on the TEE). Never `signAndSendTransaction` (the wallet would send to base devnet). | user + client/src/tx.ts |
| D7 | Orchestration: new browser-safe `bots/src/house-round.ts`. Every chain call goes through a `HouseIo` interface (`bots/src/house-io.ts` is the live one), so the round is unit-tested with a fake chain and the Node integration script runs the very same code. `bots/src/runner.ts` stays untouched (Express regression safety beats deduplication today). | user (port the runner) + constraint 3 |
| D8 | **Sweep always runs** (success, error, abort): each bot and then the house send their balance minus the 5000-lamport fee to the wallet. A pot a bot wins comes back the same way. Leftover keys found in sessionStorage on load offer "Sweep leftover SOL". | user |
| D9 | Routing: `/app/` (no params) is wallet mode; `/app/?round=<id>` or `?mode=express` is Express (today's code path). `web/app/index.html` carries `<meta name="hh-play-modes" content="wallet express">` as the deploy marker. | user |
| D10 | Wallet rounds last 90 s with the bot policy unchanged (`decide`, `personaFor`, `mulberry32`). | derived |
| D11 | The wallet simulates Rollup transactions against base devnet, where the table is owned by the delegation program, so its preview fails or warns. The UI explains this before the first trade ("Your wallet previews this on Solana, where the table is locked to the Rollup; the warning is expected; the trade runs on the Rollup"). | user (UX fact 4) |
| D12 | **Risk: the ER blockhash window vs. human popup latency.** The blockhash is fetched immediately before each popup; an expired-blockhash failure is shown as "That signature took too long for the Rollup; sign again" and is not counted as a trade. The integration run measures the window with one 8-second delayed signature and records it in the proof. | derived (new risk) |
| D13 | Risk: a wallet that edits the transaction it signs (for example, adds instructions) would break Rollup txs. `standardSigner` returns what the wallet signed. The manual checklist checks that trades land, and Express mode is the fallback. | derived |

## Budget (D4)

`walletRoundBudget({ tableRent, handRent })`, rents from `getMinimumBalanceForRentExemption(program.account.table.size | program.account.hand.size)`:
- bot = `ENTRY_LAMPORTS + handRent + 2_000_000` (entry, hand rent, fees)
- house = `tableRent + 5 × 4_000_000 + 5_000_000` (table rent, 5 delegation records, fees)
- wallet = `ENTRY_LAMPORTS + handRent + 2_000_000` (own seat, fund + join fees)
- total = house + 3 × bot + wallet. It is about 0.11 SOL. The integration proof records the measured spend; whatever is left comes back in the sweep.

## Subtree (plan `docs/superpowers/plans/2026-11-27-wallet-mode.md`)

Critical path: `client:22` wallet signer layer → `bots:23` browser-safe round → (`bots:24` integration script ∥ `web:26` wallet UI) → `gates:25` devnet wallet round → `docs:27` copy → `gates:28` Vercel preview → `gates:29` the user's Phantom test → `gates:30` merge + production (GO only).

## Out of scope

Program changes; commit-reveal in wallet mode; a server; mainnet; mobile wallet deep links; recording a new demo video (the recorded video shows Express mode and stays valid).
