# Wallet mode: fix list (branch `wallet-mode`)

Items found around gates:28/29. **Copy only, no logic.** The orchestrator dispatches them, re-runs the taste gate, and commits; the gate-concierge does not edit product code. Line numbers are as of `origin/wallet-mode` `4941b27`.

**Wording rule (user, 2026-11-27):** never read as Phantom-only. In the app: "any Solana wallet (for example Phantom, Solflare, Backpack, OKX or MetaMask)". In the README and landing copy: "any Solana wallet that supports the Wallet Standard (Phantom, Solflare, Backpack...)" wherever Phantom alone or a short list is named. (Why: on the preview, this Chrome profile listed MetaMask, OKX Wallet and Solflare, and no Phantom.)

## FIX-1: WalletPanel copy (user)
- `web/src/app/wallet/WalletPanel.tsx:27`: "Connect a devnet wallet (Phantom, Solflare or Backpack). You hold one seat; three bots hold the others." → "Connect any Solana wallet (for example Phantom, Solflare, Backpack, OKX or MetaMask) on devnet. You hold one seat; three bots hold the others."
- `web/src/app/wallet/WalletPanel.tsx:47`: "No Solana wallet found in this browser. Install Phantom, Solflare or Backpack, switch it to devnet, and reload." → "No Solana wallet found in this browser. Install any Solana wallet (for example Phantom, Solflare, Backpack, OKX or MetaMask), switch it to devnet, and reload."
- Update any test or snapshot that asserts the old strings (copy change only).

## FIX-2: README (user)
- `README.md:20`: "seats you with your own devnet wallet (Phantom, Solflare or Backpack)" → "seats you with your own devnet wallet (any Solana wallet that supports the Wallet Standard: Phantom, Solflare, Backpack...)".
- `README.md:78` names the list only to say what the mock is *not*: "it is not a Phantom, Solflare or Backpack session." Keep that honesty and drop the short list: "it is not a session of a real browser wallet (Phantom, Solflare, Backpack or any other Wallet Standard wallet)."

## FIX-3: Landing and app page copy (user): check, likely no change
- `web/index.html:7` and `:96` and `web/app/index.html:7`/`:10` say "your own (devnet) wallet" and name no wallet or list, so the rule does not apply. Change only if the dispatcher finds a named wallet the grep missed.
- `web/src/app/wallet/discover.ts:1` is a code comment ("Phantom, Solflare, Backpack register themselves here"), not user-facing. Leave it, or generalise it to "any Wallet Standard wallet" at no cost.

## FIX-4: Manual test doc (user)
- `docs/gates/wallet-manual-test.md`: make the doc say **"your wallet (any Solana wallet; the checklist was written with Phantom)"**. Title "Wallet mode: manual Phantom test (gates:29)" → "Wallet mode: manual wallet test (gates:29)", plus one line under it with that sentence. Line 13 "**Phantom** is listed" → "**your wallet** is listed". Line 36 `wallet: Phantom <version>` → `wallet: <name> <version>`. Steps written with Phantom's wording (Testnet Mode, the connect popup) stay as they are under that note.

## FIX-5: Express-mode text above the desk (concierge, gates:28)
- `web/app/index.html:92` (the `/app/` hero lead) always reads "Connect a wallet and take the free seat. Rounds last 90 seconds on devnet, one wallet popup per trade.", including on `/app/?mode=express`, where no wallet is used. Copy fix: a lead that is true for both modes (e.g. "Take the free seat with any Solana wallet, or watch in Express mode with none. Rounds last 90 seconds on devnet."), or swap the lead by mode if that is already a one-line switch. No new logic beyond that.

## After the fixes
1. Re-run the taste gate on `/app/` and the landing page `/` (the frontend plan's gate: `docs/superpowers/plans/2026-11-26-frontend.md`, the `gate.mjs` / `copy-lint.mjs` / `consistency.mjs` / `shoot.mjs` sequence after `pnpm --filter @hidden-hand/web build`). Record PASS/FAIL.
2. The live preview (`WALLET-PREVIEW:` in the ledger, built from `975577b`) does **not** carry these fixes. Showing them needs a new preview deploy: a gates:28 re-run, with its own consent. The copy changes do not touch wallet behaviour, so the gates:29 Phantom test can run on the current preview.

| Item | Status |
|---|---|
| FIX-1 WalletPanel copy | done (exact strings) |
| FIX-2 README | done (exact strings) |
| FIX-3 landing/app pages | checked: no wallet named in web/index.html or web/app/index.html; discover.ts comment generalised |
| FIX-4 manual test doc | done (title, note line, step 1, result block) |
| FIX-5 Express hero lead | done: lead swaps by mode (inline script, same pattern as the page head); wallet lead shortened to keep hero-maxchars at 390 |
| Taste gate re-run (`/app/`, `/`) | PASS 10:32Z on cd476d5+: both pages `GATE: PASS`; section 5 checked on 390 px shots (wallet + Express); also On-chain record clipping fixed (cd476d5) |
