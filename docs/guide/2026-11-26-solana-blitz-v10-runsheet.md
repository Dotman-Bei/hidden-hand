# Runsheet — Solana Blitz v10: Entertainment Finance (MagicBlock)

Guide seat: claude-sonnet-5-5 · standard · high. Started 2026-11-26 14:05 UTC (15:05 WAT).

## Event
- **Name / URL:** Solana Blitz v10 — https://luma.com/hedv5sgh · submit at https://build.magicblock.app/?stage=blitz#submit (portal event id 17, `status: active`, stage `blitz`)
- **Window:** 2026-11-20 14:00 UTC → 2026-11-27 14:00 UTC (Luma `end_at`; portal `endDate` and `submitEndDate` both `2026-11-27T14:00:00.000Z`). Online, wherever you are.
- **Deadline:** **2026-11-27 14:00 UTC = 15:00 WAT = 22:00 Singapore.** Internal submit-by: **12:00 UTC = 13:00 WAT** (2h buffer).
- **Prizes (Luma):** 1st $500 USDC · 2nd $250 · 3rd $150 · Wizardio's Choice $100. No sponsor tracks: one leaderboard, theme "Entertainment Finance".
- **Theme (Luma, verbatim):** "apps where you trade, collect, compete and win assets you actually own, with game mechanics on top. Think trading games like BananaZone, skill games with real prizes like Slimecoin, or packs you open and collect like Jungle Fun." Build with "anything in the MagicBlock stack ... zero-fee transactions, VRF and privacy for fully onchain apps on Solana."
- **Judging criteria:** NOT published on Luma. Portal submit form (SSR snapshot 2026-11-26) asks: project name, description, categories (≤3 of DeFi/Payments/Games/AI-Agents/Privacy/Infra/DePIN/Social/Consumer/Other), website, GitHub repo ("must be accessible"), Pitch & Demo, **Explorer link (integration proof)**, on-chain addresses (program / wallet / fee vault; "delegations, VRF requests and private payments count"; "ordinary transfers and swaps don't count"; checks recent devnet + mainnet activity), X account, team Telegram handles, wallet connect (prizes pay there). Step 0a must confirm the real weights.
- **Docs:** docs.magicblock.gg (Luma) / docs.magicblock.xyz (portal JS) — extractor to confirm canonical. Builder directory + Telegram builders group: build.magicblock.app/builders.
- Note: the portal's SSR HTML says "No open events to submit to right now" but `/api/events` returns V10 as `active` — the form is client-rendered; open it with Chrome to confirm it accepts a V10 submission well before the deadline.

## Project repo
- `Dotman-Bei/solana-blitz-v10-2026` (private). Created by the guide 2026-11-26 per `references/repo-bootstrap.md`. Local clone: `C:\Users\bamig\Documents\VIBE CODE\Hackathons\solana-blitz-v10-2026` (sibling of the kit `build-system`).
- Rename to `<project-slug>` at idea-forge Step 4 (record it here). Flip public only at Step 3, consent-gated.
- Commit identity pinned LOCALLY to `140025488+Dotman-Bei@users.noreply.github.com`. The GLOBAL git email on this machine is the personal Gmail — any fresh clone (e.g. a no-space build clone) must set the noreply identity before the first commit.

## Tollgate
- Report: `docs/tollgate/2026-11-26-tollgate.md` (Step 0a Stage 0, committed 7a40d3f). Verdicts: **0a CLEAR · 0 CLEAR · 1 CLEAR · 2 BLOCKED if the build has a custom Solana program (C1 solana CLI, C2 cargo build-sbf, C3 anchor 0.30.1 vs pin 1.0.2, C4 no WSL distro; C7 yarn missing, degraded) · 2.5 CLEAR on hard rows (6 computer-use and 12 elevenlabs FAIL in the 0a session; re-decided by the 2.5 card) · 3 CLEAR pending its session card (rows 5, 7, 8 re-probed then)**.
- Routing: top=opus→claude-opus-5-5, standard=sonnet→claude-sonnet-5-5, fast=haiku→claude-haiku-5-5; effort mechanism per-spawn; no defeating env knobs; executor variants NOT yet installed in the project repo (throwaway-tab prompt before Step 2).
- Pins to plan against: Anchor 1.0.2, Agave/Solana 3.1.9, Rust 1.89.0 (SBF build uses Agave's platform-tools), Node 24.10.0 (22 likely fine), ephemeral-rollups-sdk 0.18.x (NOT 0.20.x, which is devnet-us only).
- Guide pre-probe 2026-11-26 (informational, not the report): git OK · gh OK (Dotman-Bei) · node v22.23.4 · pnpm 10.33.0 · rustc/cargo 1.99.0 · anchor-cli **0.30.1** · ffmpeg 9.0.2 · 56.9 GB free · routing env knobs unset. **MISSING: `solana` CLI, `avm`, `yarn`; WSL has no distro installed.** npm probe errored on my side — re-probe.
- **Stack risk (hard for Step 2 if the build has a custom program):** no Solana CLI / `cargo build-sbf` toolchain and Anchor older than MagicBlock's current SDK expects. Fix before Step 1 ends (see Open blockers).

## Goal
User's prompt left `win the <sponsor> track` unfilled. Recorded as: **place top-3 overall (and be in range for Wizardio's Choice)** — there is no separate sponsor track, MagicBlock is the host and the only sponsor.
Skills: Solidity/DeFi, TypeScript/React, Python/ML (no Rust listed — all Solana program code is executor-written; user cannot hand-debug it).

