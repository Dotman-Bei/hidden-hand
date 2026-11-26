# Gate ledger — Hidden Hand (Solana Blitz V10)

One ledger per campaign: later passes extend this file and never fork it. It records names and public identifiers only (no keys, no `.env` values).

## Session record

| Pass | Started (UTC) | Seat model | Card |
|---|---|---|---|
| preflight | 2026-11-26T20:06Z | `claude-opus-5-5` (top tier; effort high) | Row 5 (claude-in-chrome) **PASS**: `tabs_context_mcp` returned a tab group, `navigate` and `get_page_text` worked. Row 15 (env store) **PASS**: `setx TOLLGATE_PROBE` → `reg query` showed REG_SZ 1 → `reg delete` succeeded. Rows 6, 7 and 8 are not granted (computer-use, inbox and wallet extension are struck). |

Repo state at preflight: `origin/main` = `9876dc4` (spike clock `Build started: 2026-11-26T19:57:25Z`, so the amended T+3 h spike deadline is **22:57:25Z**). program:1 is not committed yet: `.gitignore` is untracked in the orchestrator's working tree. It already ignores `.env` (`git check-ignore -q .env` → True), and `.env` does not exist. WSL `solana --version` = `solana-cli 3.1.9` (no drift). The fixed program keypair is **present** at `/root/.config/hidden-hand/program-keypair.json` (existence checked with `test -f` only; never read).

## Faucet route probe (read-only, 2026-11-26 ~20:00Z, no airdrop requested)

