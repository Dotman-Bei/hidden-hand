import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { type Connection, type Keypair, LAMPORTS_PER_SOL, type PublicKey } from "@solana/web3.js";
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
import { type CheckResult, type CuEntry, cuEntriesForTx, formatCuLines, formatSpikeResult, formatVersionLine } from "../src/spike-report";

const SPIKE_DURATION_SECS = 30;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const errText = (e: unknown) => (e instanceof Error ? e.message : String(e)).replace(/\s+/g, " ").slice(0, 400);

/** Every signature the spike sends or observes, with the connection that can fetch it (for the CU report). */
interface Tracked { label: string; sig: string; conn: Connection }

async function seatTable(burner: Keypair, seats: Keypair[], roundId: BN, validator: PublicKey, tag: string, track: Tracked[]): Promise<PublicKey> {
  const baseConn = baseConnection();
  const base = makeProgram(baseConn, burner);
  const table = tablePda(roundId);
  const t = (label: string, sig: string | null) => void (sig && track.push({ label: `${tag} ${label}`, sig, conn: baseConn }));
  t("open_table", await openTable(base, burner, roundId, "tee", SPIKE_DURATION_SECS, 0));
  t("fund seats", await fundAccounts(baseConn, burner, seats.map((s) => s.publicKey), 0.02 * LAMPORTS_PER_SOL));
  for (let i = 0; i < seats.length; i++) t(`join_table seat ${i}`, await joinTable(base, burner, seats[i], table, new Uint8Array(32)));
  const dsigs = await delegatePdas(base, burner, roundId, table, seats.map((s) => s.publicKey), validator);
  dsigs.forEach((sig, i) => t(i === 0 ? "delegate table" : `delegate hand ${i - 1}`, sig));
  return table;
}

/** The oracle's callback_deal tx on the ER: a signature for the table we did not send whose logs name CallbackDeal. */
async function trackOracleCallback(er: Connection, table: PublicKey, tag: string, track: Tracked[]): Promise<void> {
  const known = new Set(track.map((x) => x.sig));
  const list = await er.getSignaturesForAddress(table, { limit: 50 }, "confirmed");
  for (const s of list) {
    if (known.has(s.signature)) continue;
    const tx = await er.getTransaction(s.signature, { maxSupportedTransactionVersion: 0, commitment: "confirmed" }).catch(() => null);
    const logs = tx?.meta?.logMessages ?? [];
    if (logs.some((l) => /Instruction: CallbackDeal/.test(l))) track.push({ label: `${tag} callback_deal (oracle)`, sig: s.signature, conn: er });
  }
}

async function cuReport(track: Tracked[]): Promise<string[]> {
  const entries: CuEntry[] = [];
  for (const x of track) {
    let meta: { computeUnitsConsumed?: number; logMessages?: string[] | null } | null = null;
    for (let attempt = 0; attempt < 3 && meta === null; attempt++) {
      const tx = await x.conn.getTransaction(x.sig, { maxSupportedTransactionVersion: 0, commitment: "confirmed" }).catch(() => null);
      meta = tx?.meta ?? null;
      if (meta === null) await sleep(1_000);
    }
    entries.push(...cuEntriesForTx(x.label, meta, PROGRAM_ID.toBase58()));
  }
  return formatCuLines(entries);
}

async function versionLine(name: string, conn: () => Promise<Connection>): Promise<string> {
  try {
    return formatVersionLine(name, await (await conn()).getVersion());
  } catch (e) {
    return formatVersionLine(name, e instanceof Error ? e : new Error(String(e)));
  }
}

async function main(): Promise<void> {
  const burner = loadBurner();
  const seats = [0, 1, 2, 3].map((i) => deriveBotKeypair(burner, 100 + i));
  const stranger = deriveBotKeypair(burner, 199);
  const tee = new TeeDealAdapter();
  const results: CheckResult[] = [];
  const roundId = new BN(Date.now());
  const track: Tracked[] = [];
  const info: string[] = [];
  let ctx: DealContext | null = null;

  info.push(await versionLine("tee", () => tee.erConnection(burner)));
  info.push(await versionLine("devnet-as", () => Promise.resolve(publicErConnection(AS_RPC))));
  console.log(info.join("\n"));

  try {
    const table = await seatTable(burner, seats, roundId, TEE_VALIDATOR, "tee", track);
    ctx = { roundId, table, seatOwners: seats.map((s) => s.publicKey), payer: burner, seatKeys: seats };
    const teeConn = await tee.erConnection(burner);
    for (const sig of await tee.afterDelegate(ctx)) track.push({ label: "tee create permissions", sig, conn: teeConn });
  } catch (e) {
    const d = `setup failed: ${errText(e)}`;
    results.push({ id: "a", pass: false, detail: d }, { id: "b", pass: false, detail: d }, { id: "c", pass: false, detail: d });
    ctx = null;
  }

  if (ctx) {
    const er = makeProgram(await tee.erConnection(burner), burner);
    let dealt = false;
    try {
      track.push({ label: "tee request_deal", sig: await requestDeal(er, burner, ctx.table, 7), conn: er.provider.connection });
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
        for (const sig of await tee.reveal(ctx)) track.push({ label: "tee reveal_hands", sig, conn: er.provider.connection });
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

    try {
      await trackOracleCallback(er.provider.connection, ctx.table, "tee", track);
    } catch (e) {
      info.push(`- tee oracle callback lookup failed: ${errText(e)}`);
    }
  }

  try {
    const roundF = new BN(Date.now() + 1);
    const seatsF = [0, 1, 2, 3].map((i) => deriveBotKeypair(burner, 110 + i));
    const tableF = await seatTable(burner, seatsF, roundF, AS_VALIDATOR, "as", track);
    const erF = makeProgram(publicErConnection(AS_RPC), burner);
    const erFConn = erF.provider.connection;
    await waitUntilOnEr(erFConn, tableF, 30_000);
    track.push({ label: "as request_deal", sig: await requestDeal(erF, burner, tableF, 9), conn: erFConn });
    try {
      await waitForPhase(erF, tableF, "trading", 45_000);
      results.push({ id: "f", pass: true, detail: "VRF deal landed on devnet-as" });
    } finally {
      await trackOracleCallback(erFConn, tableF, "as", track).catch((e: unknown) => void info.push(`- as oracle callback lookup failed: ${errText(e)}`));
    }
  } catch (e) {
    results.push({ id: "f", pass: false, detail: errText(e) });
  }

  try {
    info.push(...(await cuReport(track)));
  } catch (e) {
    info.push(`- cu report failed: ${errText(e)}`);
  }

  const out = formatSpikeResult(new Date(), PROGRAM_ID.toBase58(), results, info);
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
