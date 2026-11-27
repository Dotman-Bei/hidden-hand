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
- **RENAMED by idea-forge Step 4 (2026-11-26): `Dotman-Bei/hidden-hand` (private, default branch main).** Local folder keeps the old name `solana-blitz-v10-2026` (open workspace); origin points at hidden-hand. Every kickoff REPO field = `Dotman-Bei/hidden-hand`. (Old: `Dotman-Bei/solana-blitz-v10-2026`, redirected.) Flip public only at Step 3, consent-gated.
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
| 0 | **done** | docs/idea-forge/2026-11-26-hidden-hand-brief.md (commit 6afd654) | 2026-11-26 15:10Z guide: pulled, all sections present incl. Feasibility notes (pins, devnet endpoints, ER/VRF/TEE/cranks/session keys), no personal data/secrets (grep), rename verified | claude-opus-5-5 · effort max |
| 1 | **done** | docs/superpowers/{specs,plans}/ (spec + 5 plans) + manifest.json (10 build + 9 human gates) + manifest-fallback.json (21) + docs/gates/submission-draft.md + tollgate §3 Stack rows (commits 8c869a4, 79c8465, d14562a, f1d19d1) | 2026-11-26 19:45Z guide: both manifests re-validated by the guide (DAG acyclic, every requires has a provider, every human_gate and xhigh task is top tier, efforts present, standard tier = omitted = default); stack rows re-probed S2–S14 PASS after the Agave re-pin | claude-opus-5-5 · effort xhigh |
| 3 pre | pending | docs/gates/*-gate-ledger.md | — | — |
| 2 | pending | task commits | — | — |
| 2.5 | pending | docs/demo/*-demo-script.md | — | — |
| 3 close | pending | ledger + submission | — | — |

## Next action
SUBMITTED (user confirmed at the guide session, ~11:50 UTC 2026-11-27). Portal entry editable until 14:00 UTC; do not submit twice. Remaining: watch for the organisers' emails; optional edits only via the entry's Edit/Update.

## Open blockers
1. ~~Solana toolchain~~ **CLEARED 2026-11-26 (commit 5b986c1), guide re-ran the versions inside WSL:** Ubuntu-24.04 (WSL2, imported from Canonical rootfs), solana-cli 3.1.9, cargo build-sbf 3.1.9 / platform-tools v1.52, anchor-cli 1.0.2 (avm 1.2.2), Node 24.22.3, yarn 1.22.x, pnpm. Smoke build of magicblock counter/anchor passed (253 s warm, ~12 min cold). Wrapper: `wsl -d Ubuntu-24.04 -u root -- bash -lc "..."` (use `--exec bash -lc '...'` when the command contains `# Runsheet — Solana Blitz v10: Entertainment Finance (MagicBlock)

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
- **RENAMED by idea-forge Step 4 (2026-11-26): `Dotman-Bei/hidden-hand` (private, default branch main).** Local folder keeps the old name `solana-blitz-v10-2026` (open workspace); origin points at hidden-hand. Every kickoff REPO field = `Dotman-Bei/hidden-hand`. (Old: `Dotman-Bei/solana-blitz-v10-2026`, redirected.) Flip public only at Step 3, consent-gated.
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
| 0 | **done** | docs/idea-forge/2026-11-26-hidden-hand-brief.md (commit 6afd654) | 2026-11-26 15:10Z guide: pulled, all sections present incl. Feasibility notes (pins, devnet endpoints, ER/VRF/TEE/cranks/session keys), no personal data/secrets (grep), rename verified | claude-opus-5-5 · effort max |
| 1 | pending | spec + plans + manifest | — | — |
| 3 pre | pending | docs/gates/*-gate-ledger.md | — | — |
| 2 | pending | task commits | — | — |
| 2.5 | pending | docs/demo/*-demo-script.md | — | — |
| 3 close | pending | ledger + submission | — | — |

## Next action
User pastes the Step 1 kickoff (architect) in a fresh tab: opus · effort xhigh (Extra). Toolchain preflight tab still running; its report is pending verification.

## Open blockers
). Preflight session ran at claude-sonnet-5-5 · high.
   - Step 2 carry-overs: (a) put `solana_version = "3.1.9"` under `[toolchain]` in Anchor.toml (else Anchor silently switches the machine to 3.0.0); (b) first build in a fresh target/ rewrites `declare_id!` to a new program keypair — check it before deploy; (c) ephemeral-rollups-sdk 0.18.x is UNPROVEN here (smoke used 0.16.2) — the architect's task 1 must build it early; (d) WSL has no GitHub login and no gh. Guide recommendation to the architect/orchestrator if asked where code lives: keep the repo on the Windows side and have each program gate command copy the on-chain dir to the WSL ext4 home and build/test there (avoids GitHub auth inside WSL and the /mnt/c + space-in-path slowness); fallback if a clone inside WSL is preferred: set WSL git credential.helper to Windows gh.exe (`C:UsersamigAppDataLocalProgramsGitHub CLIingh.exe auth git-credential`), never a pasted token.
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

## Step 0 verified + calendar-fit call (guide, 2026-11-26 15:10 UTC / 16:10 WAT)
- **Project: Hidden Hand** — a 90-second on-chain trading pit: VRF deals sealed hands readable only by their owner (Private ER), everyone trades a contract worth the hidden sum on a zero-fee ER, at the bell hands flip and the best trader takes the pot. Rubric 460 vs 424 runner-up; win depends on buildability 4 and on the devnet TEE path (brief carries a commit-reveal-over-VRF fallback that gives up only the Private ER primitive).
- **Calendar fit: FITS, conditionally.** 22h50m to the deadline at review time. Conditions handed to the architect as hard constraints: (1) plan ≤ ~12 tasks, one small Anchor program, bots/frontend as TS/Python clients; (2) the Day-1 spike (TEE auth-token read, VRF callback inside the TEE ER, reveal at settlement) is task 1 with a hard decision rule: if it is not passing 2h into Step 2 (by ~19:30Z), switch to the commit-reveal fallback and do not revisit; (3) stretch goals (private cash-out, crank bell) are out of the manifest unless everything else is green; (4) toolchain (WSL/Agave/Anchor) must PASS before Step 2 — separate preflight tab running.
- Risk register: Private ER TS auth flow, session-keys program ID and Magic Router TS API are pack gaps; devnet SOL for deploy is the one external dependency (Step 3 preflight); no Rust skill on the user's side.
- Schedule (UTC): architect done by ~16:45Z, Step 3 preflight 16:45Z, Step 2 17:00Z→06:00Z, green-or-cut 07:00Z, demo/README 07:00–10:00Z, submit by 12:00Z, deadline 14:00Z.

## Step 1 verified + schedule re-based (guide, 2026-11-26 19:50 UTC / 20:50 WAT)
- **Real clock check:** the machine clock reads 19:42 UTC at this review — ~3.5 h passed between the architect's push (16:22Z) and the user's next message. **Deadline 14:00Z tomorrow = 18h10m left.** Re-based schedule (UTC): orchestrator start ~20:05; spike deploy/run gates ~22:00–23:00 (user awake; 23:00–00:00 WAT); early full deploy + devnet round gate as soon as program:4 + bots:7 are green (before the user sleeps, target ≤ 01:00Z); build green-or-cut 07:00Z (unchanged); demo/README 07:00–10:00Z; submit-by 12:00Z.
- **Agave drift ROOT CAUSE (found + documented in the tollgate report, commit 5c8e981):** bare `anchor --version` outside a workspace pinned with `solana_version` flips WSL's active Agave to 3.1.10. Probe Anchor only as `/root/.avm/bin/anchor-1.0.2 --version`, or from inside program/. Fix when it recurs: `agave-install init 3.1.9`, re-probe S2→S3→S7→S4. Machine is on 3.1.9 as of 19:50Z.
- **Spike window amendment (guide recommendation, user approves by pasting the orchestrator kickoff):** the plan's critical path to the spike is program:1 (xhigh) → client:2 (the balance/faucet gate needs it) → gates:11–14 (burner, funding, deploy, run), realistically 1h45–2h10m, which would trip the plan's "T+2 h → fallback" rule on latency alone. Amended to **T+3 h** (fallback tasks add ~1 h and we have 11 h of build window). The manifest's spike_rule text still says 2 h; the orchestrator kickoff states the override.
- Plan facts: spec = linear information market (step 1.00, cap ±15, hidden sum = convergence by design; Monte Carlo ≥60% within 4, measured 100% with bot-filled seat 4); program 'hidden_hand' on devnet-as/eu validator 1.1.1 + SDK 0.18.0, Private ER via TEE adapter with commit-reveal fallback; fixed program keypair at /root/.config/hidden-hand/program-keypair.json (WSL, outside the repo); burner HH_BURNER_KEYPAIR_JSON in git-ignored .env (gates:11 waits for program:1 so .gitignore exists); gates:15 = early full deploy + real devnet round with base-layer proof.
- Wording obligations (README / submission / demo script): "linear information market, convergence by design"; "a random or idle human breaks the reveal; --demo fills seat 4 with a bot".

## Spike run 1 diagnosis (guide, 2026-11-26 ~20:40 UTC) — NOT a Private-ER failure
- gates:14 run 1: (a)(b)(c) FAIL at setup, (f) FAIL (callback_deal out of compute, 271371/271371 CU on every oracle callback, so the VRF oracle itself DID call back on devnet-as).
- Guide probes (own throwaway in-memory keypair, nothing saved): TEE auth works (getAuthToken returns a 203-char token; JSON-RPC getVersion with ?token= answers 200). `GET /permission?...` returns 404 `Not found: GET /permission` with AND without a token, so the SDK's waitUntilPermissionActive can never succeed against this TEE. The 0.20.0 SDK ships the identical function, so upgrading the SDK does not fix it. Fix = client stops using waitUntilPermissionActive and polls an owner-authenticated getAccountInfo on the TEE connection instead.
- **Pack erratum:** all four public devnet endpoints (devnet-tee, -as, -eu, -us) report validator core 2.0.5 (solana-core 4.2.2, same git-commit 380360a) at 2026-11-26 ~20:35Z. The pack/docs say only devnet-us is 2.0 and the others 1.1.1. SDK 0.18.0 stays (docs: reads both commit-log formats; run 1 shows delegate + VRF request + oracle callback working on devnet-as). Re-check commit/undelegate at gates:15.
- Program bugs found by the concierge: wsl-deploy.sh `check` (no default signer), RevealHands stack overflow (hands unboxed), callback_deal compute exhaustion (suspect: unbounded draw loop, or Borsh-deserialising the whole Table incl. the 128-entry trade ring on every call; the same cost applies to trade()).
- Decision: do NOT merge the fallback. Fix, redeploy (gates:13 again), use the one allowed formal re-run of gates:14 before 22:57:25Z.

## Spike run 2 (formal) + guide decision (2026-11-26 ~20:50 UTC)
- gates:13 redeploy DONE (upgrade finalized, check PASS, no stack warning). gates:14 formal re-run: (a) FAIL "owner read returned null", (b) PASS VRF request + callback inside the TEE ER (phase=trading), (c) PASS reveal (cards [9,13,3,1,5,10,1,13], sum 55), (f) PASS VRF on devnet-as. CU: CallbackDeal 49,058; RevealHands 84,061; RequestDeal 90,515. Validators: TEE and devnet-as both core 2.0.5.
- Interpretation: the program deals and reveals correctly inside the TEE; only the owner-authenticated read of the sealed Hand is unproven, and the script does not record what the owner actually got back (null vs placeholder vs decoded). Probable client/token-membership issue, not a TEE limitation — but UNPROVEN.
- **Guide decision (user approves by pasting the orchestrator block): one BOUNDED DIAGNOSTIC, not a third pass/fail run.** Add logging of the owner's and a stranger's raw getAccountInfo for the Hand, compare with MagicBlock's private-counter / rock-paper-scissor client reading pattern, run one diagnostic round. Hard cap: if the owner cannot read the dealt hand by 22:15Z, merge manifest-fallback.json (plan's merge command) and never revisit. Independent tasks (program:4, client:5, bots:6, web) continue meanwhile; bots:7 and gates:15 wait for the decision.

## Overnight status + decisions (guide, 2026-11-27 02:10 UTC / 03:10 WAT; 11h50m to the deadline)
- The orchestrator hit the account usage limit ~21:45Z (the all-flags permission fix never landed); the 22:45Z cap expired; fallback merged (385f6e0, variant commit-reveal, statuses preserved). Done: program:1/3/4, client:2/5, bots:6, gates:11–14. Running: program:20 (commit-reveal), web:8. Next: client:21, bots:7, web:9, docs:10; then gates:15 (early full deploy + real round, needs the user), 16–19.
- **Guide decision: ship commit-reveal as the default; fold a FREE Private-ER retest into the schedule.** The program keeps the Tee mode. Hypothesis (docs + private-counter example): the Hand's ephemeral permission member needs all view flags (TX_BALANCES|TX_MESSAGE as well), not AUTHORITY|TX_LOGS only; the TEE serves a blurred body otherwise. The one-line flags change rides in the same deploy as gates:15 (no extra redeploy); an optional diagnostic round after gates:15 tests it. Hard stop 06:30Z: if (a) passes and ≥3 h remain before the 12:00Z submit-by, flip the default mode to Tee by config and re-run the proof round; otherwise ship commit-reveal. README/submission describe both paths honestly (what was proven in the TEE: VRF + reveal; what did not: the member's read).
- Schedule (UTC): user sleeps now → 05:30Z; gates:15 + round 05:30–06:30; green-or-cut 07:00Z; demo/README 07:00–10:00Z; closing gates (16–19) 10:00–12:00Z; DEADLINE 14:00Z.

## Private ER proven (guide, 2026-11-27 ~02:50 UTC) — default flips back to Tee
- gates:14 diagnostic #2 (concierge, ledger 9b8ee8c): the owner's TEE read returns the real 76-byte Hand (decodes as seat 0, cards [7,8], dealt=true — matching the later reveal); stranger/payer/no-token read null. The earlier "blurred/undecodable" results were OUR client decoding the account under the wrong coder name ("Hand" vs "hand"), not the TEE. The permission member now has flags 0x1f; whether the all-flags change was needed is unproven (not worth testing).
- gates:15 deploy done (upgrade finalized, slot 526718687, 518,496 B). The real round FAILED at request_deal with ModeNotSupported (6006) on devnet-as: the ER ran the PREVIOUS cached build ~30 s after the upgrade (TEE had the new code ~2 min later). Rule from now on: after any program upgrade wait ≥5 min and let the demo runner retry the deal with backoff before treating this as a bug.
- Decision (user-approved by pasting): fix the client decode name; default deal mode back to Tee (config flag, commit-reveal stays as a switchable fallback in the same program); run the real proof round in Tee mode; record (a) PASS after client fix. Commit/undelegate parsing on 2.0.5 still untested until a round completes.

## Build green verified (guide, 2026-11-27 04:55 UTC / 05:55 WAT)
- Orchestrator reports all build tasks done (HEAD 39e661c); manifest statuses verified: only gates:17/18/19 pending. Deployed program byte-identical to HEAD (gates:16 verify-only). Default deal mode = tee; commit-reveal switchable. Agave pinned 3.1.9 as of this check. 7 h to the 12:00Z submit-by.
- Step 2 status: **done**. Seat settings: orchestrator claude-opus-5-5 · high (usage-limit interruption ~21:45Z–~02:00Z).
- Gaps found by the guide: (1) NO WEB HOSTING GATE — the form validates `website`; submission-draft `live-demo-url` is TBD. Add a closing gate "deploy web/dist as a static site" (Vercel via the user's logged-in Chrome, or the CLI) in the concierge closing pass. (2) /app is driven by the demo-round runner (burner-signed), so demo-studio is granted permission to run it, devnet only, WITHOUT --proof (gates:17 owns docs/proof/devnet-round.md). (3) Before the repo goes public (gates:18): scan history for secrets/.env and author emails (must all be the noreply identity).
- Next: Step 2.5 demo-studio (sonnet · high; browser-only capture, computer-use not granted). Then concierge closing pass (opus · high): gates:17 round, web deploy, gates:18 repo public, gates:19 submit.

## CLOSE-OUT (guide, 2026-11-27 ~11:50 UTC) — SUBMITTED
- **Submitted** to Solana Blitz v10 by the user, ~10 min before the 12:00Z internal submit-by, ~2 h before the 14:00Z deadline. The portal allows Edit/Withdraw until 14:00Z (from the client bundle; never tested against the server).
- **What was submitted:** project Hidden Hand; repo https://github.com/Dotman-Bei/hidden-hand (public); site https://hiddenhand.suitz.xyz (wallet mode default, Express mode at ?mode=express); video https://youtu.be/bl4FznfYQj0 (unlisted, shows EXPRESS mode); program HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb (devnet); explorer link = base-layer delegate_pda 2qB2YVU4… of the gates:17 closing round; categories Games, DeFi, Privacy.
- **Honest status the submission carries:** sealed hands on the MagicBlock Private ER (TEE), VRF deal, a linear information market (convergence by design); Express mode is the autoplay demo (script plays seat 4; bots fill the rest); wallet mode is live but only proven with a mock-wallet round + a manual test whose result stays FAIL: Solflare hard-blocks Rollup trades, OKX refuses the first popup, Phantom untested; a session-key variant is the planned fix.
- **Pipeline record:** 0a done · 0 done · 1 done · 2 done (21 tasks + the wallet-mode amendment 22–30) · 2.5 done (video) · 3 done (gates 11–19; gates:29 FAIL recorded, gates:30 run on the user's explicit override). Main HEAD at close: see git log.
- **Lessons worth keeping:** (1) a bare `anchor` command outside a pinned workspace flips WSL's Agave (documented in the tollgate); (2) three of our own bugs (VRF callback compute, a dead /permission poll, a wrong coder name "Hand" vs "hand") looked like TEE limits and nearly made us drop the Private ER: reproduce with a decoded read before blaming the platform; (3) the ER keeps serving the previous program build for minutes after an upgrade; (4) wallets treat the Rollup blockhash as mainnet: Solflare hard-blocks, so per-trade wallet signing needs session keys; (5) shared checkout on a feature branch = commit hazard: use temporary worktrees for main.
- **Post-deadline rules:** keep the repo PUBLIC and do not rewrite history, force-push, delete or recreate the repo, or delete the program until judging is over. Vercel preview URLs can stay (protected). Burner/program keys stay out of git.
