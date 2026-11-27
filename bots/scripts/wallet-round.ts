import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Connection, PublicKey } from "@solana/web3.js";
import {
  type Side, type WalletSigner, baseConnection, connectStandard, countingSigner, isBlockhashExpired, mockStandardWallet, readHandAs, standardSigner, tradeWith,
} from "@hidden-hand/client";
import { handEdge } from "@hidden-hand/client/engine";
import { REPO_ROOT, loadBurner } from "@hidden-hand/client/node";
import { liveHouseIo, memoryVault, runWalletRound, walletRoundBudget, type WalletRoundEvent } from "../src/house";
import { DEMO_SEED } from "../src/policy";
import { checkWalletProof, formatWalletProof, type WalletProofExtra } from "../src/wallet-proof";

const argv = process.argv.slice(2);
const has = (f: string) => argv.includes(f);
const val = (f: string) => {
  const i = argv.indexOf(f);
  return i >= 0 ? argv[i + 1] : undefined;
};
const log = (m: string) => console.log(`[wallet-round ${new Date().toISOString()}] ${m}`);
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const short = (e: unknown) => (e instanceof Error ? e.message : String(e)).replace(/\s+/g, " ").slice(0, 160);

async function dry(): Promise<void> {
  const b = walletRoundBudget({ tableRent: 10_000_000, handRent: 1_500_000 });
  log(`dry: budget house ${b.house}, bot ${b.bot} x3, wallet ${b.wallet}, total ${b.total} lamports (sample rents)`);
  log("dry: popups fund -> join -> sign-in -> trades; house: open, bot joins, delegate x5, permissions, deal, reveal, settle, claim, sweep");
  console.log("WALLET-ROUND: DRY OK");
}

/** A human who follows the hint: hold handEdge(hand) contracts, lots of at most 5, one popup per trade. */
async function human(er: Connection, signer: WalletSigner, slow: WalletSigner, table: PublicKey, endMs: number, x: WalletProofExtra, delayMs: number): Promise<void> {
  const hand = await readHandAs(er, table, signer.publicKey, 30_000);
  if (!hand) throw new Error("the wallet could not read its own hand through its TEE connection");
  const hint = handEdge(hand);
  // a zero hint still exercises the delayed signature: go long 1, then back to flat below
  const target = hint === 0 ? 1 : hint;
  log(`wallet hand ${hand[0]} + ${hand[1]}: hint ${hint > 0 ? "+" : ""}${hint} contracts`);
  let pos = 0;
  let first = true;
  while (Date.now() < endMs - 4000 && pos !== target) {
    const side: Side = target > pos ? "buy" : "sell";
    const qty = Math.min(5, Math.abs(target - pos));
    try {
      const sig = await tradeWith(er, first ? slow : signer, table, side, qty);
      if (first) x.delayedSign = { delayMs, landed: true, error: null };
      x.walletTrades.push(sig);
      pos += side === "buy" ? qty : -qty;
    } catch (e) {
      if (!first) throw e;
      x.delayedSign = { delayMs, landed: false, error: short(e) };
      log(`delayed signature failed (${isBlockhashExpired(e) ? "blockhash expired" : "other"}): ${short(e)}`);
    }
    first = false;
    await sleep(2500);
  }
  if (hint === 0 && pos !== 0 && Date.now() < endMs - 4000) {
    x.walletTrades.push(await tradeWith(er, signer, table, pos > 0 ? "sell" : "buy", Math.abs(pos)));
  }
}

async function live(): Promise<void> {
  const delayMs = Number(val("--sign-delay-ms") ?? 8000);
  const burner = loadBurner();
  const base = baseConnection();
  const popups = { fund: 0, join: 0, signIn: 0, trades: 0, total: 0 };
  let stage: "fund" | "join" | "signIn" | "trades" = "fund";
  const wallet = mockStandardWallet(burner, { name: "Mock Wallet (burner)" });
  const raw = standardSigner(wallet, await connectStandard(wallet));
  const signer = countingSigner(raw, () => {
    popups[stage] += 1;
    popups.total += 1;
  });
  const slow: WalletSigner = {
    publicKey: signer.publicKey,
    signMessage: (m) => signer.signMessage(m),
    signTransaction: async (tx) => {
      await sleep(delayMs);
      return signer.signTransaction(tx);
    },
  };
  const x: WalletProofExtra = {
    wallet: signer.publicKey.toBase58(), popups, walletTrades: [], delayedSign: { delayMs, landed: false, error: "not attempted" },
    budgetLamports: 0, spentLamports: 0, sweptLamports: 0,
  };
  const before = await base.getBalance(signer.publicKey, "confirmed");
  const run: { human: Promise<void> | null } = { human: null };
  const onEvent = (e: WalletRoundEvent) => {
    if (e.phase === "funding") stage = "fund";
    if (e.phase === "joining") stage = "join";
    if (e.phase === "signing-in") stage = "signIn";
    if (e.phase === "trading" && run.human === null && e.walletEr && e.table && e.view) {
      stage = "trades";
      run.human = human(e.walletEr, signer, slow, e.table, e.view.endTs * 1000, x, delayMs);
    }
    if (e.phase !== "trading") log(`phase ${e.phase}${e.error ? `: ${e.error}` : ""}`);
  };
  const r = await runWalletRound(liveHouseIo(log), signer, memoryVault(), { durationSecs: Number(val("--duration") ?? 90), seed: DEMO_SEED, onEvent });
  if (run.human) await run.human;
  const after = await base.getBalance(signer.publicKey, "confirmed");
  x.budgetLamports = r.budget.total;
  x.sweptLamports = r.sweptLamports;
  x.spentLamports = before - after;
  const text = formatWalletProof(r.proof, x);
  const check = checkWalletProof(text);
  if (has("--proof")) {
    mkdirSync(resolve(REPO_ROOT, "docs/proof"), { recursive: true });
    writeFileSync(resolve(REPO_ROOT, "docs/proof/wallet-round.md"), text, "utf8");
    log("wrote docs/proof/wallet-round.md");
  }
  if (!check.ok) throw new Error(`proof incomplete: ${check.missing.join(", ")}`);
  console.log(
    `WALLET-ROUND: DONE table ${r.proof.table}, hidden sum ${r.proof.result.hiddenSum}, close ${(r.proof.result.closeC / 100).toFixed(2)}, ` +
      `popups ${popups.total}, delayed sign ${x.delayedSign.landed ? "landed" : "failed"}, spent ${(x.spentLamports / 1e9).toFixed(4)} SOL`,
  );
}

(has("--dry") ? dry() : live()).catch((e) => {
  console.error(`WALLET-ROUND: FAIL ${short(e)}`);
  process.exitCode = 1;
});
