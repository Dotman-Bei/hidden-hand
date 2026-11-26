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
- Report: not yet — Step 0a's Stage 0 creates `docs/tollgate/<date>-tollgate.md`.
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
| 0a | pending | docs/resources/2026-11-26-solana-blitz-v10/ | — | — |
| 0 | pending | docs/idea-forge/*-brief.md | — | — |
| 1 | pending | spec + plans + manifest | — | — |
| 3 pre | pending | docs/gates/*-gate-ledger.md | — | — |
| 2 | pending | task commits | — | — |
| 2.5 | pending | docs/demo/*-demo-script.md | — | — |
| 3 close | pending | ledger + submission | — | — |

## Next action
User pastes the Step 0a kickoff (resource-extractor) in a fresh tab: `opus` · effort `high`, Chrome extension connected.

## Open blockers
1. **Solana toolchain** (no `solana` CLI, Anchor 0.30.1, no WSL distro) — must be resolved before Step 2; guide will hand a fix block after Step 0a/0 once the pack says which Anchor/Solana versions the MagicBlock SDKs pin.
2. **Portal form status** — confirm V10 submission opens client-side (Chrome) before relying on it.
3. **Criteria unpublished** — confirm in the pack, from the portal/docs/Telegram.
4. Global git email is personal — never commit from a clone without the noreply identity.
