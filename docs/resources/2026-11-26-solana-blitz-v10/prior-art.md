# Prior art — Solana Blitz v10

Fetched 2026-11-26. Past winner names come from the portal's `/api/highlights` (primary). Descriptions of the three theme references are **secondary** (web search), because the projects' own sites were not reached inside the time box.

## Theme reference projects (named in the Luma description)

| Name | One-line | Tech | Link | Confidence |
|---|---|---|---|---|
| BananaZone | "trading games like BananaZone" (Luma) | Unknown. No dedicated page was found | — | **LOW. Only the Luma mention found (GAP)** |
| Slimecoin | Real-money skill game on Solana with non-custodial play and instant withdrawals, built by Supersize; reported as head-to-head games wagering USDC | MagicBlock Ephemeral Rollups (secondary) | [MagicBlock newsletter: "Slimecoin.io is now live"](https://magicblock.beehiiv.com/p/slimecoin-season-one-is-live-30-of-supply-up-for-grabs) · [Solana Compass: Supersize](https://solanacompass.com/projects/supersize) | MEDIUM (secondary aggregators) |
| Jungle Fun | Card-pack opening game built with MonkeDAO | MagicBlock VRF (secondary) | [Solana Compass: MagicBlock](https://solanacompass.com/projects/magicblock) | MEDIUM-LOW (single secondary mention). MonkeDAO Foundry is a portal partner |

Closest official reference code for the "packs" pattern: MagicBlock's own **Magic Gachapon** example, a VRF pull that mints a Metaplex Core NFT from 4 weighted templates on devnet. Program `5q1a1rA56zJTmEUeNdceFGPR6QQRWYmFJjckucTadnDd` ([source](https://github.com/magicblock-labs/magicblock-engine-examples/tree/main/gachapon-example)). Expect other entrants to clone it.

## Past Blitz winners (portal `/api/highlights` → `blitz`)

| Edition | Award | Project | One-line / tech |
|---|---|---|---|
| V9 · Crypto World's Fair (event 15) | 1st Prize | Battle Cities | **GAP**: no description reached |
| V9 | 2nd Prize | Blackout | **GAP** |
| V9 | 3rd Prize | Noirwire | **GAP** |
| V9 | Wizardio Award | Nightfall | **GAP** |
| V8 · Global Startup Village (event 13) | 1st Prize | Herd | **GAP** |
| V8 | 2nd Prize | Ultra Pong | **GAP** (name suggests a real-time game) |
| V8 | 3rd Prize | Alerith | **GAP** |
| V8 | Wizardio Award | HoldOut | **GAP** |

Earlier editions (themes from `/api/events`): V2 Privacy (Mar 2026), V3 Anything, V4 Agentic (Apr), V5 Trading (Jun), V6 Mobile (Jul), V7 Collaboration (Aug), V8 Global Startup Village (Sep), V9 Crypto World's Fair (Oct).

Secondary, unverified: a Solana Compass page lists recent Blitz projects **BlitzMine** (real-time mining game, VRF tile selection), **Tenor** (private multi-dealer FX RFQ on Private ERs) and **Oobe Protocol** (MCP server for AI agents with MagicBlock tooling), without a clear edition. Its Blitz v6 write-up reports "41 Mobile Apps, Three Winners" ([source](https://solanacompass.com/news/magicblock-solana-blitz-v6-41-mobile-apps-three-winners-one-weekend)).

## Graduated / Forge projects (portal `/api/highlights` → `forge`, `hacker`)

Forge Epoch 01 accepted: Proof of War, Stablecorp, Solana City, loofta pay. Bangkok Hacker House accepted: PortFi, Chord, 8 Bit Studio, Showdown, Decent Gaming, loofta pay, 1tap, Stablecorp.

## MagicBlock live demos (examples repo `DEMOS.md`), likely judge reference points

Counter, Private Counter, Session Keys, Roll Dice, Binary Prediction, SPL Tokens, Rock Paper Scissor, Rewards (Delegated VRF), Gasless Starter. Also the private payments app at one.magicblock.app.

**White-space note (fact, not advice):** dice, gachapon, RPS, binary prediction and sealed auction already ship as official templates. An entry that only reskins one of them competes with MagicBlock's own reference code.
