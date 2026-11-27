<!-- demo-script-schema: v1 -->
# Hidden Hand — demo script

## 0 — Production card

| field | value |
|---|---|
| Project | Hidden Hand |
| Event | Solana Blitz v10 — Entertainment Finance (host: MagicBlock), portal event 17 |
| Target length | 2:15 (hard cap 3:00; the event publishes no length) |
| Resolution / fps | 1920×1080 @ 30 |
| Voice | Kokoro (local, offline) |
| Music | off |
| Wallet on camera | N/A — the app has no wallet popup; the browser seat signs with a devnet burner key. Explorer transaction pages are shown instead |
| Upload target | unlisted YouTube — the user's logged-in Studio channel (channel name kept out of this repo) |
| Schema | v1 |

## 1 — Story & time budget

Prove: in a real devnet round, four sealed hands are dealt inside MagicBlock's Private Ephemeral Rollup, trading moves a public price, and at the bell the hands flip, the hidden sum draws across the chart and the winner's pot is claimed on Solana.
Money shot: scene S5 (starts at 1:09 of screen time in the cut).

Criteria quoted from `event.md`: "Projects are judged on creativity, technical depth, and how compellingly they showcase what's possible on Solana." No weights are published; the pack treats the three as equal and unconfirmed. Seconds include the 3 s title card and the 6 s outro.

| criterion | weight | seconds |
|---|---|---|
| creativity (title, S1, S4) | unpublished, treated as 1/3 | 44 |
| technical depth (S3, S7, S8, outro) | unpublished, treated as 1/3 | 45 |
| showcase of what's possible on Solana (S2, S5, S6) | unpublished, treated as 1/3 | 46 |

## 2 — Pre-flight — set up before recording

