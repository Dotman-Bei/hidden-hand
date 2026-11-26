# Tracks — Solana Blitz v10

**There are no sponsor tracks or bounties.** Every entry competes on one leaderboard. MagicBlock is the host and the only prize sponsor; the portal's partner logos (Solana, Blueshift, Solar, Superteam, MonkeDAO Foundry) carry no prizes.

## Theme (verbatim, Luma)

> "Games are becoming markets, and markets are becoming entertainment. We call this Entertainment Finance: apps where you trade, collect, compete and win assets you actually own, with game mechanics on top. Think trading games like BananaZone, skill games with real prizes like Slimecoin, or packs you open and collect like Jungle Fun."
>
> "Build with anything in the MagicBlock stack, including what Entertainment Finance needs: zero-fee transactions, VRF and privacy for fully onchain apps on Solana."

## Prize ladder

| Award | Amount | Who decides |
|---|---|---|
| 1st Place / "1st Prize" | 500 USDC | judges |
| 2nd Place | 250 USDC | judges |
| 3rd Place | 150 USDC | judges |
| Wizardio's Choice / "Wizardio Award" | 100 USDC | "Wizardio" (MagicBlock's mascot persona). Criteria unpublished (**GAP**) |

## Minimum bar to qualify (verbatim)

> "Every submission must integrate MagicBlock's Ephemeral Rollup or VRF."

What the form treats as **"integration proof"**:
1. **Explorer link (integration proof)**, a URL such as `https://explorer.solana.com/…`, validated at step 2.
2. **On-chain addresses (optional, ≤28)**, checked by `/api/program-check` against recent devnet + mainnet activity:
   - **Program:** its *delegations, VRF requests and private payments* count.
   - **Wallet** (relayer / fee payer / app wallet): *private payments it signs* count.
   - **Fee vault** (`platformFeeAccount` or its owner): *every payment that pays your fee* counts.
   - *"Ordinary transfers and swaps don't count."* MagicBlock's own shared programs are rejected as addresses.

So the cheapest strong proof is a **deployed program that delegates accounts to an ER and/or requests VRF**, plus an explorer link to one of those transactions.

## Portal category list (pick ≤3; the portal auto-suggests the top 3)

`DeFi · Payments · Games · AI / Agents · Privacy · Infra · DePIN · Social · Consumer · Other`

## "DEEP" target

The kickoff names "MagicBlock, DEEP". No sponsor, track or partner called DEEP appears on Luma, the portal, `/api/partners` or the docs. I read it as "MagicBlock at deep depth". **GAP** if the user meant a separate sponsor.