| Route | What was observed | Verdict |
|---|---|---|
| `solana --url devnet cluster-version` (WSL) | `4.5.0-beta.0`, slot 526622585: devnet RPC answers | RPC is fine for deploys and balance reads |
| `solana airdrop` on public devnet (the plan's CLI route) | Solana's own faucet guide (solana.com/developers/cookbook/development/airdrops-and-faucets, read live) says the public devnet and testnet endpoints **no longer serve airdrops**: `requestAirdrop` returns HTTP 410, and the CLI reports it as a rate limit. Not probed (there is no burner address yet). | **Dead per docs.** At most one confirming attempt at gates:12; don't plan on it |
| **devnetfaucet.org** (@ferric) | "Get 20 devnet SOL airdropped to your wallet". Address field plus "Airdrop with GitHub" (OAuth). The "Make airdrop anonymous" box only hides the GitHub name in the public list. Faucet balance 28,532 SOL; last payout 7 minutes before the probe. No CAPTCHA or agent policy visible before the OAuth step. | **PRIMARY.** One claim covers the 10 SOL target. Tier A (GitHub OAuth on the logged-in Chrome session, authorized for faucets) |
| faucet.solana.com (Solana Foundation) | Address + Amount (0.5 / 1 / 2.5 / 5) + Confirm; "Maximum of 2 requests every 8 hours" (2 × 5 = 10 SOL without sign-in); GitHub sign-in unlocks a higher limit. Its "I am an AI Agent" panel says **AI agents should not use this faucet**; it points to the CLI airdrop (dead, above), the `devnet-pow` miner, or a local validator. | **FALLBACK 1, user-operated.** The provider's policy excludes agents, so the concierge won't drive it. Human moment: paste the burner's public key, pick 5, Confirm, twice (~1 min) |
| `devnet-pow` miner (`cargo install devnet-pow`; `devnet-pow mine -d 3 --reward 0.02 --no-infer -t 5000000000`) | Agent-endorsed by faucet.solana.com. 0.02 SOL per reward, so reaching 5 SOL is slow; not installed or probed | **FALLBACK 2, slow.** Use only to top up a few tenths of a SOL |
| QuickNode / Helius / Triton RPC faucets, Pine Stake, 76 Devs Discord `!gibsol` | QuickNode's domain is blocked by this Chrome extension's site permissions. RPC-provider faucets need a provider account or API key (no signup authorized). No Discord access granted. | **Not available** without a new grant |

**Funding plan:** devnetfaucet.org, a single 20-SOL claim to the burner. If it fails, faucet.solana.com 2 × 5 SOL (your click). Budget: the first deploy takes ~3–4 SOL of rent, each upgrade (gates:15, gates:16) temporarily needs a buffer of the same size, and each round costs < 0.5 SOL. A 20-SOL drip also covers a fallback re-deploy.

## Gates

Commands are verbatim from `docs/superpowers/plans/2026-11-26-gates.md` (PowerShell, repo root). The orchestrator re-runs each gate's read-only check and makes the commit; the concierge commits only this ledger and evidence files.

### gates:11 — Burner wallet into the cross-session store
- **Tier:** A (the WSL CLI creates the key; only the public key is printed). **Pass:** preflight.
- **Waits on:** program:1 committed. The orchestrator prints `WAITING ON USER: gates:11`.
- **Tools:** PowerShell → WSL `solana-keygen`.
  1. `git check-ignore -q .env; $?` → must print `True`, abort otherwise.
  2. `wsl -d Ubuntu-24.04 -u root --exec bash -lc 'F=/root/.config/hidden-hand/burner-new.json; mkdir -p /root/.config/hidden-hand; solana-keygen new --no-bip39-passphrase --silent --outfile "$F" && printf "HH_BURNER_KEYPAIR_JSON=%s\n" "$(tr -d " \n\r" < "$F")" >> .env && solana-keygen pubkey "$F"; rm -f "$F"'`
  3. Gate: `git check-ignore -q .env; if ($?) { node -e "const fs=require('fs');const m=fs.existsSync('.env')&&fs.readFileSync('.env','utf8').match(/^HH_BURNER_KEYPAIR_JSON=(.+)$/m);let ok=false;try{const a=JSON.parse(m[1].trim());ok=Array.isArray(a)&&a.length===64}catch(e){}console.log(ok?'BURNER-PRESENT: PASS':'BURNER-PRESENT: FAIL')" } else { 'BURNER-PRESENT: FAIL (.env is not git-ignored)' }` → `BURNER-PRESENT: PASS`
- **Storage:** `HH_BURNER_KEYPAIR_JSON` in the git-ignored repo-root `.env` only (no `setx`, per the plan).
- **Risk:** ~zero (devnet-only disposable key). Never `cat`/print `.env`; never write `.env` from PowerShell.
- **Status:** **done 2026-11-26T20:09Z** (your "run gates:11").
  - **Burner public key:** `BT9TYK3HL5Bc7rZfTNrPiGkjGXDKeDpdEPgWBqAks1Bs` (devnet only).
  - **Stored:** env-var name `HH_BURNER_KEYPAIR_JSON`, location: repo-root `.env`. Git-ignored (`git status --ignored` → `!! .env`); one LF line, no BOM. No user env var set. The temp keyfile `burner-new.json` was deleted (the WSL dir holds only `program-keypair.json`).
  - **Gate:** `BURNER-PRESENT: PASS`.
  - **Ordering note:** started before the orchestrator's WAITING signal. The plan's precondition (`git check-ignore -q .env` → True) held because program:1's `.gitignore` was in the working tree, and program:1 was committed during the gate (`3cd1f97`).
  - **Plan defect (for the orchestrator/guide):** the plan's Step 1 command fails **verbatim** in PowerShell 5.1 (`bash: unexpected EOF while looking for matching ')'`). PS 5.1 removes the embedded `"` when passing the argument to `wsl.exe`. The failed attempt wrote nothing (checked: no `.env`, no temp file). It ran with every inner `"` escaped as `\"`, which gives bash the identical script. Any other plan command that embeds `"` inside a `wsl … bash -lc '…'` argument has the same problem.

### gates:12 — Devnet SOL for the burner (target ~10, minimum 5)
- **Tier:** A on the primary route; fallback 1 is a user click (see the faucet probe). **Pass:** preflight.
- **Waits on:** gates:11 and client:2 (the balance script).
- **Tools:** `claude-in-chrome` on devnetfaucet.org (burner **public** key + "Airdrop with GitHub" OAuth, logged in this ledger), then:
  - Gate: `pnpm --filter @hidden-hand/client balance -- --min 5` → last line `BURNER-BALANCE: PASS`
  - After the gate: write the kit's `references/faucets/solana-devnet.md` from the template (public facts only) and commit it locally in the kit, without pushing.