## Strategy decisions
- **Steps:** 0a (scoped, time-boxed), 0 (idea-forge, safe-feasible), 1, 2, 3-preflight (parallel with 2), 2.5 (light, conditional), 3-closing. Autopilot: not offered (guided first; 24h runway needs the user's judgment at the idea and spec gates).
- **Calendar fit:** ~24h total including sleep. Hard budget in `Step status`. The brief must be scoped to ≤ ~8-10 plan tasks; anything bigger does not fit.
- **Track shortlist (lanes, ≤3):** see chat strategy message of 2026-11-26.
- **Risk appetite:** `safe-feasible` — reasons in chat strategy message.
- **Sponsor depth:** MagicBlock deep (Ephemeral Rollups delegation/undelegation + ER RPC, VRF, private payments / private ER, automation/cranks, session keys); everything else shallow.

## Schedule (WAT, UTC+1) — recorded 2026-11-26
| Block | WAT | UTC |
|---|---|---|
| Step 0a extract (cap 50 min) | 26 Nov 15:15–16:05 | 14:15–15:05 |
| Guide review + Step 0 idea-forge (cap 45 min) | 16:10–17:00 | 15:10–16:00 |
| Calendar-fit call + Step 1 architect (dialog + spec review, cap 90 min) | 17:05–18:35 | 16:05–17:35 |
| Step 3 preflight (wallet, devnet SOL) in parallel with Step 2 start | 18:40 → | 17:40 → |
| Step 2 build, autonomous overnight | 18:45 → 27 Nov 07:00 | 17:45 → 06:00 |
| Step 2 must be GREEN or scope is cut | 27 Nov 08:00 | 07:00 |
| Step 2.5 demo (light) + README | 08:00–11:00 | 07:00–10:00 |
| Step 3 closing: deploy activity, repo public, submit | 11:00–13:00 | 10:00–12:00 |
| Internal submit-by | 13:00 | 12:00 |
| **DEADLINE** | **27 Nov 15:00** | **14:00** |

## Step status
| Step | Status | Artifact | Verified | Seat settings it ran at |
|---|---|---|---|---|
| 0a | **done** | docs/resources/2026-11-26-solana-blitz-v10/ (commit 0d6210e) + tollgate 7a40d3f | 2026-11-26 guide: pushed, noreply identity, judging+eligibility quotes re-fetched live from /api/panels and match; INDEX gaps read; sponsors/magicblock.md has pins, devnet endpoints, ER/VRF/private-payments/cranks/session-keys code | claude-opus-5-5 (booted on sonnet, stopped, user ran /model opus); effort high per kickoff |
| 0 | pending | docs/idea-forge/*-brief.md | — | — |
| 1 | pending | spec + plans + manifest | — | — |
| 3 pre | pending | docs/gates/*-gate-ledger.md | — | — |
| 2 | pending | task commits | — | — |
| 2.5 | pending | docs/demo/*-demo-script.md | — | — |
| 3 close | pending | ledger + submission | — | — |

## Next action
User pastes the Step 0 kickoff (idea-forge) in a fresh tab: `opus` · effort `max`. In parallel the guide hands the toolchain-install block (WSL + Agave 3.1.9 + avm/Anchor 1.0.2) for a separate throwaway tab.

## Open blockers
1. **Solana toolchain** (tollgate C1–C4): install WSL Ubuntu, then Rust 1.89.0, Agave 3.1.9, avm + Anchor 1.0.2 inside it. Start in parallel with Step 0; must be PASS before Step 2. A WSL install may need a reboot — do it between sessions.
2. ~~Portal form status~~ RESOLVED by 0a: form is open for V10 (client-rendered, needs Telegram sign-in). Still open: confirm at Step 3 that a submission can be filed.
3. Judging weights unpublished (only "creativity, technical depth, and how compellingly they showcase what's possible on Solana"); Wizardio's Choice criteria unpublished; demo video not explicitly mandated but "Pitch & Demo" URL is validated, so plan for one.
4. Global git email is personal — never commit from a clone without the noreply identity.

## Pack notes for later steps (guide)
- Eligibility (verbatim): "Every submission must integrate MagicBlock's Ephemeral Rollup or VRF." Proof = delegations / VRF requests / private payments from the project's OWN program, wallet or fee vault on devnet or mainnet (ordinary transfers and swaps don't count; MagicBlock's shared programs are rejected as "your" address).
- GitHub: public, or private with @jonasXchen invited. Form needs Telegram sign-in + wallet connect (prizes pay there) + X handle + team Telegram handles.
- White space: dice, gachapon, RPS, binary prediction, sealed auction already ship as MagicBlock templates — a reskin of one is weak against the judging text.
- The 0a session's INDEX timestamps ("14:20–15:05 UTC") disagree with the machine clock (commits 14:15Z); immaterial, the deadline facts come from the API. Real clock at this review: 14:20 UTC (15:20 WAT) — ~45 min AHEAD of the schedule above.

## Pack addendum verified 2026-11-26 14:40 UTC (guide)
- Commit b45394e (noreply identity): prior-art.md now lists all 40 past Blitz winners (V0–V9) with categories, MagicBlock features and repo/demo links; event.md resolves the `CLAIM_QUALIFY_RATING` question (Champions program, not Blitz judging). No emails/phones/Telegram handles found in the file (grep). Facts used by the guide: 7 of 8 V8+V9 winners are Games; Private ER/TEE in 3 of V9's 4 winners and V8's 1st; VRF in V9's 1st and 2nd; 34/40 winners link a demo video (all 8 from V8/V9); V10 entries are hidden until revealed. Still open: judging weights, Wizardio criteria, who votes, "recent activity" window.
- Idea-forge not started at this check (no docs/idea-forge/). Kickoff re-issued with the updated PRIOR ART line.
