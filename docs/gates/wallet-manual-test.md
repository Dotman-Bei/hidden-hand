# Wallet mode: manual wallet test (gates:29)

This checklist uses your wallet (any Solana wallet; the checklist was written with Phantom).

Run by hand on the **Vercel preview URL** from `gates:28` (the `WALLET-PREVIEW:` line in `docs/gates/2026-11-26-gate-ledger.md`). Production is not touched. Time box: 11:15–11:30Z. **GO/NO-GO at 11:30Z**: if the `MANUAL-TEST: PASS` line below is not filled in by then, wallet mode is dropped and `main` ships as is.

## Before you start (2 min)

- [ ] Chrome with Phantom installed and unlocked. Phantom → Settings → Developer Settings → **Testnet Mode ON**, Solana network **Devnet**.
- [ ] The Phantom account holds **≥ 0.2 devnet SOL** (faucet.solana.com). Note the balance: `start balance: ____ SOL`.
- [ ] Open the preview URL + `/app/` (log in to Vercel if it asks; preview protection).

## The round (about 4 min)

1. [ ] `/app/` opens in **wallet mode** (title "Play with your wallet"; **your wallet** is listed; the honest line about a random or idle human is visible).
2. [ ] Click **Phantom** → the Phantom connect popup → approve. The strip shows the short address, the balance and **"Popups signed: 0"**.
3. [ ] The panel shows **"Ready: X SOL for one round"** (X ≈ 0.11). *(Optional: with a near-empty second account, check that "Not enough devnet SOL" + "Get devnet SOL" appears instead.)*
4. [ ] **Open a table** → **popup 1** (transfer to 4 addresses) → approve. The counter shows 1. The state moves to "Opening a table…".
5. [ ] **Popup 2** (your seat, `join_table`, base devnet; Phantom simulates it cleanly) → approve. The counter shows 2.
6. [ ] **Popup 3** (sign a **message**, no fee) → approve. The counter shows 3. The state moves to "Seating the bots… dealing" (about 30 s).
7. [ ] Trading starts: the clock counts down from 1:30, your two cards are face up, and the hint reads **"Your hand is worth ±N contracts"**. The wallet strip shows the note about the expected wallet warning.
8. [ ] Pick a lot (1–5) and **Buy** or **Sell** toward the hint → **a popup per trade**. Write down what Phantom shows: `warning text: ______________________`. Approve **within a few seconds**.
9. [ ] The trade lands: your position changes on your seat, the price moves, and the trade prints on the tape. The counter goes up by 1 per trade.
10. [ ] Do 2–4 trades until your position equals the hint. *(Optional: open one popup, wait about 15 s, then approve. Note whether it lands or shows "That signature took too long… sign again": `slow sign: landed / expired`.)*
11. [ ] *(Optional: reject one trade popup → "You closed the popup. No trade was sent." → the next trade still works.)*
12. [ ] **Bell** at 0:00 → the hands flip face up → settled: the hidden sum, the close, the gap and the winner are shown.
13. [ ] "Paying the pot…" then "Sweeping…" then **"Swept N SOL back to your wallet"**. Phantom's balance is back within about 0.03 SOL of the start, or higher if you won: `end balance: ____ SOL`.
14. [ ] The on-chain record below the desk lists the table's base-layer transactions (explorer links open).

## Express mode still works (1 min)

15. [ ] Open the preview + `/app/?mode=express` → the old desk: "Start a round" + **"Copy the demo command"**.
16. [ ] The landing page `/` reads honestly (wallet mode + Express mode), and **Open the pit** goes to `/app/`.

## Result (the concierge fills this from what you report)

```
tested: 2026-11-27T11:07–11:11Z  wallet: Solflare (version not reported); OKX Wallet tried first  preview: https://hidden-hand-q9xuvteaa-heisbei-s-projects.vercel.app
table: EFyAUPnzcaWJe57ExcgERxQSqUu9AVY14k77qrdP8nuK  popups: 3 signed by Solflare (fund, join, sign-in) + 1 trade popup hard-blocked  trades landed: 0/1
wallet warning on trades: HARD BLOCK (Solflare, only a Close button): "Network mismatch. Your current network is set to devnet, but this transaction is for mainnet. Switch to the correct network before signing."
slow sign (~15 s): not tried
balance: 5.00 -> 4.97 SOL (as the app reads devnet)
notes: OKX Wallet blocked at popup 1 (funding transfer): its popup showed Network "Solana", a USD value ($5.66) and "Insufficient balance for network fee" with Confirm disabled, i.e. OKX priced it as Solana mainnet; rejected, nothing signed. Solflare on devnet: popups 1-3 (base-layer transfer, join_table, sign-in message) passed; the FIRST Rollup trade (Sell 5, 11:10:34Z, Private ER) was hard-blocked as "for mainnet" (likely the Rollup blockhash is not a devnet blockhash; hypothesis, unproven). The round still ran with the bots: bell, reveal, settle (hidden sum 54, close 66.00, gap 12.00, Seat 2 wins 0.04 SOL; your seat flat), "Swept 0.056 SOL back to your wallet". Label issues: "Popups signed" counts requests, not signatures (it reads 1 before popup 1 is approved), and it carried 1 over from the OKX session to Solflare (final 5 vs 4 popups shown). Phantom (the wallet the plan expects to warn but allow) is not installed/visible in this Chrome profile, so it was not tested. No app console errors; network: devnet RPC and devnet-tee all 200.
```

