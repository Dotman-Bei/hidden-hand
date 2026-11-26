# Solana Blitz v10 — event essentials

Fetched 2026-11-26. All quotes are verbatim. Sources: [Luma](https://luma.com/hedv5sgh) (static HTML), the portal [build.magicblock.app](https://build.magicblock.app/?stage=blitz#submit) (rendered in Chrome), `/api/events`, `/api/panels`, and the portal's client JS bundle.

## Dates and deadline

| Fact | Value | Source |
|---|---|---|
| Start | `2026-11-20T14:00:00.000Z` | Luma `start_at`; portal `/api/events` id 17 `startDate` |
| End | `2026-11-27T14:00:00.000Z` | Luma `end_at`; portal `endDate` |
| **Submission close** | **`2026-11-27T14:00:00.000Z`** = 14:00 UTC = 15:00 WAT = 22:00 SGT | portal `/api/events` id 17 `submitEndDate` (agrees with Luma `end_at`) |
| Luma event timezone | `Asia/Singapore` | Luma JSON |
| Portal countdown at fetch time (~14:25 UTC) | "SUBMISSIONS CLOSE IN 0d 23h 54m" | portal rendered page |

No conflicts: Luma and the portal agree on every date.

## Portal event record (`/api/events`, id 17)

`"id":17,"stage":"blitz","title":"Solana Blitz","description":"Building an Entertainment Finance app? Submit to Blitz and turn your idea into an MVP.","status":"active","startDate":"2026-11-20T14:00:00.000Z","endDate":"2026-11-27T14:00:00.000Z","submitEndDate":"2026-11-27T14:00:00.000Z","location":"Onchain","link":"https://luma.com/hedv5sgh","edition":"V10","theme":"Entertainment Finance"`

## Is the form open to V10?

**Yes.** In Chrome the client-rendered form shows *"SUBMITTING FOR Solana Blitz · V10 · Entertainment Finance"* with steps *"1 Purpose · 2 About you · 3 Proof of Work · 4 Boost"*. The "No open events" text in the server HTML is pre-hydration only. The form needs sign-in with Telegram (`/api/telegram/login`). The browser was already signed in; nothing was typed or submitted.

## Eligibility (verbatim, portal `/api/panels` → `blitz.eligibility`)

> "Every submission must integrate MagicBlock's Ephemeral Rollup or VRF. The top prize rewards the strongest overall build."

FAQ (`/api/panels` → `blitz.faqs`; this is `show.faqs:false`, so the portal doesn't display it):
> Q "Who can participate?" A "Anyone who wants to build can join Solana Blitz. Registration happens on Luma and the event itself is fully virtual"
> Q "Do I need a team?" A "No. You can build solo or find collaborators in https://build.magicblock.app/builders"

## Judging criteria — published text, NO weights

Portal, `/api/panels` → `blitz.judging` (shown on the page as "SELECTION CRITERIA"):

> "Projects are judged on creativity, technical depth, and how compellingly they showcase what's possible on Solana."

- **No numeric weights are published** on Luma, the portal panel or the portal API. Treat the three criteria (creativity · technical depth · showcase of what's possible on Solana) as equal-weight and unconfirmed. **GAP.**
- The portal bundle defines `CLAIM_QUALIFY_RATING = 7` and award states `["Accepted","Qualified","Disqualified"]` (for non-Blitz stages). The constant's meaning (maybe an internal 10-point review rating) is **not documented. Don't treat it as a rubric.**
- The portal bundle defines `LEADERBOARD_CRAWL_LABEL = "daily at 4 AM SGT"`, so on-chain activity is crawled into a leaderboard daily. Whether that feeds Blitz judging is **unconfirmed (GAP)**.

## Prizes (verbatim)

Luma description:
> "🥇 1st Prize — $500 USDC / 🥈 2nd Prize — $250 USDC / 🥉 3rd Prize — $150 USDC / 🧙 Wizardio's Choice — $100 USDC"

Portal `/api/panels` → `blitz.prizes`: "1st Place 500 USDC", "2nd Place 250 USDC", "3rd Place 150 USDC", "Wizardio's Choice 100 USDC". Award labels in the bundle: `BLITZ_AWARDS = ["1st Prize","2nd Prize","3rd Prize","Wizardio Award"]`. Total **$1,000 USDC**. Prizes pay to the wallet connected in the submission form, per the guide's SSR snapshot. That wallet-connect step wasn't exercised (connecting a wallet is out of bounds for this session), so it's unverified this session.

## Submission format (from the portal bundle `0susu2k1c3iji.js`, field map + step validation)

Steps: `["Purpose","About you","Proof of Work","Boost"]`. Fields the client validates per step (`aZ`):

| Step | Fields validated before Next | Notes |
|---|---|---|
| 0 Purpose | `program` (= event id; 17 for V10) | |
| 1 About you | `firstName`, `lastName`, `email`, `country` | |
| 2 Proof of Work | `projectName`, `description`, `website`, `github`, `demo`, `explorer` | Labels: "Pitch & Demo" (URL input, placeholder `https://…`); **"Explorer link (integration proof)"** (URL, placeholder `https://explorer.solana.com/…`) |
| 2 (cont.) | **On-chain addresses "(optional)"**, up to `ONCHAIN_ADDRESSES_MAX = 28` | checked live via `/api/program-check?address=` ("Checking devnet & mainnet…") |
| 2 (cont.) | `categories`, auto-suggested top 3 | `PROJECT_CATEGORIES = ["DeFi","Payments","Games","AI / Agents","Privacy","Infra","DePIN","Social","Consumer","Other"]` |
| 3 Boost | `teamMembers` (Telegram handle + ≥1 role each), `ownerX` / X accounts (validated X handles), `additionalInfo`, `batches` | |

- **Demo video:** there is no dedicated "video" field. **"Pitch & Demo"** is a URL field that is validated at step 2, so a pitch/demo link is effectively required. The bundle has YouTube/Shorts helpers (`youtubeId`, `isYoutubeShort`), which suggests a YouTube link is the expected form. Whether a *video* specifically is mandatory is **not stated (GAP)**. Plan for one.
- **GitHub:** checked by `/api/repo-check?url=`. Verbatim hint: *"Public? Check the URL. Private? Invite @jonasXchen on GitHub, then submit."* (`GITHUB_REVIEWER = "jonasXchen"`). A private repo is acceptable if you invite that reviewer.
- **On-chain address rules (verbatim tooltip):**
  > "Add the addresses your app runs through. We work out what each one is."
  > "**Program:** your deployed program. Its delegations, VRF requests and private payments count."
  > "**Wallet:** your relayer, fee payer or app wallet. Private payments it signs count."
  > "**Fee vault:** receives your app's private payment fees (your `platformFeeAccount` or its owner wallet). Every payment that pays your fee counts."
  > "We check recent devnet and mainnet activity. Ordinary transfers and swaps don't count."
- **Shared accounts are rejected** ("That's a shared account. Add your app's own address"). The list: MagicBlock's delegation `DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh`, ACL `ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1`, VRF `Vrf1RNUjXmQGjmQrQLvJHs9SNkvDJEsRVFPkfSQUwGz`, SPL `SPLxh1LVZzEkX99H6rqYizhytLWPZVV296zyYDPagv2`, `5inNvZhedNg28nwPSdZQ2tJue9VtDxgyf1oiSGbhHxuw`, `CrankS2fXgMGvQJ3VBrZmRfGrfogDY6pq5YcgkPEpSNf`, `vrfkfM4uoisXZQPrFiS2brY4oMkU9EWjyvmvqaFd5AS`, `Magic11111111111111111111111111111111111111`, `MagicContext1111111111111111111111111111111`, System, Token, Token-2022, ATA.
- The portal also has `/api/submit/carry`, which carries a Blitz submission forward to Forge (`nextStagesFor("blitz") = ["forge","hacker"]`).

## Devnet vs mainnet

There is no rule requiring mainnet. The portal *"check[s] recent devnet and mainnet activity"*, so **devnet integration activity counts**. Gaps: what "recent" means as a window, and whether mainnet scores higher.
