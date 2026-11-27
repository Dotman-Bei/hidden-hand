# Submission draft — Solana Blitz V10 (Entertainment Finance)

Form: https://build.magicblock.app/?stage=blitz#submit (event id 17, steps "Purpose · About you · Proof of Work · Boost"; Telegram sign-in). Deadline **2026-11-27 14:00 UTC**; internal submit-by 12:00 UTC.
Field names and order come from the portal bundle (`docs/resources/2026-11-26-solana-blitz-v10/event.md`). Facts that only exist after the build are `TBD-post-build:<what>` lines; the Step-3 gate-concierge closing pass resolves them (demo-studio resolves the demo video). Personal fields are typed into the form by the user and are never stored in this repo.

## Step 0 — Purpose

- **program:** Solana Blitz · V10 · Entertainment Finance (event id 17)

## Step 1 — About you

- **firstName / lastName / email / country:** typed by the user in the form (personal data is not stored in this repo).

## Step 2 — Proof of Work

- **projectName:** Hidden Hand
- **description:**

  Hidden Hand is a 90-second on-chain trading pit. MagicBlock VRF deals each of four seats two sealed cards inside a Private Ephemeral Rollup (a TEE): only the owner can read their hand. Everyone trades one contract worth the hidden sum of all eight cards against an on-chain market maker, with zero-fee trades on the Ephemeral Rollup and no wallet prompt per trade. It is a **linear information market**: one contract moves the price one point, so each trade's size encodes what a sealed hand knows, and the price converges on the hidden sum **by design**, not through clever bots (2000 seeded deals: the close lands within 4 points of the hidden sum in 100% of rounds with four informed seats). At the bell the hands flip on-chain, the hidden sum draws across the price chart, the round commits and undelegates back to Solana, and the best trader takes the pot on the base layer. Scripted bots fill empty seats. Honest limit: **a random or idle human breaks the reveal** (35% and 51% of rounds within 4), which is why the `--demo` round fills seat 4 with a bot. Devnet only; no real funds.

- **website:** https://hiddenhand.suitz.xyz
- **github:** https://github.com/Dotman-Bei/hidden-hand (public since 2026-11-27T08:15Z, gate `gates:18`)
- **demo ("Pitch & Demo"):** TBD-post-build:demo-video-url
- **explorer ("Explorer link (integration proof)"):** https://explorer.solana.com/tx/2qB2YVU4HuebT9voJH3P6zjxaCqSmdqfE8DGtXbQUX8n68MPdD2M1dH5suHx9VW5tuCGzz5yWjjrL9qvgHNpVhoA?cluster=devnet
  (a **base-layer** `delegate_pda` transaction of our program, from the last line of `docs/proof/devnet-round.md`)
- **On-chain addresses (optional, ≤ 28):**
  - Program: HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb (our deployed `hidden_hand` program on devnet: its delegations and VRF requests count)
  - Wallet: BT9TYK3HL5Bc7rZfTNrPiGkjGXDKeDpdEPgWBqAks1Bs (the round runner's fee payer)
  - Never list MagicBlock's shared accounts (delegation `DELeGG…`, permission `ACLseo…`, VRF `Vrf1RN…`, magic program/context, system/token programs): the portal rejects them as "your" address.
- **categories (≤ 3):** Games · DeFi · Privacy

## Step 3 — Boost

- **teamMembers:** typed by the user (Telegram handle + role; solo builder with an AI build pipeline).
- **ownerX / X accounts:** typed by the user.
- **additionalInfo:**

  Built during the event: one Anchor 1.0.2 program on `ephemeral-rollups-sdk` 0.18.0 (Private ER permissions, VRF on `DEFAULT_EPHEMERAL_QUEUE` inside the ER, commit + undelegate), a TypeScript client and scripted bots, and a React front end. The proof file `docs/proof/devnet-round.md` in the repo lists the base-layer signatures (open, delegations, the validator's commit/undelegate landing, claim) and the ER signatures (permissions, VRF request, trades, reveal, settle) of a real devnet round. The sealed hands ship on the Private ER (TEE); commit-reveal over VRF (sealed hands via VRF seed + committed secrets on the public devnet ER) is a switchable fallback in the same program, which is what we planned to ship if the TEE read had failed, stated in the README.

- **batches:** as offered by the form.
