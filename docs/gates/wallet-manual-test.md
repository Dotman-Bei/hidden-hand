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
