# Gate ledger — Hidden Hand (Solana Blitz V10)

One ledger per campaign: later passes extend this file and never fork it. It records names and public identifiers only (no keys, no `.env` values).

## Session record

| Pass | Started (UTC) | Seat model | Card |
|---|---|---|---|
| preflight | 2026-11-26T20:06Z | `claude-opus-5-5` (top tier; effort high) | Row 5 (claude-in-chrome) **PASS**: `tabs_context_mcp` returned a tab group, `navigate` and `get_page_text` worked. Row 15 (env store) **PASS**: `setx TOLLGATE_PROBE` → `reg query` showed REG_SZ 1 → `reg delete` succeeded. Rows 6, 7 and 8 are not granted (computer-use, inbox and wallet extension are struck). |
| demo-studio (Step 2.5) | 2026-11-27T06:56Z | `claude-sonnet-5-5` (standard tier; effort high per the kickoff) | Browser-only path (computer-use not granted). Card in `docs/tollgate/2026-11-26-tollgate.md` §6: CLEAR. |

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
- **Status:** **deployed and verified on-chain 2026-11-26T20:15Z. The plan's gate command FAILS on a gate-script bug → BLOCKED until the orchestrator/architect fixes `wsl-deploy.sh check`.**
  - Pre-checks: WSL `solana-cli 3.1.9`; the script was read before running (it prints only the program ID and signature; the burner goes to a 0600 temp file, removed by trap; afterwards `/root/.config/hidden-hand/` holds only `program-keypair.json`).
  - Deploy: `HH-DEPLOY: PASS HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb`. Deploy signature `52uTwHf4i3WxiNGSEtFF4T4qJxiRHH4eCAANNBSd868W5bqfWURFK8ZRe1ZM87hrbh9dL4goqnBggZd1TRc6ZuRQ` (`solana confirm` → Finalized). Program ID matches `Anchor.toml` `[programs.devnet]`. `docs/proof/deploy-log.md` was created with that row and left **uncommitted** for the orchestrator's gates:13 commit.
  - On-chain read (signer-free `solana account`, plus `solana program show … --keypair <program keypair path>`): executable, owner `BPFLoaderUpgradeab1e…`, ProgramData `3LfCphCBjAkQDKLDMT7o3xW91H3y38gDfcLpqzixkvT9`, **Authority = burner** `BT9T…ks1Bs`, slot 526625169, data length 415,648 bytes, ProgramData rent 2.11237068 SOL. Burner balance after: 17.8847212 SOL.
  - **Gate bug:** `wsl-deploy.sh check` prints `HH-DEPLOY: FAIL (… is not deployed on devnet)` although the program is deployed. `solana program show` (CLI 3.1.9) exits non-zero with `No default signer found` because WSL has no `~/.config/solana/id.json`, and the script hides stderr with `>/dev/null 2>&1`. **Fix (product code; the concierge does not edit it):** in the `check` branch use `solana account "${PROGRAM_ID}" --url "${RPC}"`, or add `--keypair "${KEY}"` to `solana program show`. Both are read-only and verified to work above. Gates 15/16 use the same check.
  - **REDEPLOY (upgrade) 2026-11-26T20:43Z, on your consent, HEAD `3c56b76`: DONE.** Pull `--no-autostash` was clean; WSL `solana-cli 3.1.9`. `wsl-deploy.sh deploy` → `HH-DEPLOY: PASS HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb`; upgrade signature `1wwnYePEYGAwZV6u7AFDV8iizVmcLULbE4nUMc4CkqN8mLK9XURdAHuVuKgop9mh9uHxtY1sZH9qXVNg32B1NNM` (`solana confirm` → Finalized). Last deployed slot 526625169 → **526632181**; authority still the burner; data length 415,648. No stack-offset warning in this build. **Plan gate (fixed check, `d5aa604`): `HH-DEPLOY: PASS`.** The deploy-log row was appended and left uncommitted for the orchestrator. The temp burner file was removed.
  - **Build warning (first deploy only), for the architect (not a gate failure):** `cargo build-sbf` reported `RevealHands … try_accounts … Stack offset of 4784 exceeded max offset of 4096 by 688 bytes … may cause undefined behavior during execution`. The reveal instruction can fail at runtime (spike check / gates:15 round). Likely fix: `Box<Account<…>>` the large accounts in `RevealHands`.

