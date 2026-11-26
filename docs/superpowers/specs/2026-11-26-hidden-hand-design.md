# Hidden Hand — design spec

> Single source of truth for *what* is built. Brief: `docs/idea-forge/2026-11-26-hidden-hand-brief.md`.
> Pack: `docs/resources/2026-11-26-solana-blitz-v10/`. Tollgate: `docs/tollgate/2026-11-26-tollgate.md`.
> Architect: Step 1, `claude-opus-5-5`, tier `top`, effort `xhigh`, 2026-11-26.

## Header (verbatim constraints)

- **Target:** Solana **devnet only** (no mainnet, no real funds). One small Anchor program.
- **Pins:** Anchor **1.0.2** · Agave/Solana **3.1.9** · Rust **1.89.0** (program build; `stable` for host tests is not needed) ·
  `ephemeral-rollups-sdk` **0.18.0** (Rust, features `anchor`, `access-control`, `vrf`) · `@magicblock-labs/ephemeral-rollups-sdk`
  **0.18.0** (TS) · never 0.20.x. `@coral-xyz/anchor` **0.32.1** (the TS client MagicBlock's own Anchor-1.0.2 examples use).
- **ER:** Private ER `https://devnet-tee.magicblock.app` (validator `MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo`) on the
  primary path; public ER `https://devnet-as.magicblock.app` (validator `MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57`) on the
  fallback path. Base layer `https://api.devnet.solana.com`. VRF queue inside the ER: `DEFAULT_EPHEMERAL_QUEUE`
  `5hBR571xnXppuCPveTrctfTU7tJLSN94nq7kv7FRK5Tc`.
- **Build environment:** the program builds and tests **inside WSL `Ubuntu-24.04`, user root, on the WSL filesystem**
  (`/root/hidden-hand`), never under `/mnt/c` and never under the Windows path with a space. Invocation (tollgate
  §"WSL invocation"): `wsl -d Ubuntu-24.04 -u root --exec bash -l <script>`. TS packages build and test on **Windows**
  (Node 22, pnpm 10) from the repo root.
- **Frontend:** TypeScript/React; `design-taste-frontend` (installed at `~/.claude/skills/design-taste-frontend/`) is the
  only source of truth for every visual decision. **Bots:** scripted TypeScript clients. No LLM agents, no off-chain
  game server.
- **Deadline:** **2026-11-27 14:00 UTC** (15:00 WAT) hard; internal submit-by 12:00 UTC; build green by 07:00 UTC or
  scope is cut.
- **Out of scope (verbatim from the brief):** no live price oracle or real-world market data; no order book or
  matching engine; no leverage, margin, or liquidations; no lobby, matchmaking, profiles, or cross-round ladders (one
  room, one round at a time; bots fill the empty seats); no off-chain game server; no LLM agents; no NFTs / Metaplex,
  no token launch, no mainnet, no real funds; no mobile / Seeker or Telegram mini-app build. Stretch (NOT in either
  manifest): private-payments cash-out, a crank that rings the bell.

## Design decisions (dialogue record)

| # | Question | Answer | Source |
|---|---|---|---|
| 1 | Who runs the Day-1 spike's devnet step? | Two early human gates inside Step 2 (spike deploy, spike run), executed by the gate-concierge in its own session on per-gate consent. Wallet + devnet funding are earlier human gates the preflight concierge completes before the spike pause. The orchestrator pauses at the spike, commits `docs/spike/spike-result.md`, reports the (a)(b)(c) line, resumes with the manifest the user picks. | user, turn 2 |
| 2 | How does the fallback switch? | `docs/superpowers/manifest.json` = TEE path; `docs/superpowers/manifest-fallback.json` = the same DAG plus two delta tasks (`program:20`, `client:21`). Switch = copy the fallback over `manifest.json` + commit. Only deal/reveal-dependent tasks wait for the spike. | user, turns 2–3 |
| 3 | Program keypair | One fixed program keypair for the spike deploy and the final deploy, at `/root/.config/hidden-hand/program-keypair.json` inside WSL (outside every repo), created by the build script with `--silent`, never printed; `declare_id!` synced to it before each deploy; `solana_version = "3.1.9"` under `[toolchain]`. | user, turn 2 |
| 4 | Market maker | (A) linear-impact market maker. | approved, turn 3 |
| 5 | Bot convergence | Information structure: the asset is a **sum of private signals**, so each seat's information is worth exactly `own − 16` points; with **1 contract = 1 point of price impact**, a bot holding the target position `own − 16` moves the price by exactly its information. The close is 64 + Σ(own − 16) = the hidden sum, ± the bots' wobble. Monte Carlo below; it is the gate of `bots:6` (≥ 60 % of ≥ 1000 seeded deals close within 4). | user change 1, turn 3 |
| 6 | Line endings | `.gitattributes`: `*.sh`, `Anchor.toml`, `Cargo.toml` → `eol=lf`; every path in `wsl-build.sh` quoted. | user change 2 |
| 7 | Engine drift | One golden-vector file `program/engine-vectors.json` consumed by the Rust engine test and the TS engine test. | user change 3 |
| 8 | Early integration | Human gate `gates:15` = full-program deploy + one real devnet round as soon as `program:1–4` and `bots:7` are green. The Step-3 final redeploy + closing round stay. | user change 4 |
| 9 | Proof | `docs/proof/devnet-round.md` records base-layer delegate + commit/undelegate + claim signatures, not only ER ones. The submission's explorer link = a base-layer delegation tx of OUR program; the program ID goes in on-chain addresses; never a MagicBlock shared account. | user change 5 |
| 10 | Frontend kind + deal | Kind **software** (the skill's table puts fintech/trading apps there; the gaming deal only offers a photo hero, which breaks "the hero is the live pit"). Deal: palette **plum-black-pink** (fallback **lunar-grey-bronze** if the gate flags violet), type **Chivo + Chivo Mono** (the first pairing, Familjen + IBM Plex Mono, is excluded: IBM Plex is basanos's), radius **sharp**, hero **centred**, moments **liquid-type** + **line-carries-colour**, lists **nav-cards · footer-statement · close-word · surface-pairs · tonal · dots**. No nightcrew/stigi/basanos palette or type pair. | approved, turn 3 |

## Game rules (the numbers)

- **4 seats** (one human + three bots; a bot fills any empty seat). **2 cards per seat**, each `1 + (byte % 15)` from the
  VRF randomness bytes 0–7 → card mean 8, hand mean 16, hidden sum `S` in 8..120, mean 64.
- **Contract** pays `S` points at the bell. Prices are integer cents: **open 6400** (= 64.00), **step 100** cents per
  contract (1 contract moves the price 1.00), **lot 1–5**, **position cap ±15** per seat, price clamped to
  **[800, 12000]**.
- **Fill:** buying `q` at price `p` costs `q·p + 50·q²` cents and moves the price to `p + 100·q`; selling `q` pays
  `q·p − 50·q²` and moves it to `p − 100·q` (average fill = midpoint of the move).
- **P&L** at the bell = `cash_c + pos · S · 100`. **Winner** = highest P&L, ties → lowest seat index. The winner takes
  the whole SOL pot (entry **0.01 devnet SOL** × 4).
- **Round length:** `duration_secs` per table (30..=180). Live default 90; demo mode 75 (bell inside 90 s of screen).

## Bot policy and convergence proof

Policy (pure, seeded `mulberry32`): each bot's target position is `round((own − 16) · min(1, t / ramp)) + wobble`,
clamped to ±15; `ramp` is 15–45 s per bot; at each action (every 0.7–2.3 s) the bot re-draws its wobble ∈ {−1, 0, +1}
with probability 0.25 and trades toward the target in lots of 1–3. The human's UI shows the same hint ("your hand is
worth +N contracts").

Monte Carlo, 2000 seeded deals per row (seeds 1..2000), run on the exact policy/engine code in `bots:6`:

| case | close within 4 | median abs err | p90 abs err | median, do nothing | median trades |
|---|---|---|---|---|---|
| demo 75 s, 4 bots | **100.0 %** | 1.00 | 3.00 | 9.0 | 52 |
| live 90 s, 4 bots | **100.0 %** | 1.00 | 3.00 | 9.0 | 59 |
| 75 s, seat 4 = slow hint-follower | **100.0 %** | 1.00 | 3.00 | 9.0 | 47 |
| 75 s, seat 4 = random trader | 35.0 % | 7.00 | 16.00 | 9.0 | 54 |
| 75 s, seat 4 = idle human | 51.1 % | 4.00 | 11.00 | 9.0 | 40 |

Consequence for the demo: the recording either lets a bot fill seat 4 (`--demo`, the default) or has the human follow
the on-screen hint; a random or idle human breaks the reveal, which the README states plainly.

## Architecture

```
program/                 Anchor workspace (built in WSL)
  engine/                pure Rust crate: cards, quote, pnl, winner (+ golden-vector test)
  programs/hidden-hand/  the Anchor program (TEE deal path; fallback adds commit-reveal)
  engine-vectors.json    golden vectors shared with the TS engine
  scripts/               wsl-build.sh, wsl-deploy.sh
client/                  TS package: PDAs, connections (base / TEE auth token / ER), tx helpers,
                         DealAdapter, round API, TS engine port, spike script
bots/                    TS package: seeded policy + Monte Carlo (gate), demo-round runner
web/                     Vite multi-page React: / (index.html) and /app/ (app/index.html)
docs/spike/              spike result (written by the spike run, committed by the orchestrator)
docs/proof/              devnet round proof (base-layer + ER signatures, program address)
```

### On-chain accounts

| Account | PDA seeds | Holds |
|---|---|---|
| `Table` | `["table", round_id u64 le]` | `round_id`, `authority`, `mode` (`Tee`/`CommitReveal`), `phase` (`Open → Dealing → Trading → Revealed → Settled`), `duration_secs`, `entry_lamports`, `seat_count`, `seats[4] {owner, hand, cash_c i64, pos i32, commitment [u8;32], revealed}`, `price_c`, `start_ts`, `end_ts`, `seed [u8;32]`, `cards [u8;8]`, `hidden_sum`, `winner` (255 until settled), `pnl_c [i64;4]`, `paid`, `trade_count`, `trades[128] {seat, side, qty, price_after_c, ts}` |
| `Hand` | `["hand", table, owner]` | `table`, `owner`, `seat`, `cards [u8;2]`, `dealt` — private to its owner in TEE mode |
| `Vault` | `["vault", table]` | system-owned SOL escrow on the base layer, **never delegated** |

### Instructions (where each runs)

| Instruction | Layer | Task | Effect |
|---|---|---|---|
| `open_table(round_id, mode, duration_secs, entry_lamports)` | base | program:1 | create Table; TEE mode pre-funds Table with permission rent |
| `join_table(commitment)` | base | program:1 | pay entry to Vault, create Hand (TEE: pre-fund its permission rent), record seat |
| `delegate_pda(target)` | base | program:1 | delegate Table or a Hand to the validator passed as `validator` |
| `create_table_permission()` / `create_hand_permission()` | ER (TEE) | program:1 | Table public; each Hand private to `hand.owner` (members derived on-chain, not passed in) |
| `request_deal(client_seed)` | ER | program:1 | VRF request on `DEFAULT_EPHEMERAL_QUEUE`, phase → Dealing |
| `callback_deal(randomness)` | ER (VRF) | program:1 | write 2 cards into each Hand, phase → Trading, clock starts |
| `reveal_hands()` | ER (TEE) | program:1 | after `end_ts`: copy cards to Table, `hidden_sum`, flip every Hand permission public, phase → Revealed |
| `trade(side, qty)` | ER | program:3 | engine `quote`, update seat + price, append to the trade ring |
| `settle_round()` | ER | program:4 | P&L + winner, phase → Settled, commit + undelegate Table + 4 Hands |
| `claim_pot()` | base | program:4 | pay the whole Vault to the winner, `paid = true` |
| `callback_deal_cr(randomness)` / `reveal_secret(secret)` | ER | program:20 (fallback only) | store the seed; verify `sha256(secret) == commitment`, derive that seat's cards; last reveal → Revealed |

The **bell** is `reveal_hands` + `settle_round` (TEE) or the four `reveal_secret` + `settle_round` (fallback), sent by
the round runner after `end_ts`.

### Clients

- `client/` exposes `createDealAdapter(mode, store)` returning a `DealAdapter` (TEE in `client:2`; commit-reveal added by
  `client:21`) so `bots:7` and `web:9` never change between paths. TEE reads go through
  `getAuthToken(TEE_URL, pubkey, sign)` → `new Connection(TEE_URL + "?token=" + token)`, with `waitUntilPermissionActive`
  after each permission.
- **Keys:** the burner is read from `HH_BURNER_KEYPAIR_JSON` (a JSON byte array) — the user env var, else the git-ignored
  repo-root `.env`; never the repo. Bot keys are derived deterministically from the burner (`sha256(burner secret ‖
  "hidden-hand-bot-" ‖ i)` → `Keypair.fromSeed`) and never printed. The browser seat uses a burner `Keypair` in
  `localStorage` (devnet only; no wallet prompt per trade); the round runner funds it when given its address.
- **Demo mode** (`bots demo-round --demo`): fixed bot seed `20261127`, 75 s round, 20 s join window for the browser seat
  then bot fill, bell at `end_ts`, claim, proof file. Only the VRF deal differs between runs.

### Frontend

Vite multi-page build: `web/index.html` → `/`, `web/app/index.html` → `/app/`. Both pages are built from the skill
(kind `software`, the deal in decision 10). `/` hero = the centred x.ai hero whose window is the pit running an
**illustrative** round in the browser (bots' policy + TS engine, no network, labelled "Illustrative round"). `/app/` =
the live trading desk in one `app-frame`: nav, round state (phase + countdown), price chart with the hidden-sum reveal
line, trade tape (each row links to its ER signature), buy/sell controls with the hand hint, your hand, and explicit
**loading / waiting-for-deal / settled / error** states. Each page passes `gate.mjs <page> --root dist` with
`GATE: PASS`, armed once in `web/` with `--rounds 6`.

## Build environment and gates

- Program gates run from **PowerShell at the repo root**:
  `wsl -d Ubuntu-24.04 -u root --exec bash -l program/scripts/wsl-build.sh <mode>`. The script copies
  `program/` (minus `target/`) to `/root/hidden-hand/program`, installs the fixed program keypair into `target/deploy/`,
  runs `cargo test -p hidden-hand-engine` and `anchor build`, copies the IDL + types back to `client/src/idl/`, and
  prints `HH-GATE: PASS`.
- TS gates run on Windows from the repo root: `pnpm --filter <pkg> test` / `typecheck`.
- UI gates: `pnpm --filter @hidden-hand/web build` then `node "$HOME/.claude/skills/design-taste-frontend/scripts/gate.mjs" <page> --root dist` from `web/`, expecting `GATE: PASS`.

## Manifests and the spike decision

TEE manifest (`manifest.json`): `program:1` spike → `client:2` (core + TEE adapter + `spike.ts`) → human gates
`gates:11` wallet, `gates:12` faucet (preflight, parallel), `gates:13` spike deploy, `gates:14` spike run. Common work proceeds in
parallel: `program:3` market, `program:4` settlement, `client:5` round API + TS engine, `bots:6` policy + Monte Carlo,
`web:8` landing, `web:9` app. Deal-dependent: `bots:7` runner (depends on `gates:14`), `gates:15` early full deploy + devnet round,
`gates:16` final redeploy, `gates:17` closing round. Then `docs:10` README, `gates:18` repo access, `gates:19` submission.

**Decision rule (hard):** if `docs/spike/spike-result.md` does not show `(a) PASS`, `(b) PASS`, `(c) PASS` by **2 h into
Step 2**, the build switches to `manifest-fallback.json` and does not revisit. Fallback delta: `program:20`
(commit-reveal instructions on the same program, purely additive) and `client:21` (commit-reveal adapter, default mode
switch); in the fallback manifest `bots:7`, `gates:15` and `gates:16` also depend on both.

## Testing strategy

- **Engine:** Rust unit tests + golden vectors (`program/engine-vectors.json`), the same file drives the TS engine test.
- **Program wiring:** `anchor build` gates only; wiring is proven on devnet by the spike run (deal path) and the early
  round (whole program, with 12+ h left). MagicSVM is not used (its helpers depend on a path inside the examples repo).
- **Clients:** vitest for PDAs, adapters' pure parts, round decoding, the spike result formatter.
- **Bots:** the Monte Carlo is the gate (≥ 60 % within 4 over 1000 seeded deals; measured 100 %).
- **UI:** the skill's `gate.mjs` per page + its §5 checklist read by the orchestrator against the screenshots.

## Integration proof (submission)

`docs/proof/devnet-round.md` (written by `bots demo-round --proof`): program ID, table PDA, base-layer signatures for
`open_table`, each `delegate_pda`, the commit/undelegate landing (`settle_round`'s base-layer commit is read from the
Table's signature history on the base layer), `claim_pot`; ER signatures for `request_deal`, `callback_deal`, trades,
`reveal_hands`, `settle_round`. Explorer link for the form = a base-layer `delegate_pda` signature of our program.

## Wording obligations (README, submission draft, demo script)

1. Describe the market as a **linear information market** where each trade's size encodes what a sealed hand knows; convergence is **by design**, not emergent bot cleverness.
2. Say plainly that **a random or idle human breaks the reveal**, and that `--demo` fills seat 4 with a bot.

## Risks

1. SDK 0.18.0 has never been built on this machine (examples pin 0.16.2) → `program:1`'s `anchor build` is the first
   proof; the verified API names are pasted into the task.
2. TEE devnet availability on submission morning → the fallback mode stays one manifest away; the spike's informational
   (f) line checks VRF on `devnet-as` up front.
3. VRF requests made inside the ER may not count in the portal's base-layer scan → delegations + commits are the proof;
   delegation alone meets eligibility.
4. Wiring bugs are invisible to local gates → spike + early round surface them while the user is awake.
