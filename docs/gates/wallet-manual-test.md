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
tested: <time UTC>  wallet: <name> <version>  preview: <url>
table: <address>  popups: <n>  trades landed: <n>/<n>
wallet warning on trades: <text or "none">
slow sign (~15 s): <landed | expired | not tried>
balance: <start> -> <end> SOL
notes: <anything odd>
```

MANUAL-TEST: <PASS|FAIL — write exactly `MANUAL-TEST: PASS` on its own line only when steps 1–9, 12, 13 and 15 passed>
