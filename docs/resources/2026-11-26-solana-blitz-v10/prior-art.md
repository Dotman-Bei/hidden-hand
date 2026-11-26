# Prior art — Solana Blitz v10

Fetched 2026-11-26.
- **Past winners (primary):** the portal's winners view [build.magicblock.app/builders?view=winners](https://build.magicblock.app/builders?view=winners), backed by `/api/builders`, which needs a signed-in session and was read in Chrome. Every `stage: "blitz"` submission with an `award` was collected: **40 winners across 10 editions**. One-lines are condensed from each team's own submission description. Repo and demo links are as submitted, with query strings stripped.
- **Theme references:** secondary (web search).

## Theme reference projects (named in the Luma description)

| Name | One-line | Tech | Link | Confidence |
|---|---|---|---|---|
| BananaZone | "trading games like BananaZone" (Luma) | Unknown | — | **LOW. Only the Luma mention found (GAP)** |
| Slimecoin | Real-money skill game on Solana (built by Supersize); reported as head-to-head games wagering USDC, non-custodial, instant withdrawals | MagicBlock Ephemeral Rollups (secondary) | [MagicBlock newsletter](https://magicblock.beehiiv.com/p/slimecoin-season-one-is-live-30-of-supply-up-for-grabs) · [Solana Compass: Supersize](https://solanacompass.com/projects/supersize) | MEDIUM (secondary) |
| Jungle Fun | Card-pack opening game built with MonkeDAO | MagicBlock VRF (secondary) | [Solana Compass: MagicBlock](https://solanacompass.com/projects/magicblock) | MEDIUM-LOW (one secondary mention). MonkeDAO Foundry is a portal partner |

Closest official reference code for the "packs" pattern: MagicBlock's **Magic Gachapon** example. A VRF pull mints a Metaplex Core NFT from 4 weighted templates. Devnet program `5q1a1rA56zJTmEUeNdceFGPR6QQRWYmFJjckucTadnDd` ([source](https://github.com/magicblock-labs/magicblock-engine-examples/tree/main/gachapon-example)).

## Past Blitz winners (all editions)

Event ids map to editions via `/api/events`. "Votes" is the portal's raw `votes` count; what it measures (judges or community) is not stated (**GAP**).

### V9 · Crypto World's Fair (event 15, Oct 4–12 2026), the most recent edition

| Award | Project | Cats | One-line (from submission) | MagicBlock tech | Repo · Demo |
|---|---|---|---|---|---|
| 1st | **Battle Cities** | Games | Real-time Unity tank combat; VRF picks power-up types and spawn locations so drops are "fair and auditable"; movement/shooting/collisions on a game server | VRF | [repo](https://github.com/CryptoSodi/BattleCitiesUnity) · [site](https://magic.battlecities.com) · YouTube |
| 2nd | **Blackout** | Games, Privacy | Real-time fog-of-war battle royale (Rust + Anchor); the **Private ER runs the authoritative simulation in an Intel TDX enclave at 20 ticks/s**; sealed world state + permissioned per-player View accounts; VRF seeds spawns, loot, zones | Private ER + permissions + VRF | [repo](https://github.com/Anshv784/blackout) · [site](https://blackout.anshverma.tech/) · [video](https://youtu.be/rTFv5-P7uyU) |
| 3rd | **Noirwire** | DeFi, Privacy | Private order book for perps + spot; hides the resting book and each trader's state; fills public; Exchange account delegated on devnet | Private ER | [repo](https://github.com/Noirwire/orderbook-noirwire) · [site](https://noirwire.com) · [video](https://youtu.be/kkeAh2joEGg) |
| Wizardio | **Nightfall** | Games, Privacy, Consumer | Real-time battle royale with "true fog of war, where even the server can't see you" | Private ER | [repo](https://github.com/codeswithroh/nightfall) · [site](https://nightfall-blitz.vercel.app) · [video](https://youtu.be/BbZI25i2Mgo) |

### V8 · Global Startup Village (event 13, Sep 4–13 2026)

| Award | Project | Cats | One-line | MagicBlock tech | Repo · Demo |
|---|---|---|---|---|---|
| 1st (12 votes) | **Herd** | Games, Consumer | Real-money party game for the Solana Seeker: say the same word as the crowd in 30 s; the smallest group is eliminated each round; the final two split the pot or let an oracle flip | Private ER (answers sealed in a delegated account with an ephemeral permission) | [repo](https://github.com/Fahad-Dezloper/Herd) · [video](https://youtu.be/0Kz0l9v0J4E) |
| 2nd | **Ultra Pong** | Games, Consumer | 8-player survival Pong; the arena shrinks and the ball speeds up as players drop | ER multiplayer game loop on-chain | [repo](https://github.com/X2C-fun/UltraPong) · [site](https://ultra-pong.vercel.app/) |
| 3rd | **Alerith** | Games, DeFi, Consumer | 3D medieval MMORPG on Solana with a player-made economy ("three years in Unity") | (not stated in the captured text) | [repo](https://github.com/Trinks/Hackerhouse) · [site](https://alerith.com) |
| Wizardio | **HoldOut** | Games, DeFi, Payments | Real-time "hold or fold": up to 10 players ante SOL against a live SOL/USD market; folders pay a decaying toll to holders; no house edge | ER + live price | [repo](https://github.com/priyanshudotsol/holdout) · [site](https://holdout.priyanshu.pro/) |

### V7 · Collaboration (event 10, Aug 2026)

| Award | Project | One-line | Tech | Repo |
|---|---|---|---|---|
| 1st | **BlitzMine** (DeFi, Social, Consumer) | 60-second rounds on a 5×5 grid: stake SOL on tiles, one tile wins and backers split the pot, losers feed a random "motherlode" (ore.supply-like) | ER (+ randomness) | [repo](https://github.com/Monti-27/BlitzMine) · [video](https://youtu.be/5f436hY0Rjs) |
| 2nd | **Tenor** (Privacy, DeFi, Infra) | Private multi-dealer FX RFQ (USD/INR): 5 dealers quote blind in a TEE ER, settle publicly | PER, session keys, Pyth on ER, Ephemeral SPL, Magic Actions | [repo](https://github.com/Shaurya2k06/tenor) |
| 3rd | **OOBE Protocol** (AI/Agents, Privacy, Infra) | Open-source MCP server exposing Solana/MagicBlock actions to agents | — | [repo](https://github.com/OOBE-PROTOCOL/sap-mcp) |
| Wizardio | **Loofta – Rip Room** (Games, Payments, Consumer) | **Pooled pack-opening game**: a room pays in together, the pack opens, VRF decides who is excluded, survivors vote each other down | VRF | [repo](https://github.com/lisabeyy/loofta-pay) · [site](https://loofta.xyz) |

### V6 · Mobile (event 2, Jul 2026)

| Award | Project | One-line | Tech |
|---|---|---|---|
| 1st | **CapturGO** (DePIN, Privacy) | Mobile location-to-earn; reward claims routed as private SPL transfers from a balance held in the Private ER | PER + private payments (challenge/login) — [repo](https://github.com/CapturGo/capturgo-magicblock) |
| 2nd | **Perps Rider** (Games, DeFi) | Mobile-first arcade trading game in a shared open world | ER (devnet) — [repo](https://github.com/EchoWebLV/perps-games) |
| 3rd | **Hunch** (Games) | Stake SOL, climb fruit rows with one hidden "bust" each; cash out any time; every slice is an on-chain tx | ER — [repo](https://github.com/priyanshudotsol/Hunch-magicblock) |
| Wizardio | **VeilMarket** (DeFi, Privacy) | Private prediction market: gasless real-time bet changes, hidden stake sizes | ER/PER — [repo](https://github.com/usainbluntmx/veilmarket) |

### V5 · Trading (event 1, Jun 2026)

| Award | Project | One-line | Tech |
|---|---|---|---|
| 1st | **Ghost Stops** (DeFi) | Trailing stops / OCO / brackets for Flash Trade perps; the ER's validator crank ticks each delegated Order ~100 ms against live Pyth, fee-free | ER + cranks + oracle — [repo](https://github.com/Magicianhax/ghost-stops) |
| 2nd | **Eclipse** (DeFi, Privacy) | Private prediction market; positions virtual and private in a TEE ER, synced at resolution | PER — [repo](https://github.com/shumhn/Eclipse) |
| 3rd | **SHEAR** (DeFi) | Relative-value perps (e.g. SOL/ETH ratio) against a shared USDC pool | — [repo](https://github.com/priyanshudotsol/Shear) |
| Wizardio | **EPOCH** (DeFi) | Each prediction market = one ER session; Pyth outcome triggers a Magic Action settlement | ER + Magic Actions + oracle — [repo](https://github.com/nisargpatel7042lva/EPOCH) |

### V4 · Agentic (event 4, Apr 2026)

1st **Forge** ([repo](https://github.com/WorldsBestSoftwareDeveloper/forge); no description captured) · 2nd **Kestrel**, policy-bound trading agents on short BTC markets, each market and agent account delegated to the ER ([repo](https://github.com/priyanshpatel18/kestrel-labs)) · 3rd **Sealdex**, sealed-bid auctions for AI bidding agents ([repo](https://github.com/0xNoramiya/sealdex)) · Wizardio **Whisper Exchange**, agents sell information privately on an ER ([repo](https://github.com/shrooms08/whisper-exchange)).

### V3 · Anything (event 5, Apr 2026)

1st **privRoll**, private bulk disbursements "with zero custom smart contracts" via the **Private Payments API** ([repo](https://github.com/ajeeshRS/privRoll)) · 2nd **Expensee**, private salary streaming with crank-scheduled accrual in the TEE ([repo](https://github.com/shumhn/Expensee)) · 3rd **GhostPay**, payroll on PER ([repo](https://github.com/mitgajera/ghostpay)) · Wizardio **confidential-desk**, lending on the ER with Private Payments / ephemeral SPL shielding ([repo](https://github.com/priyanshpatel18/confidential-desk)).

### V2 · Privacy (event 6, Mar 2026)

1st **loofta pay**, P2P USDC via delegated deposit accounts in the PER ([repo](https://github.com/lisabeyy/loofta-pay-demo)) · 2nd **veil**, commit-reveal sealed-bid auction with an ER-delegated runtime account ([repo](https://github.com/priyanshpatel18/veil)) · 3rd **WHO RUG US?**, on-chain social deduction game ([repo](https://github.com/AiltonSavio/who-rug-us-monorepo)) · Wizardio **Shyft.lol**, private social with TEE + Permission Program ([repo](https://github.com/ck2010317/Shyft.lol)).

### V1 · Privacy (event 7, Mar 2026)

1st **taskforest**, task marketplace with gasless ER bidding then L1 escrow ([repo](https://github.com/jimmdd/taskforest-protocol)) · 2nd **Blockrooms**, Backrooms-style on-chain FPS with game accounts delegated per session ([repo](https://github.com/bruhhgnik/BlockRooms-Frontend)) · 3rd **Magic Hide And Seek**, positions committed to the ER in real time ([repo](https://github.com/JustAnotherDevv/Magic-HideAndSeek)) · Wizardio **Soliton**, Rule 110 cellular automaton on the ER ([repo](https://github.com/Alfie/soliton/)).

### V0 · Privacy (event 8, Feb 2026)

1st **MagicCraft** · 2nd **Heres** · 3rd **Timebent** · Wizardio **AgeOfClankers**. Repos only, no descriptions.

## Observed patterns (counts from the table above, not advice)

- **Games dominate recent podiums.** In V8 and V9, 7 of 8 winners list `Games`.
- **Private ER is the strongest recent signal.** 3 of V9's 4 winners (Blackout, Noirwire, Nightfall) run on the Private ER/TEE, and so does V8's 1st (Herd). VRF features in V9's 1st (Battle Cities) and 2nd (Blackout).
- **Entertainment-finance precedents already won:**
  - pooled pack opening + VRF (Loofta Rip Room, V7 Wizardio)
  - real-money wager games (HoldOut, Hunch, Herd, BlitzMine)
  - prediction markets (Eclipse, VeilMarket, EPOCH)
- **Repeat winners:** the `priyanshudotsol` / `priyanshpatel18` GitHub owners appear across ≥6 awards (HoldOut, Hunch, SHEAR, Kestrel, veil, confidential-desk). Expect them in V10.
- Most winners submit a GitHub repo, a live site and a demo video link. 34 of 40 have a video/post link; all 8 V8/V9 winners do.

## V10 competition

**Not visible.** `/api/builders` returns `revealedEvents: [1,2,3,4,5,6,7,8,10,11,13,15]`, which excludes 17 (V10), so this edition's submissions stay hidden until revealed (**GAP**).

## Ideas MagicBlock's portal lists (build.magicblock.app/ideas, "What builders listed")

"UGC quest platform with verifiable gacha" (Games/DeFi/Privacy) · "Private skill-wagering for esports gamers" (Privacy) · "Instant private payouts for promoters" (DeFi/Social/Consumer) · "Micro prediction markets for live creators" (Privacy/Social/Consumer) · "Energy-saving leagues inside Telegram" (DeFi/Privacy) · "Private lending circles for campus". Each shows "Related submissions · 6", so all are already claimed.

The page also has a 3-word **idea generator** ("3 of 3 left this week") and a "Build MVP with your agent" link that points to the MagicBlock dev skill.

## MagicBlock live demos (examples repo `DEMOS.md`)

Counter, Private Counter, Session Keys, Roll Dice, Binary Prediction, SPL Tokens, Rock Paper Scissor, Rewards (Delegated VRF), Gasless Starter, plus one.magicblock.app (private payments). Dice, gachapon, RPS, binary prediction and sealed auction ship as official templates.