| # | item | how to verify | ✓ |
|---|---|---|---|
| 1 | App running — `pnpm --filter @hidden-hand/web exec vite preview --port 4173 --strictPort` (serves `web/dist`); round per take: `pnpm --filter @hidden-hand/bots demo-round -- --demo --seat4 <browser seat public key>` in the default `tee` mode. Never `--proof` | `/` and `/app/` on `http://localhost:4173` return 200; `docs/proof/devnet-round.md` unchanged after every take (`git status`) | ✓ |
| 2 | Demo data — nothing seeded; each take is a new on-chain round against program `HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb`. The runner may retry `request_deal` for about 6 min on a stale ER program: let it | runner prints `dealt; trading until …` | ✓ |
| 3 | Wallet state — burner `BT9TYK3HL5Bc7rZfTNrPiGkjGXDKeDpdEPgWBqAks1Bs`, devnet, ≥ 1 SOL (about 0.05 SOL per round); the browser seat is a fresh devnet burner in the capture profile, funded by the runner. Extension: N/A, no wallet popup | `pnpm --filter @hidden-hand/client balance -- --min 1` ends `BURNER-BALANCE: PASS` | ✓ |
| 4 | Browser hygiene — Playwright Chromium, dedicated empty profile, 1920×1080 viewport, 100% zoom, page content only (no browser chrome, bookmarks or extensions) | first frame of each take | ✓ |
| 5 | Desktop hygiene — nothing from the desktop is captured (page screencast only). `.env` is never opened; runner and browser logs are filtered so no auth token is printed | QC "no secret" row on every frame set | ✓ |
| 6 | Capture toolchain — demo-studio session card green on the browser-only path | `docs/tollgate/2026-11-26-tollgate.md`, §6 | ✓ |
| 7 | Assets — title card text "Hidden Hand · a market finds a sealed secret"; outro QR for `https://github.com/Dotman-Bei/hidden-hand` and the line "Solana Blitz v10 · Entertainment Finance · Games · DeFi · Privacy"; type Chivo / Chivo Mono (the app's); music N/A (off) | Remotion storyboard stills | ✓ |

## 3 — Shot list

| id | seconds | visual (route/action/window) | narration cue | driver | wallet verbs | gate assertion | retakes | take |
|---|---|---|---|---|---|---|---|---|
| S1 | 9 | `/` landing: the centred hero with the pit running, its "Illustrative round" label in frame | S1 "Hidden Hand: four…" | screencast | — | "Illustrative round" text visible; chart line has moved | 3 | 1 |
| S2 | 14 | `/app/` idle, then `/app/?round=<id>` from the runner: seats fill, the browser presses "Take the free seat" | S2 "Now a live…" | screencast | — | seat 4 reads "Seat 4 · you"; 4 of 4 seats taken or dealing starts | 3 | 1 |
| S3 | 15 | `/app/` deal: "Dealing sealed hands with VRF…", then own two cards face up and the hint; other three seats face down. Lower-third quotes the `(a) PASS` line of `docs/spike/spike-result.md` | S3 "MagicBlock VRF deals…" | screencast | — | own hint "Your hand is worth …" visible; three other seats show card backs | 3 | 1 |
| S4 | 32 | `/app/` pit: the full 75 s round shown sped up (about 2–3×, the factor labelled on screen). The browser presses Buy / Sell toward its hand hint; chart and tape fill; only this seat’s own tape rows are Rollup transaction links (bot rows are plain text) | S4 "The contract pays…" | screencast | — | at least 3 trades from seat 4 on the tape as links; price chart moved from 64.00 | 3 | 1 |
| S5 | 20 | `/app/` bell: "Bell. Trading is closed." → hands flip → dotted hidden-sum line on the chart → settled panel (hidden sum, close, gap, winner, pot) | S5 "The bell. Every…" | screencast | — | all four seats face up, reveal line drawn, phase "Settled", panel values readable | 3 | 1 |
| S6 | 12 | `/app/` on-chain record section (base-layer transaction list), then the round's `claim_pot` transaction on Solana Explorer (devnet) | S6 "The table commits…" | screencast | — | explorer page shows Success and the program's ClaimPot instruction | 3 | 1 |
| S7 | 9 | Solana Explorer (custom RPC = the Private ER): one of this seat's tape links, a `Trade` instruction with its fee. The Explorer first asks “Connect to an unknown RPC server?” for `devnet-tee.magicblock.app`; the capture browser presses Connect only if the user allows it | S7 "Here is one…" | screencast | — | page shows Success, the Trade log and a zero fee. If Connect is not allowed or the explorer cannot render it, placeholder card with the signature | 3 | 1 |
| S8 | 15 | Solana Explorer (devnet): this round's base-layer `delegate_pda` transaction of the table, then the program address `HZdoTuj1…miRFb` | S8 "And this is…" | screencast | — | Success, the program's DelegatePda instruction, program id legible | 3 | 1 |

## 4 — Narration script

Take rule: the first technically complete take is used, whatever the price did. `{sum}`, `{close}` and `{gap}` are filled only from the values on screen in that take.

**S1** — Hidden Hand: four seats hold sealed cards, and everyone trades the hidden sum. This first pit is illustrative. The next one is live on devnet.
words: 25 · planned: 9s @ ~2.4 w/s · tone: plain, direct · gloss: devnet → "dev net"

**S2** — Now a live round from the bot runner, in demo mode. Three bots sit down. The fourth seat is played by a script that follows the on-screen hint, signing with a devnet burner. No wallet popup.
words: 36 · planned: 14s @ ~2.4 w/s · tone: matter of fact · gloss: devnet → "dev net"

**S3** — MagicBlock VRF deals two cards to each seat inside a Private Ephemeral Rollup, running in a TEE. This seat reads its own hand. The others stay sealed: in our spike run, a stranger got null.
words: 35 · planned: 15s @ ~2.4 w/s · tone: explanatory · gloss: MagicBlock → "magic block"; VRF → "V R F"; Ephemeral → "ih-FEM-er-al"; TEE → "T E E"

**S4** — The contract pays the hidden sum of all eight cards. This is a linear information market: one contract moves the price one point, so each trade's size encodes what a sealed hand knows. The price converges by design, not because the bots are clever. Here, a script plays this seat and follows the on-screen hint. A random or idle human breaks the reveal, so demo mode normally fills this seat with a bot. These Rollup trades pay zero fee and need no wallet prompt.
words: 84 · planned: 32s @ ~2.4 w/s · tone: unhurried, honest · gloss: Rollup → "roll up"

**S5** — The bell. Every hand flips face up on-chain, and the hidden sum draws across the chart. It is {sum}. The price closed at {close}. The round settles, and the top trader wins the pot. A market priced a secret no single seat held.
words: 43 · planned: 20s @ ~2.4 w/s · tone: the payoff; short pauses · gloss: on-chain → "on chain". If {gap} is over 4, the last sentence becomes: "This round, the price missed the sum by {gap}."

**S6** — The table commits and undelegates back to Solana. There the pot is claimed for the winner. This is that claim transaction on the devnet explorer.
words: 25 · planned: 12s @ ~2.4 w/s · tone: matter of fact · gloss: undelegates → "un-DEL-uh-gates"; Solana → "so-LAH-nuh"

**S7** — Here is one of this seat's trades on the Rollup: our program's trade instruction, with a fee of zero.
words: 19 · planned: 9s @ ~2.4 w/s · tone: matter of fact · gloss: Rollup → "roll up"

**S8** — And this is the base-layer delegation from our program. Sealed hands run on MagicBlock's Private Rollup, dealt by VRF. A commit-reveal fallback can be switched on. Everything here is devnet.
words: 30 · planned: 15s @ ~2.4 w/s · tone: closing, calm · gloss: commit-reveal → "commit reveal"; VRF → "V R F"

## 5 — Assembly plan

Order: title card (3 s, silent) → S1 → S2 → S3 → S4 → S5 → S6 → S7 → S8 → outro (6 s, silent: repo QR and event line).
Transitions: hard cuts. Time edits, all visible to the viewer: chain waiting time inside a take is trimmed (small "wait trimmed" label at each trim); the S4 trading phase is sped up with the factor shown on screen. S2 to S5 come from one continuous round. No frame is composited to show a state the app did not show; overlays are labels and verbatim quotes from the proof files only.
Captions: on, word-timed, in a reserved band under the footage so they never cover the app. Music: off. Loudness: −14 LUFS (two-pass). Export: 1080p h264. Mechanics: `references/demo-stack.md`. The Remotion project is built outside the repo on a path without spaces.
Token rule: no frame, committed file, ledger line or publish copy may carry an auth token (`?token=`) of the Private ER; if one would be visible it is cropped or blurred, or S7 becomes a placeholder card. Checked in QC.
Upload hold: the repo is private. No upload until the user confirms it is public (`gates:18`) and the outro QR link has been checked to resolve logged-out.

## 6 — QC record

| check | scene(s) | pass/fail | note |
|---|---|---|---|
| money shot visible | S5 | pass | render 1. Bell at about 1:10, hands face up and the hidden-sum line at about 1:12, settled panel: sum 85, close 84.00, gap 1.00 |
| text legible at 1080p | all | fail | render 1: full-range captures were read as limited range (background crushed to black); explorer labels covered field names; a cut-off chip showed on the program page |
| captions present + synced | S1–S8 | pass | render 1, frames read; captions come from the TTS word times |
| no capture yellow border | all | pass | page screencast only |
| no secret / no address that shouldn't be on screen | all | pass | public devnet addresses and signatures only; the Explorer header shows the bare Private ER host; capture aborts on `token=` in page text or tape links |
| per-scene duration within budget | S1–S8 | pass | actual 10.4 / 13.6 / 13.7 / 28.7 / 18.0 / 10.6 / 8.4 / 13.7 s, audio-first |
| total duration within ±10% | all | pass | 126.1 s against 135 s (−6.6 %) |
| audio present, loudness sane | all | pass | −14.12 LUFS integrated, −1.35 dBTP |
| text legible at 1080p | all | pass | render 2: bt709 limited range, labels moved, crop adjusted; 63-frame sweep and full-size frames read |
| money shot visible | S5 | pass | render 2, re-read |
| captions present + synced | S1–S8 | pass | render 2: first speech in each scene starts within 0.15 s of its first caption |
| no secret / no address that shouldn't be on screen | all | pass | render 2: one frame every 2 s read, none carries a token; no `token=` in the take logs or the render manifest |
| audio present, loudness sane | all | pass | render 2: −14.12 LUFS, −1.35 dBTP; not listened to by ear (the seat cannot hear audio) |
| total duration within ±10% | all | pass | render 2: 126.1 s |
| money shot visible | outro | pass | outro QR: 841 of 841 modules match the repo URL; logged-out GET returns 404 while the repo is private (upload hold stands) |
| money shot visible | outro | pass | pre-upload 08:41Z: repo public; the QR in the final file matches the URL (841/841 modules) and the URL returns 200 logged-out; file checksum unchanged since QC |

## 7 — Publish block

| field | value |
|---|---|
| Upload target + account | unlisted YouTube — the user's logged-in Studio channel (name kept out of the repo) |
| Title | Hidden Hand — a market prices a sealed secret on Solana devnet |
| Description | Hidden Hand is an on-chain trading pit on Solana devnet, built for Solana Blitz v10 (Entertainment Finance). MagicBlock VRF deals four seats sealed two-card hands inside a Private Ephemeral Rollup (TEE); a hand is readable by its owner only. Everyone trades one contract worth the hidden sum of all the cards against an on-chain market maker, with zero-fee trades on the Rollup. It is a linear information market: each trade's size encodes what a sealed hand knows, so the price converging on the hidden sum is by design, not emergent bot cleverness. A random or idle human breaks the reveal, so `--demo` fills seat 4 with a bot; in this recording seat 4 is a browser (clicks automated) that follows the on-screen hint. At the bell the hands flip, the round commits back to Solana and the winner's pot is claimed. Commit-reveal over VRF is a switchable fallback in the same program. Devnet only, no real funds, unaudited. The first pit shown is illustrative; the trading phase is sped up and chain waiting time is trimmed. Narration is a synthetic voice. Program: HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb · Code: https://github.com/Dotman-Bei/hidden-hand · music attribution: none (no music) |
| Tags | Solana, MagicBlock, Ephemeral Rollup, Private Ephemeral Rollup, VRF, TEE, Solana Blitz, hackathon, devnet |
| Visibility | unlisted |
| URL | TBD |
| Verified logged-out | TBD |
| Resolves | submission-draft demo video URL |

## 8 — Status ledger

| date | event | by |
|---|---|---|
| 2026-11-27 | scripted | demo-studio (`claude-sonnet-5-5`) |
| 2026-11-27 | approved (script, storyboard, recording session and the Explorer Connect press), with three conditions: script-driven seat said aloud in S2 and S4; no Private ER token in any frame or file; no upload until the repo is public and the QR resolves | the user |
| 2026-11-27 | superseded-edit (S2 and S4 narration per the approval conditions; S2 14 s, S4 32 s; token rule and upload hold added to §5) | demo-studio |
| 2026-11-27 | pre-flight verified | demo-studio |
| 2026-11-27 | recorded (8/8 scenes) | demo-studio |
| 2026-11-27 | assembled | demo-studio |
| 2026-11-27 | QC passed [residuals: narration pronunciation not checked by ear; the S1 landing text says 90-second while the recorded demo-mode round is 75 s; the S3 quote shows the spike run's cards, not this round's; the S7 close-up shows the Trade log without the program id; true peak −1.35 dBTP against a −1.5 target; the outro repo link is 404 logged-out until gates:18] | demo-studio |
| 2026-11-27 | watched | the user |