- **Human moment:** only if the fallback is needed (faucet.solana.com: paste the public key, 5 SOL, Confirm ×2).
- **Risk:** faucet outage or GitHub verification refusal → fall back. Devnet only.
- **Status:** **funded 2026-11-26T20:11Z, verified on-chain; the plan's gate command is waiting on client:2** (`client/scripts/burner-balance.ts` did not exist yet at 20:13Z, so `pnpm --filter @hidden-hand/client balance -- --min 5` cannot run).
  - **Route:** devnetfaucet.org, GitHub OAuth on the logged-in Chrome session (account Dotman-Bei; app "Devnet Faucet" by ferric; scopes `read:user`, `user:email`, read-only; **consent granted**). "Make airdrop anonymous" ticked (GitHub name kept off the public list). No CAPTCHA. Primary route worked first try; no fallback used.
  - **Evidence:** page said "Airdrop successful"; faucet balance 28,532.28 → 28,512.28. Read-only on-chain check (WSL): `solana balance BT9TYK3HL5Bc7rZfTNrPiGkjGXDKeDpdEPgWBqAks1Bs --url devnet` → **20 SOL**. `solana transaction-history` → 1 tx, `3XUB3EEgdA4z8Y8umv81nQF3B1xwt2WQ9GHR8w5LM8v91ACF7LxEcYxuG89rEj1nKSBGDMb8MCf5zAmvKGirZbuB`.
  - **Kit write-back:** `references/faucets/solana-devnet.md` committed locally in the kit (`21942e5`), not pushed.
  - **Agave drift seen:** at 20:12Z WSL reported `solana-cli 3.1.10` (it was 3.1.9 at 20:09Z; the parallel build session flipped it). Re-pinned with `agave-install init 3.1.9`; S2/S3/S7/S4 re-probed: 3.1.9 / 3.1.9 / 3.1.9 / anchor-cli 1.0.2.
  - **Gate run 20:15Z** (against client:2's script in the working tree, not yet committed): `BURNER BT9TYK3HL5Bc7rZfTNrPiGkjGXDKeDpdEPgWBqAks1Bs 20.000 SOL` / **`BURNER-BALANCE: PASS`**. **Status: done.** The orchestrator re-runs it after client:2 is committed.

### gates:13 — Spike deploy (first devnet deploy)
- **Tier:** A (burner is payer and upgrade authority). **Pass:** early (Step 2, before the spike window closes 22:57:25Z).
- **Waits on:** program:1, gates:12.
- **Tools:** PowerShell → WSL.
  1. `wsl -d Ubuntu-24.04 -u root --exec bash -l program/scripts/wsl-deploy.sh deploy` → `HH-DEPLOY: PASS <program id>`
  2. Gate: `wsl -d Ubuntu-24.04 -u root --exec bash -l program/scripts/wsl-deploy.sh check` → last line starts `HH-DEPLOY: PASS`
- **Evidence file:** `docs/proof/deploy-log.md` (the script appends the row; the orchestrator commits it).
- **Risk:** low. The fixed program keypair stays in WSL. Check `solana --version` = 3.1.9 before the run (no bare `anchor` outside `program/`).
- **Status:** pending.

### gates:14 — Spike run (TEE path vs fallback)
- **Tier:** A (signs with the burner and burner-derived seat keys). **Pass:** early.
- **Waits on:** gates:13, client:2.
- **Tools:** PowerShell.
  1. `pnpm --filter @hidden-hand/client spike` (~2–3 min; writes `docs/spike/spike-result.md`)
  2. Gate: `$t = Get-Content docs/spike/spike-result.md -Raw -Encoding UTF8; if ($t -match '(?m)^\(a\) (PASS|FAIL)' -and $t -match '(?m)^\(b\) (PASS|FAIL)' -and $t -match '(?m)^\(c\) (PASS|FAIL)') { 'SPIKE-RECORDED' } else { 'SPIKE-MISSING' }` → `SPIKE-RECORDED`
- **Human moment (a decision, not a tier):** at the orchestrator's spike pause you pick the path by the rule: (a)(b)(c) all PASS → keep `manifest.json`; otherwise the fallback **merge**. One re-run is allowed inside the window (deadline 22:57:25Z).
- **Status:** pending.

### gates:15 — Early full deploy + one real devnet round
- **Tier:** A. **Pass:** early (target ≤ 01:00Z, while you are awake).
- **Waits on:** program:4, bots:7, gates:14, program:1 (plus program:20 / client:21 if the fallback is merged).
- **Tools:** PowerShell / WSL.
  1. `wsl -d Ubuntu-24.04 -u root --exec bash -l program/scripts/wsl-deploy.sh deploy` → `HH-DEPLOY: PASS <program id>` (same ID; an upgrade)
  2. `pnpm --filter @hidden-hand/bots demo-round -- --demo --proof` (~2.5 min)
  3. Gate: `pnpm --filter @hidden-hand/bots check-proof` → last line `PROOF: PASS`
- **Evidence:** `docs/proof/deploy-log.md`, `docs/proof/devnet-round.md`. Any failure is a wiring bug, routed to the architect with the error text.
- **Risk:** the upgrade buffer needs about the program's rent again. Check the balance first (≥ 5 SOL).
- **Status:** pending.

### gates:16 — Final redeploy
- **Tier:** A. **Pass:** closing.
- **Waits on:** gates:15, web:9, docs:10, program:1.
- **Tools:** `wsl -d Ubuntu-24.04 -u root --exec bash -l program/scripts/wsl-deploy.sh deploy`; gate `wsl -d Ubuntu-24.04 -u root --exec bash -l program/scripts/wsl-deploy.sh check` → `HH-DEPLOY: PASS`.
- **Status:** pending.

### gates:17 — Closing devnet round + submission proof
- **Tier:** A. **Pass:** closing.
- **Waits on:** gates:16, bots:7.
- **Tools:** `pnpm --filter @hidden-hand/bots demo-round -- --demo --proof`; gate `pnpm --filter @hidden-hand/bots check-proof` → `PROOF: PASS`. The last line of `docs/proof/devnet-round.md` is the form's explorer link.
- **Status:** pending.

### gates:18 — Repo access for the judges
- **Tier:** A (`gh`, after `gh auth status` re-confirms Dotman-Bei). **Pass:** closing.
- **Waits on:** docs:10.
- **Human moment (a decision):** choose **public** (`gh repo edit Dotman-Bei/hidden-hand --visibility public --accept-visibility-change-consequences`) or **invite the reviewer** (`gh api -X PUT repos/Dotman-Bei/hidden-hand/collaborators/jonasXchen -f permission=pull`).
- Gate: `$p = gh api repos/Dotman-Bei/hidden-hand --jq .private; $c = @(gh api repos/Dotman-Bei/hidden-hand/collaborators --jq '.[].login') + @(gh api repos/Dotman-Bei/hidden-hand/invitations --jq '.[].invitee.login'); if ($p -eq 'false' -or ($c -contains 'jonasXchen')) { 'REPO-ACCESS: PASS' } else { 'REPO-ACCESS: FAIL' }` → `REPO-ACCESS: PASS`
- **Risk:** going public exposes history, so first confirm that no secret was ever committed (`.env` is ignored; grep history for `HH_BURNER`). The invite is the lower-exposure choice.
- **Status:** pending.

### gates:19 — Submission (build.magicblock.app, event 17)
- **Tier:** fill = A; **final Submit = its own consent (C if you want to press it)**; prize-wallet connect = **C**. **Pass:** closing. Internal submit-by **2026-11-27 12:00Z** (hard close 14:00Z).
- **Waits on:** gates:17, gates:18, and the demo-studio (Step 2.5) demo-video URL.
- **Tools:** edit `docs/gates/submission-draft.md` and `README.md` (resolve every `TBD-post-build:`); the orchestrator commits and pushes them; `claude-in-chrome` on https://build.magicblock.app/?stage=blitz#submit after re-reading the logged-in Telegram identity (hard stop on mismatch or logged-out); append `Submitted: <UTC ISO>` to the draft.
- Gate: `git fetch -q; git diff --quiet origin/main -- README.md; $pushed = ($LASTEXITCODE -eq 0); if ($pushed -and -not (Select-String -Path docs/gates/submission-draft.md,README.md -SimpleMatch 'TBD-post-build' -Quiet) -and (Select-String -Path docs/gates/submission-draft.md -Pattern '^Submitted: 20\d\d-\d\d-\d\dT\d\d:\d\d' -Quiet)) { 'SUBMISSION: PASS' } else { 'SUBMISSION: FAIL' }` → `SUBMISSION: PASS`
- **Human moments:** (1) Telegram sign-in if the session is logged out; (2) type the personal fields (first/last name, email, country), your X handle and the team Telegram handles (never stored in the repo); (3) **connect your real prize wallet** (your wallet extension and your approval; the concierge never touches it); (4) press Submit, or green-light it separately.
- **Status:** pending.

## Implicit gates

| Id | Gate | Tier | Pass | Notes / status |
|---|---|---|---|---|
| imp-faucet | Faucet route (feeds gates:12) | A / user-click fallback | preflight | **Probed** (table above). Primary devnetfaucet.org; fallback faucet.solana.com (user-operated). Kit write-back `references/faucets/solana-devnet.md` after gates:12. |
| imp-progkey | Fixed program keypair `/root/.config/hidden-hand/program-keypair.json` (WSL ext4, outside the repo) | A | preflight | **Present.** Losing it means a new program ID after the first deploy. No action proposed; it is never printed or copied. Say so if you want an offline backup decision. |
| imp-spike | Spike path decision (keep `manifest.json` vs fallback merge) | your decision | early | At the orchestrator's pause after gates:14; deadline 22:57:25Z. |
| imp-repo | Repo-public / invite flip | = gates:18 | closing | — |
| imp-form | Submission form fill + Submit | = gates:19 | closing | Fill and Submit are two consents. |
| imp-tg-wallet | Telegram sign-in + prize wallet connect | B (sign-in if logged out) / C (wallet) | closing | Your real wallet; not this session's grant. |
| imp-video | Demo video URL ("Pitch & Demo") | — (demo-studio, Step 2.5) | closing | Dependency for gates:19, not a concierge gate. |

## Recommended order

gates:11 (on `WAITING ON USER: gates:11`) → gates:12 (once client:2 lands) → gates:13 → gates:14 → your spike decision by 22:57Z → gates:15 when program:4 + bots:7 are green (≤ 01:00Z) → closing pass: gates:16 → gates:17 → gates:18 → demo video (2.5) → gates:19 by 12:00Z.

## Action log

Every OAuth, CAPTCHA, faucet request and on-chain action is logged here.

| UTC | Gate | Action | Evidence |
|---|---|---|---|
| 2026-11-26T20:00Z | imp-faucet | Read-only probe: faucet.solana.com, the Solana devnet SOL guide, devnetfaucet.org (pages read; no address entered, no claim, no sign-in); WSL `solana --url devnet cluster-version`. QuickNode blocked by the extension's site permissions. | Table above |
| 2026-11-26T20:09Z | gates:11 | Burner created with WSL `solana-keygen` (plan command, inner quotes escaped for PS 5.1) → `.env`; gate run | pubkey `BT9TYK3HL5Bc7rZfTNrPiGkjGXDKeDpdEPgWBqAks1Bs`; `BURNER-PRESENT: PASS` |
| 2026-11-26T20:10Z | gates:12 | **OAuth consent** on github.com: "Devnet Faucet" by ferric, account Dotman-Bei, scopes `read:user` `user:email` (read-only). No CAPTCHA. | consent screen read before approving |
| 2026-11-26T20:11Z | gates:12 | **Faucet request**: devnetfaucet.org, 20 SOL, anonymous listing | "Airdrop successful"; tx `3XUB3EEg…irZbuB`; balance 20 SOL |
| 2026-11-26T20:12Z | gates:12 | WSL Agave drift 3.1.10 → re-pinned `agave-install init 3.1.9` | S2/S3/S7/S4 PASS after re-pin |