MANUAL-TEST: FAIL (steps 1-7, 12, 13 passed with Solflare; steps 8-9 failed: Solflare hard-blocks the Rollup trade popup as "for mainnet"; OKX is blocked at popup 1 on mainnet; Phantom untested)

## Phantom test (wallet-modal preview, 2026-11-28)

Preview `https://hidden-hand-eehw044ho-heisbei-s-projects.vercel.app/app/` (built from `39eb486`), wallet mode (no `?mode=`). The concierge drove only the web page in a new Chrome tab; the user approved every Phantom popup (the concierge never touched the wallet window; no key, seed or token was read or recorded). Production untouched.

```
tested: 2026-11-28T10:56–11:02Z  wallet: Phantom (version not reported), Testnet Mode, Solana Devnet  account: 2HS5…Hqbi
modal: Phantom listed with "Detected" (also MetaMask, OKX Wallet); compatibility line still reads "Phantom: not tested yet"
table: 6YjX8M…jjbE3K (round 1795863460043, Private ER)
popups (7 in Phantom, all approved, none rejected, no retries):
  1 connect                           10:56Z   approved  -> nav "2HS5…Hqbi 5.44 SOL", strip "Popups signed: 0"
  2 tx: fund house + 3 bots (54VtCL…)  10:57:40Z approved  -> counter 1
  3 tx: join_table, base devnet (5im33e…) 10:57:46Z approved -> counter 2
  4 sign message (Private ER sign-in) ~10:57:50Z approved -> counter 3, "Seating the bots… dealing"
  5 tx: trade Buy 2 (Private ER)      ~10:58:50Z approved -> landed "Seat 1 bought 2 at 78.00", counter 4
  6 tx: trade Buy 2 (Private ER)      ~10:59:10Z approved -> landed "Seat 1 bought 2 at 82.00", counter 5
  7 tx: trade Buy 1 (Private ER)      ~10:59:30Z approved -> landed "Seat 1 bought 1 at 83.00", counter 6
app counter: 6 = popups 2-7 (the connect popup is not counted, by design). While trade popup 5 was open the counter stayed at 3, so it now counts signatures, not requests (the gates:29 label issue is gone).
trades landed: 3/3 on the Private ER (TEE); hint +5, final position long 5. No "Network mismatch" block, no error text on the page.
Phantom's own popup text / warnings: not visible to the concierge; to be reported by the user.
reveal: bell, hands face up, settled: hidden sum 83, close 84.00, gap 1.00, Seat 2 wins 0.04 SOL; your seat long 5, +16.50
claim 5KMfs4… 10:59:53Z; sweep 4 txs 10:59:55–59Z (3jbEEe…, 5xv6Wy…, 2v8kVo…, 4JYco5…) = 0.055930488 SOL; page "Swept 0.056 SOL back to your wallet."
in-tab keys after the sweep (devnet RPC, confirmed): house 8cJd…C5UT 0, bots BVmy…a5Ux 0, B5Lh…pnFv 0, N5bv…Smgc 0
balance: 5.441681534 -> 5.408864990 SOL (net -0.032816544: fund -0.07762556, join -0.011121472, sweep +0.055930488; reconciles to the lamport)
left on chain: seat account 2Vug…GD8a 0.001037376 SOL (rent paid in the join tx), table 6YjX…bE3K 0.0134366 SOL (rent, house-paid)
console: no app errors; one exception from Vercel's preview feedback toolbar (vercel.live feedback.js "d.closest is not a function"), not the app
network: api.devnet.solana.com and devnet-tee.magicblock.app (token redacted) all 200 for the app; one 429 came from the concierge's own burst of verification reads
nav: short address + devnet SOL shown; Copy address -> "Address copied", clipboard holds the 44-char address; Disconnect -> nav "Connect wallet", panel back to Idle
footer button after connecting: still "Connect wallet" (known)
other: own trades on the tape have no "#N" number (bots: "#11 · 0:36", you: "0:36"); Disconnect after a round also clears the settled result, the "Swept" line and the on-chain record
```

PHANTOM-OK (full round on the Private ER: connect, fund, join, sign-in, 3 trades each signed in its own Phantom popup, reveal, sweep; no retries)