### gates:14 — Spike run (TEE path vs fallback)
- **Tier:** A (signs with the burner and burner-derived seat keys). **Pass:** early.
- **Waits on:** gates:13, client:2.
- **Tools:** PowerShell.
  1. `pnpm --filter @hidden-hand/client spike` (~2–3 min; writes `docs/spike/spike-result.md`)
  2. Gate: `$t = Get-Content docs/spike/spike-result.md -Raw -Encoding UTF8; if ($t -match '(?m)^\(a\) (PASS|FAIL)' -and $t -match '(?m)^\(b\) (PASS|FAIL)' -and $t -match '(?m)^\(c\) (PASS|FAIL)') { 'SPIKE-RECORDED' } else { 'SPIKE-MISSING' }` → `SPIKE-RECORDED`
- **Human moment (a decision, not a tier):** at the orchestrator's spike pause you pick the path by the rule: (a)(b)(c) all PASS → keep `manifest.json`; otherwise the fallback **merge**. One re-run is allowed inside the window (deadline 22:57:25Z).
- **Status:** **run 1 done 2026-11-26T20:20Z: gate `SPIKE-RECORDED`; result (a) FAIL (b) FAIL (c) FAIL (f) FAIL.** Run on your instruction against the deployed program as-is (no redeploy). `docs/spike/spike-result.md` was left uncommitted for the orchestrator. Burner after: 17.665 SOL.
  - **(a)(b)(c): all failed in setup, before any deal**, with `setup failed: permission not active: 8zszdJe9Ecvzi6HFiih52QVYh3Z97FjbuFJ8Axvrg9fy` (hand 0's PDA). The permission-creation transaction did not throw. The readiness poll did: `TeeDealAdapter.afterDelegate` → SDK 0.18.0 `waitUntilPermissionActive(TEE_RPC, …)` → `GET https://devnet-tee.magicblock.app/permission?pubkey=…` → **HTTP 404** ×42 ("Failed to get permission status: … Not Found"). A direct probe returns `{"error":"Not found: GET /permission"}` for any pubkey, and `GET /` also 404s. The poll hits a route the TEE host does not serve **without an auth token**. The SDK appends `?token=` when the URL carries one; the adapter passes the bare `TEE_RPC`. Likely a client wiring bug (pass the authenticated TEE URL), **not evidence that the Private ER is unavailable**. Unverified hypothesis: confirm against the SDK docs.
  - **(c) vs the RevealHands stack bug: not exercised.** The reveal was never reached, so this run cannot tell the stack-offset warning from a real reveal failure.
  - **(f) (informational, fallback path on devnet-as): FAIL, a program bug.** `table HCcibHGcJ4rrhsUAw6AiyZmRBvrHy8V3Bsv1WMSazTwn did not reach phase trading (last: dealing)`. The VRF oracle invoked our callback repeatedly (≥ 10 ER txs). Each `CallbackDeal` **ran out of compute**: e.g. `4KmorWH9DMt5cfQCeCd65UUT8f5btf6YyPn8ooqWuApKQpagrQmFk6R6LZyfaQ7QoArbvmJxHWubqkHHuYCBVCuN` logs `Program HZdoTuj1… consumed 271371 of 271371 compute units … failed: Program failed to complete` (the VRF program's own budget was 300k). The deal callback is too expensive or does not terminate (e.g. an unbounded draw loop). The TEE path's (b) would hit the same callback.
  - **RUN 2 = the formal re-run (the one the rule allows), 2026-11-26T20:44:07Z → 20:46:16Z, on your consent, against the upgraded program (HEAD `3c56b76`, client `13b7aea`). Gate: `SPIKE-RECORDED`.**
    - `(a) FAIL — TEE auth-token read of a permissioned account (owner reads, stranger cannot): owner read returned null`
    - `(b) PASS — VRF request + callback served inside the TEE ER (DEFAULT_EPHEMERAL_QUEUE): callback_deal landed inside the TEE; phase = trading`
    - `(c) PASS — reveal of private state at settlement (reveal_hands flips every hand public): cards [9,13,3,1,5,10,1,13], hidden sum 55; hand 0 now public`
    - `(f) PASS — informational: VRF request + callback on devnet-as (the fallback path): VRF deal landed on devnet-as`
    - Script verdict line: `TEE path eligible: no — switch to manifest-fallback.json`. **No manifest merged by the concierge** (your decision).
    - Validators: tee and devnet-as both `4.2.2 / core=2.0.5, feature-set=565236538, git-commit=380360a`.
    - CU highlights (full list in `docs/spike/spike-result.md`): CallbackDeal 49,058 (TEE, of 260,473) / 49,058 (as, of 272,988); RevealHands 84,061 of 200,000; RequestDeal 90,515; create-permissions tx 152,302 total. The run-1 compute exhaustion and the stack issue are gone.
    - Noise: ~16 `429 Too Many Requests` retries from the public devnet RPC (auto-retried; no check failed on them).
    - **(a) diagnosis (read-only; no extra run):** setup's owner-readability poll (`waitUntilReadable`, which counts any non-empty program-owned account as readable) passed for all four hands *before* the deal. After the deal, `readOwnHand` (seat 0's own token connection, 20 s poll) never got a decodable hand with `dealt = true`. The cards were on the TEE (callback landed; the reveal shows hand 0 = public cards). Membership config matches MagicBlock's docs (`is_private: true`, member = seat owner, `AUTHORITY_FLAG | TX_LOGS_FLAG`; docs: "only members can read"). **Most likely the client/TEE auth path, not our program's deal/reveal logic:** the owner's token read is apparently served the blurred view (the pre-deal "readable" pass would be a false positive on blurred bytes). Not provable from this run's output, which does not record what the owner's `getAccountInfo` returned (null vs blurred bytes vs decoded `dealt=false`) or what a stranger saw. The diagnostic (client logging) is listed in the report to you.
    - Burner after: 17.595 SOL.
  - **DIAGNOSTIC round (run 3), 2026-11-26T21:36:07Z → 21:38:36Z, on your consent, one attempt.** Instrumented client HEAD `cf97d18`, against the deployment as-is (slot 526632181, build `3c56b76`; no redeploy). Gate: `SPIKE-RECORDED`. No `token=` string anywhere in the output (scanned). 19 public-RPC `429` retries (noise).
    - (a) FAIL `owner read returned null` · (b) PASS · (c) PASS `cards [10,2,13,13,9,4,6,2], hidden sum 59; hand 0 now public` · (f) PASS. Validators unchanged (4.2.2 / core=2.0.5, git-commit=380360a, tee and devnet-as).
    - Hand `CypBwFmwkeCCrjtZQ7FJYoiPjTw3xuo3aMWLkGAYx4an` (owner seat `12xYX44Lcaq1yJgnhn6LpXTNXz4Hnkpp8C9B53cRuij6`, table `6aSaKDLnm39KJZqCWbdYjqwgAvT52WR423ar4BRjXPuH`), permission `5Nm1R4dvMtChSJhvEDBEoB1Y3v4caBgevpFV9d7zqM3k`.
    - **Owner** (token issued for `12xY…uij6`; permission member found at byte 69, flags 0x03 AUTHORITY|TX_LOGS, i.e. token pubkey = member): pre-deal and all 29 post-deal polls (t+316…20624 ms, confirmed), plus processed and getMultipleAccounts: `lamports=1036320 owner=HZdo… len=76 head=33386598c4c768f252db84b42edd3d08 dealt=undecodable`, identical every time.
    - **Stranger / payer (non-member) / no-token:** `null`. Control: the public Table via the owner connection decodes (`phase=trading`, seat.hand == hand pda).
    - **Concierge offline checks:** head bytes 0–7 = the IDL `Hand` discriminator `33386598c4c768f2`; bytes 8–15 = the table pubkey's first 8 bytes (`52db84b42edd3d08`), so the header is plaintext. The `Hand` layout is identical in the deployed build and HEAD (`state.rs`; 8+32+32+1+2+1 = 76). The same IDL/coder decodes synthetic plaintext pre-deal and dealt hands fine and throws only on an invalid body (e.g. `Invalid bool: 2`).
    - **Answer: NO.** The owner does not read its dealt hand (never `dealt=true`; not even the pre-deal plaintext decodes). The stranger correctly reads nothing. Privacy against non-members works; member readability does not.
    - **Attribution:** not our program's permission config (member + flags verified); not a token/identity mismatch (verified); not the client decoder (offline test); not layout drift (verified). The owner is served a correctly sized, program-owned account with a plaintext header and an undecodable body. That points at the **TEE's member-read path**. Missing proof: the full 76-byte body and the decode error text of the owner's read (the script prints only 16 bytes and swallows the error).
    - Burner after: 17.526 SOL. `docs/spike/spike-result.md` left uncommitted for the orchestrator.
  - **DIAGNOSTIC #2 (run 4), 2026-11-27T02:33:09Z → 02:35:36Z, on your consent, one attempt,** against the gates:15 deployment (slot 526718687, HEAD `3df8305`, client `1c69458`). Gate: `SPIKE-RECORDED`. No `token=` in the output; 17 public-RPC 429 retries.
    - (a) FAIL `owner read returned null` · (b) PASS · (c) PASS `cards [7,8,5,8,15,11,3,10], hidden sum 67; hand 0 now public` · (f) PASS. Validators unchanged (4.2.2 / core=2.0.5).
    - Permission via owner: member found at byte 69, **flags=0x1f** (AUTHORITY|TX_LOGS|TX_BALANCES|TX_MESSAGE|ACCOUNT_SIGNATURES), so the TEE ran the new build. Stranger / payer / no-token reads: `null`.
    - **Owner hand full data (len=76):** `33386598c4c768f29adcd689d487a1b59445ac3e5b90ae7ad9d12c3d1dfa56e12896a90947e0ff380080624a8f71cb3b98e3dac8903cecebfadf481c6633b0cf7d97aea8eba4474d00070801`; decode error `Account not found: Hand`. Stranger hand full data: `null`.
    - **Concierge offline check:** bytes 8–40 = table `BRX6Z4cE…` ✓, bytes 40–72 = owner `12xYX44L…` ✓, then seat 0, cards [7,8], dealt 1. These match the revealed hand 0 = [7,8]. With `makeProgram(...)`: `coder.accounts.decode("Hand", b)` → `Account not found: Hand`; `decode("hand", b)` → `{"seat":0,"cards":[7,8],"dealt":true}`.
    - **Answer: YES.** The TEE serves the OWNER its dealt hand in plaintext while the STRANGER gets null. **(a)'s FAIL is a client bug:** `coder.accounts.decode("Hand", …)` must use the coder's camelCase name `"hand"` (in `readOwnHand` and the spike probe), or use `program.account.hand.coder`/`fetchNullable`. **Correction:** my run-3 attribution ("TEE member-read path") was wrong. My offline test there used the raw-IDL `BorshAccountsCoder` (name `"Hand"`) instead of the Program's coder, so it missed this. Run 3's owner head bytes are consistent with the same plaintext.
    - Burner after: 16.783 SOL (16.851 after gates:15).
  - **SPIKE run 5, 2026-11-27T02:53:38Z → 02:55:55Z, on your consent, right after the gates:15 retry (same deployment). Gate `SPIKE-RECORDED`. ALL PASS; `TEE path eligible: yes — keep manifest.json`.**
    - `(a) PASS — … owner read [5,2]; stranger got nothing (null)` · `(b) PASS — … callback_deal landed inside the TEE; phase = trading` · `(c) PASS — … cards [5,2,13,5,1,1,15,13], hidden sum 55; hand 0 now public` · `(f) PASS — … VRF deal landed on devnet-as`.
    - Owner: pre-deal `dealt=false`, first post-deal poll (t+324 ms) `dealt=true`, `owner hand decode: ok`, data ends `…00 05 02 01` (seat 0, cards [5,2], dealt). Stranger, payer and no-token reads: `null`. Member flags 0x1f.
    - CU (TEE): OpenTable 49,610 · JoinTable 56,333–56,351 · DelegatePda 40,475–50,975 · permissions tx 158,302 · RequestDeal 92,023 · CallbackDeal 49,058 · RevealHands 84,061. 18 RPC 429 retries (noise). No `token=` in any output.
    - Burner after: 16.642 SOL. `docs/spike/spike-result.md` left uncommitted for the orchestrator. No manifest touched.
  - **Decision input (run 1):** both paths are blocked by code bugs (TEE permission poll; `callback_deal` compute), not by MagicBlock infra, as far as this run shows. The fallback merge would not fix `callback_deal`. The spike rule allows one re-run before 22:57:25Z.

### gates:15 — Early full deploy + one real devnet round
- **Tier:** A. **Pass:** early (target ≤ 01:00Z, while you are awake).
- **Waits on:** program:4, bots:7, gates:14, program:1 (plus program:20 / client:21 if the fallback is merged).
- **Tools:** PowerShell / WSL.
  1. `wsl -d Ubuntu-24.04 -u root --exec bash -l program/scripts/wsl-deploy.sh deploy` → `HH-DEPLOY: PASS <program id>` (same ID; an upgrade)
  2. `pnpm --filter @hidden-hand/bots demo-round -- --demo --proof` (~2.5 min)
  3. Gate: `pnpm --filter @hidden-hand/bots check-proof` → last line `PROOF: PASS`
- **Evidence:** `docs/proof/deploy-log.md`, `docs/proof/devnet-round.md`. Any failure is a wiring bug, routed to the architect with the error text.
- **Risk:** the upgrade buffer needs about the program's rent again. Check the balance first (≥ 5 SOL).
- **Status:** **run 1 2026-11-27T02:29–02:31Z, on your consent: deploy DONE; round FAIL (`PROOF: FAIL (docs/proof/devnet-round.md missing)`).** Pull `--no-autostash` clean at HEAD `3df8305`; WSL `solana-cli 3.1.9`. The manifest was already the merged fallback DAG (21 tasks).
  - **Deploy (upgrade):** `HH-DEPLOY: PASS HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb`; sig `2pbjpPQFR2juuhrV3Th8gwKXe9iwoPKnVWbJMTVP3NWP5bpJhUeNm7VizZvJHNQ4bCkQiXi8y8GegH3F97VmNidK` (Finalized); last deployed slot **526718687**; data length 518,496 (was 415,648); authority = burner. No stack warning. Plan check: `HH-DEPLOY: PASS`. "gates:15 deploy DONE" printed 02:30Z. Deploy-log row left uncommitted for the orchestrator.
  - **Round:** `pnpm --filter @hidden-hand/bots demo-round -- --demo --proof` (default mode commit-reveal). Table `6cqziXH6dzuNgm97Tyc96Ti4G9gaXZXGJFJrwAK9G81S` opened (round 1795746666362), then `DEMO-ROUND: FAIL Transaction 248KCpVe4FNjsre5YFUMUXKqs4Vn5J9z2g213nD9KA97N1DsvVtGDC2juQKoFktKpzu8ZYoS3rKxnUMFHKbPDUnE … {"InstructionError":[0,{"Custom":6006}]}`. devnet-as logs: `Instruction: RequestDeal` / `AnchorError thrown in programs/hidden-hand/src/lib.rs:223. Error Code: ModeNotSupported. Error Number: 6006`.
  - **Cause: the devnet-as ER executed a STALE copy of our program.** At HEAD `3df8305`, `lib.rs:223` is `require!(table.phase == Phase::Open, HhError::WrongPhase)` and `request_deal` supports both modes. In the previously deployed build `3c56b76`, `lib.rs:223` is `DealMode::CommitReveal => return err!(HhError::ModeNotSupported)`. The WSL build copy matches HEAD, and the base layer has the new build (slot 526718687), so the ER had not re-cloned the upgraded program ~30 s after the upgrade. **Validator/ER-side (program cache), not our program or client.** The ERs don't expose ProgramData (`solana program show` on devnet-as / devnet-tee → "not an SBF program"), so the cached version can't be read directly. The TEE ER *did* run the new code 2 min later (diagnostic #2 below shows the new 0x1f permission flags). Remedy candidates (unverified): wait for the ER to refresh and retry; ask MagicBlock how ERs pick up program upgrades.
  - Base-layer rows, commit/undelegate parsing, CU lines, hidden sum, winner: **none**. The round stopped at the deal, and no proof file was written. Burner after: 16.851 SOL.
  - **RETRY 2026-11-27T02:50:49Z → 02:52:54Z, on your consent, no redeploy (slot 526718687), HEAD with `00a9765`, TEE default mode: DONE. Gate `PROOF: PASS`.** Pull `--no-autostash` clean; WSL `solana-cli 3.1.9`.
    - Runner: `table 37YgBHKVwFbpntjJBAKhihaPC2kAyVjUjxmHx4Krnj55 open` (round 1795747852081) → `dealt; trading until 02:52:43Z` → `bell` → `hidden sum 65, close 64.00, winner seat 2` → `wrote docs/proof/devnet-round.md` → **`DEMO-ROUND: DONE hidden sum 65, close 64.00`**. No request_deal retry lines (the ER had refreshed), 0 RPC 429s, no SDK commit/undelegate parsing error on the 2.0.5 validators.
    - Proof `docs/proof/devnet-round.md` (deal mode tee; ER devnet-tee, validator `MTEWGu…`), left uncommitted for the orchestrator. Base-layer rows: open_table `52S2ya4U…`, join_table ×4, delegate_pda table `5VMXnwHm…` + hands ×4, **commit/undelegate (validator) `4FoLve7c…`**, **claim_pot `58yHnRX2…`**. ER rows: permissions, request_deal, 12 trades, reveal, settle_round. Concierge `solana confirm`: commit/undelegate, claim and table delegation all **Finalized**; the table account is owned by our program again on the base layer (undelegated).
    - Result: cards 13,1,11,4,11,10,5,10; hidden sum 65; close 64.00; winner seat 2 (`HoQN1wbD8T48fBfWywsJVW6rkrG8Cq4wchRz6AWq5qeb`), pot 0.040 SOL; P&L −3.50, −5.00, +10.50, −2.00.
    - **Form explorer link (base-layer delegation):** https://explorer.solana.com/tx/5VMXnwHmb2Huaujr8pHxwp2Ja4giDCGeR4TjKnrmkkYeC7wsrRSDVDsASaXrfmrtNegQSu1ZFPLT1b2hoFD5nUNj?cluster=devnet
    - The round runner prints no per-instruction CU; see the spike right after (same program).

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
| 2026-11-26T20:15Z | gates:13 | **On-chain deploy** of `hidden_hand` (burner = payer + upgrade authority) via `wsl-deploy.sh deploy` | sig `52uTwHf4…Tc6ZuRQ` Finalized; program `HZdoTuj1…miRFb`; burner 20 → 17.88 SOL |
| 2026-11-26T20:16Z | gates:13 | Plan gate `wsl-deploy.sh check` → FAIL (gate-script bug: `No default signer found`, stderr hidden); program verified deployed by signer-free reads | routed to the orchestrator/architect |
| 2026-11-26T20:20Z | gates:14 | **Spike run 1** (`pnpm --filter @hidden-hand/client spike`): devnet txs signed by the burner + derived seats (TEE table + devnet-as table, delegations, VRF request) | (a)(b)(c)(f) FAIL; `SPIKE-RECORDED`; burner 17.665 SOL |
| 2026-11-26T20:22Z | gates:14 | Read-only diagnosis: GET probes of `devnet-tee…/permission` (404), `solana confirm -v` of the (f) callback txs on devnet-as | causes recorded in gates:14 status |
| 2026-11-26T20:43Z | gates:13 | **On-chain upgrade** of `hidden_hand` (fixed build `3c56b76`) | sig `1wwnYePE…32B1NNM` Finalized; slot 526632181; check `HH-DEPLOY: PASS` |
| 2026-11-26T20:44Z | gates:14 | **Formal spike re-run** (run 2): devnet + TEE + devnet-as txs signed by the burner and derived seats | (a) FAIL (b) PASS (c) PASS (f) PASS; `SPIKE-RECORDED`; burner 17.595 SOL |
| 2026-11-26T21:36Z | gates:14 | **Diagnostic round** (run 3, one attempt): devnet + TEE + devnet-as txs signed by the burner and derived seats | (a) FAIL (b)(c)(f) PASS; owner gets an undecodable body, strangers get null; burner 17.526 SOL |
| 2026-11-27T02:30Z | gates:15 | **On-chain upgrade** (HEAD `3df8305`) | sig `2pbjpPQF…97VmNidK` Finalized; slot 526718687; check PASS |
| 2026-11-27T02:31Z | gates:15 | **Real devnet round** (`demo-round --demo --proof`, commit-reveal): open/join/delegate on base, `request_deal` on devnet-as | FAIL 6006 ModeNotSupported from a stale ER program copy; `PROOF: FAIL` (file missing) |
| 2026-11-27T02:33Z | gates:14 | **Diagnostic #2** (one attempt) | (a) FAIL (client decode name), (b)(c)(f) PASS; owner reads plaintext dealt hand, stranger null |
| 2026-11-27T02:50Z | gates:15 | **Real devnet round, retry** (TEE mode, `--demo --proof`): base open/join/delegate, ER deal/trades/reveal/settle, validator commit+undelegate, claim | `DEMO-ROUND: DONE hidden sum 65`; `PROOF: PASS`; winner seat 2, pot 0.040 SOL |
| 2026-11-27T02:53Z | gates:14 | **Spike run 5** | (a)(b)(c)(f) PASS; TEE path eligible: yes; burner 16.642 SOL |
| 2026-11-27T07:06Z | demo (2.5) | **Devnet round**, dry run before script approval, no video (`demo-round --demo --seat4 <browser seat>`, no `--proof`): the hidden browser seat traded | table `3ftesee54wbmTazQvMV4Vq6JkXo2f9Z3BNwzU6jA5qeS`; claim `41CDXMZF…tY9qw1`; sum 45, close 46.00 |
| 2026-11-27T07:18Z | demo (2.5) | **Devnet round, recorded** (take 1, same command, no `--proof`), after the user's recording consent | table `CqPKhLT3zscy7186HCCFFr3QsfQHyKYH3RRD8FoTbYPs`; delegation `3TWHZdKi1n7Pb9GAosVJ4jSv1Ht3v91LjAAfCmDzkYmmd8HqDxrH1dzUcgDjeYZHMzVCEq6dP4TKY9AzjQ5B57xx`; claim `4QGkbvtc6pnG47xFsTnsrTB7g7hxPYU4chaZRxUWAFbWFQMSNDw97WtnExE6Z6mfR542MEoNGTnGnnWLUftQAmvY`; sum 85, close 84.00; burner 16.481 SOL after |
| 2026-11-27T07:22Z | demo (2.5) | **Explorer consent prompt**: pressed Connect for the custom RPC `devnet-tee.magicblock.app` in a throwaway capture browser (no wallet, no logins), on the user's yes | no token in the link, the header or any file |
| 2026-11-27T07:41Z | demo (2.5) | Final cut rendered and QC'd locally; **nothing uploaded**. Upload waits for the user's watch, their consent and a public repo (gates:18) | file kept outside the repo |
