import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { type Keypair, LAMPORTS_PER_SOL, type PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { AS_RPC, AS_VALIDATOR, PROGRAM_ID, TEE_VALIDATOR } from "../src/config";
import { baseConnection, publicErConnection } from "../src/conn";
import { TeeDealAdapter } from "../src/deal/tee";
import type { DealContext } from "../src/deal/types";
import { deriveBotKeypair } from "../src/keys";
import { REPO_ROOT, loadBurner } from "../src/node";
import { handPda, tablePda } from "../src/pda";
import { makeProgram } from "../src/program";
import { delegatePdas, fetchTable, fundAccounts, joinTable, openTable, requestDeal, waitForPhase, waitUntilOnEr } from "../src/round-base";
import { type CheckResult, formatSpikeResult } from "../src/spike-report";

const SPIKE_DURATION_SECS = 30;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const errText = (e: unknown) => (e instanceof Error ? e.message : String(e)).replace(/\s+/g, " ").slice(0, 400);

async function seatTable(burner: Keypair, seats: Keypair[], roundId: BN, validator: PublicKey): Promise<PublicKey> {
  const base = makeProgram(baseConnection(), burner);
  const table = tablePda(roundId);
  await openTable(base, burner, roundId, "tee", SPIKE_DURATION_SECS, 0);
  await fundAccounts(base.provider.connection, burner, seats.map((s) => s.publicKey), 0.02 * LAMPORTS_PER_SOL);
  for (const s of seats) await joinTable(base, burner, s, table, new Uint8Array(32));
  await delegatePdas(base, burner, roundId, table, seats.map((s) => s.publicKey), validator);
  return table;
}

async function main(): Promise<void> {
  const burner = loadBurner();
  const seats = [0, 1, 2, 3].map((i) => deriveBotKeypair(burner, 100 + i));
  const stranger = deriveBotKeypair(burner, 199);
  const tee = new TeeDealAdapter();
  const results: CheckResult[] = [];
  const roundId = new BN(Date.now());
  let ctx: DealContext | null = null;

  try {
    const table = await seatTable(burner, seats, roundId, TEE_VALIDATOR);
    ctx = { roundId, table, seatOwners: seats.map((s) => s.publicKey), payer: burner };
    await tee.afterDelegate(ctx);
  } catch (e) {
    const d = `setup failed: ${errText(e)}`;
    results.push({ id: "a", pass: false, detail: d }, { id: "b", pass: false, detail: d }, { id: "c", pass: false, detail: d });
    ctx = null;
  }

  if (ctx) {
    const er = makeProgram(await tee.erConnection(burner), burner);
    let dealt = false;
    try {
      await requestDeal(er, burner, ctx.table, 7);
      await waitForPhase(er, ctx.table, "trading", 45_000);
      dealt = true;
      results.push({ id: "b", pass: true, detail: "callback_deal landed inside the TEE; phase = trading" });
    } catch (e) {
      results.push({ id: "b", pass: false, detail: errText(e) });
    }

    let own: [number, number] | null = null;
    if (dealt) {
      try {
        own = await tee.readOwnHand(ctx, seats[0]);
        if (!own || own.some((c) => c < 1 || c > 15)) throw new Error(`owner read returned ${JSON.stringify(own)}`);
        let saw = "nothing (null)";
        try {
          const sp = makeProgram(await tee.erConnection(stranger), stranger);
          const h = await sp.account.hand.fetchNullable(handPda(ctx.table, seats[0].publicKey));
          if (h && h.dealt && h.cards[0] === own[0] && h.cards[1] === own[1]) saw = "the sealed cards";
          else if (h) saw = "a blurred account";
        } catch (e) {
          saw = `an error (${errText(e).slice(0, 80)})`;
        }
        if (saw === "the sealed cards") throw new Error("a non-member read the sealed hand");
        results.push({ id: "a", pass: true, detail: `owner read [${own.join(",")}]; stranger got ${saw}` });
      } catch (e) {
        results.push({ id: "a", pass: false, detail: errText(e) });
      }
    } else {
      results.push({ id: "a", pass: false, detail: "skipped: (b) did not deal" });
    }

    if (dealt) {
      try {
        const v = await fetchTable(er, ctx.table);
        if (!v) throw new Error("table unreadable on the TEE");
        const waitMs = v.endTs * 1000 - Date.now() + 2_000;
        if (waitMs > 0) await sleep(waitMs);
        await tee.reveal(ctx);
        const r = await waitForPhase(er, ctx.table, "revealed", 30_000);
        if (r.cards.some((c) => c < 1 || c > 15)) throw new Error(`revealed cards ${JSON.stringify(r.cards)}`);
        if (r.hiddenSum !== r.cards.reduce((a, b) => a + b, 0)) throw new Error("hidden_sum disagrees with the cards");
        const sp = makeProgram(await tee.erConnection(stranger), stranger);
        const h = await sp.account.hand.fetchNullable(handPda(ctx.table, seats[0].publicKey));
        if (!h || h.cards[0] !== r.cards[0] || h.cards[1] !== r.cards[1]) throw new Error("hand 0 is still unreadable to a non-member after the reveal");
        results.push({ id: "c", pass: true, detail: `cards [${r.cards.join(",")}], hidden sum ${r.hiddenSum}; hand 0 now public` });
      } catch (e) {
        results.push({ id: "c", pass: false, detail: errText(e) });
      }
    } else {
      results.push({ id: "c", pass: false, detail: "skipped: (b) did not deal" });
    }
  }

  try {
    const roundF = new BN(Date.now() + 1);
    const seatsF = [0, 1, 2, 3].map((i) => deriveBotKeypair(burner, 110 + i));
    const tableF = await seatTable(burner, seatsF, roundF, AS_VALIDATOR);
    const erF = makeProgram(publicErConnection(AS_RPC), burner);
    await waitUntilOnEr(erF.provider.connection, tableF, 30_000);
    await requestDeal(erF, burner, tableF, 9);
    await waitForPhase(erF, tableF, "trading", 45_000);
    results.push({ id: "f", pass: true, detail: "VRF deal landed on devnet-as" });
  } catch (e) {
    results.push({ id: "f", pass: false, detail: errText(e) });
  }

  const out = formatSpikeResult(new Date(), PROGRAM_ID.toBase58(), results);
  mkdirSync(resolve(REPO_ROOT, "docs/spike"), { recursive: true });
  writeFileSync(resolve(REPO_ROOT, "docs/spike/spike-result.md"), out, "utf8");
  console.log(out);
}

main().catch((e) => {
  const out = formatSpikeResult(new Date(), PROGRAM_ID.toBase58(), [{ id: "a", pass: false, detail: `spike crashed: ${errText(e)}` }]);
  mkdirSync(resolve(REPO_ROOT, "docs/spike"), { recursive: true });
  writeFileSync(resolve(REPO_ROOT, "docs/spike/spike-result.md"), out, "utf8");
  console.log(out);
});
