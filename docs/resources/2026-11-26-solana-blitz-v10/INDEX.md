# Resource pack — Solana Blitz v10 (Entertainment Finance, host MagicBlock)

Extracted 2026-11-26, ~14:20–15:05 UTC, by the Step 0a resource-extractor (`claude-opus-5-5`) inside a 50-min time box. Submission deadline: **2026-11-27 14:00 UTC**.

## Contents

| File | What it holds |
|---|---|
| [event.md](event.md) | Dates/deadline, eligibility, judging text (no weights), prizes, exact submission fields, devnet/mainnet rule |
| [tracks.md](tracks.md) | No tracks: theme, prize ladder, category list, what counts as "integration proof" |
| [sponsors/magicblock.md](sponsors/magicblock.md) | Version pins, devnet endpoints/validators, program IDs, ER / VRF / private payments / cranks / session-keys signatures + code + gotchas, examples repo |
| [prior-art.md](prior-art.md) | BananaZone / Slimecoin / Jungle Fun, past Blitz winners, official templates |

## Headline facts for idea-forge and the architect

1. **Qualify:** *"Every submission must integrate MagicBlock's Ephemeral Rollup or VRF."*
2. **Judged on:** *"creativity, technical depth, and how compellingly they showcase what's possible on Solana."* **No weights published.**
3. **Proof the portal checks:** delegations, VRF requests and private payments from *your* program, wallet or fee vault, on devnet or mainnet. Ordinary transfers and swaps don't count.
4. **Pins:** Anchor **1.0.2**, Solana/Agave **3.1.9**, Rust **1.89.0**, Node **24.10.0**, `ephemeral-rollups-sdk` **0.18.x**. Not 0.20.x, which is devnet-us/validator-2.0 only. This machine has Anchor 0.30.1 and no Solana CLI or WSL (see the tollgate).
5. **Form:** open for V10 (needs Telegram sign-in). Requires a GitHub repo (public, or invite `@jonasXchen`), a "Pitch & Demo" URL and an "Explorer link (integration proof)".

## Provenance

| # | Source | Fetched | Tool | Primary? | Confidence / gaps |
|---|---|---|---|---|---|
| 1 | https://luma.com/hedv5sgh | 2026-11-26 | curl (static HTML, embedded JSON) | primary | High: description, prizes, `start_at`/`end_at`, timezone verbatim |
| 2 | https://build.magicblock.app/?stage=blitz#submit | 2026-11-26 | Chrome (`navigate`, `get_page_text`, `javascript_tool`) | primary | High: rendered prizes, eligibility, criteria, V10 form header. Fields were read only; nothing typed or submitted |
| 3 | https://build.magicblock.app/api/events | 2026-11-26 | Chrome `fetch` + curl | primary | High: event id 17, `status: active`, dates |
| 4 | https://build.magicblock.app/api/panels | 2026-11-26 | curl | primary | High: verbatim `judging`, `eligibility`, `prizes`, FAQs |
| 5 | https://build.magicblock.app/api/highlights | 2026-11-26 | curl | primary | High for names/awards. No project descriptions (gap) |
| 6 | https://build.magicblock.app/api/champions, /api/partners, /api/metrics/er, /api/community, /api/mentors/public | 2026-11-26 | curl | primary | `champions` returned only a signed-out stub. Partners = logos only. Metrics: 11,672,522 ER sessions / 51,482 users (at 2026-11-26T14:07Z) |
| 7 | `/api/program-check`, `/api/repo-check` | not called | — | — | Behaviour read from the client bundle only. Not called (needs a real address/repo) — **gap** |
| 8 | Portal JS bundle `/_next/static/chunks/*.js` (19 chunks, esp. `0susu2k1c3iji.js`, `10rp9whn588gh.js`) | 2026-11-26 | curl + local regex | primary (code) | High: field map, step validation, tooltip text, categories, shared-account list, `GITHUB_REVIEWER`. The server-side schema isn't visible, so required-vs-optional is inferred from client validation |
| 9 | https://docs.magicblock.gg/llms.txt + /llms-full.txt (docs.magicblock.xyz 301-redirects here) | 2026-11-26 | curl | primary | High. Mintlify dump of the canonical docs; line refs in sponsors/magicblock.md |
| 10 | https://docs.magicblock.gg/pages/ephemeral-spl-token/api-reference/openapi/transfer.openapi.json | 2026-11-26 | curl | primary | High: transfer request schema incl. `platformFeeAccount` |
| 11 | github.com/magicblock-labs/magicblock-engine-examples (tree, DEMOS.md, counter/anchor/Anchor.toml, gachapon-example/Anchor.toml + README) | 2026-11-26 | `gh api` | primary | High: pins `anchor_version = "1.0.2"`, gachapon devnet program |
| 12 | Web search: BananaZone, Slimecoin, Jungle Fun, Blitz V9 winners | 2026-11-26 | WebSearch | secondary | Low/medium: see prior-art.md. BananaZone has no source beyond Luma |
| 13 | https://build.magicblock.app/builders?view=winners → `/api/builders` (session-gated JSON, read in-page; only project fields kept, no personal data) | 2026-11-26 (follow-up) | Chrome (`navigate`, `javascript_tool`, `get_page_text`) | primary | High: all 40 Blitz winners V0–V9 with category, description, repo, demo. Descriptions truncated at 420 chars on capture. `revealedEvents` excludes V10 |
| 14 | https://build.magicblock.app/champions | 2026-11-26 (follow-up) | Chrome | primary | High: resolves `CLAIM_QUALIFY_RATING = 7` (Champions program, not judging) |
| 15 | https://build.magicblock.app/ideas | 2026-11-26 (follow-up) | Chrome | primary | High: 6 listed ideas, all with submissions; idea generator |
| 16 | https://build.magicblock.app/ (home, full scroll) | 2026-11-26 (follow-up) | Chrome | primary | No new judging or video info beyond the Blitz panel (#2/#4) |

## Gaps (honest unknowns)

1. **Judging weights:** none published anywhere, including a full pass of build.magicblock.app (home, builders, winners, ideas, champions). `CLAIM_QUALIFY_RATING = 7` is now **resolved** as the Champions program's rating, not judging. The meaning of the daily leaderboard crawl and of the winners' `votes` count is still unknown.
2. **Demo video:** "Pitch & Demo" is a validated URL field, but a *video* isn't explicitly mandated. In practice, 34 of 40 past winners submitted a video or video-post link (YouTube, X, Loom, Tella, Descript, Drive). All 8 V8/V9 winners did. The 6 without one are the 4 V0 winners, plus V1's taskforest (empty field) and Blockrooms (a site link).
3. **Wizardio's Choice criteria:** unpublished.
4. **"Recent activity" window** for the on-chain check, and whether mainnet counts more than devnet: unknown.
5. ~~Past winners' descriptions~~ **Resolved:** all 40 Blitz winners V0–V9 are in prior-art.md. Remaining: V10 competitor submissions are hidden until revealed.
6. **BananaZone:** no source beyond the Luma mention. Slimecoin and Jungle Fun rest on secondary sources only.
7. **MagicBlock SDK details not extracted:** the Private-ER TS auth-token flow, the session-keys program ID, the Magic Router / `ephemeral-rollups-kit` TS API, and the roles of portal-listed `5inNvZ…`, `CrankS2…`, `vrfkfM4…`.
8. **`/api/program-check` and `/api/repo-check`** were not exercised live.
9. **"DEEP" target sponsor:** no such sponsor exists in any source. Read as "MagicBlock, deep depth".
10. The Telegram builders group and the MagicBlock X posts (tweet IDs listed in `/api/panels`) were not read.
