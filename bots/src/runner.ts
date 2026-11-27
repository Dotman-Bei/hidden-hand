import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import BN from "bn.js";
import {
  DEFAULT_DEAL_MODE, type DealContext, type DealMode, ENTRY_LAMPORTS, PROGRAM_ID, type TableView, baseConnection, claimPot, createDealAdapter,
  delegatePdas, deriveBotKeypair, fetchTable, findCommitSignatures, fundAccounts, joinTable, makeProgram, memorySecretStore,
  openTable, requestDeal, sendTrade, settleRound, tablePda, waitForOwner, waitForPhase,
} from "@hidden-hand/client";
import { REPO_ROOT, loadBurner } from "@hidden-hand/client/node";
import { type Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { DEMO_SEED, type BotMemory, decide, mulberry32, personaFor } from "./policy";
import { type ProofData, formatProof } from "./proof";

export interface RunOptions { demo: boolean; proof: boolean; seat4: PublicKey | null; durationSecs: number; mode: DealMode; joinWindowSecs: number }
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const log = (m: string) => console.log(`[demo-round ${new Date().toISOString()}] ${m}`);

export async function runDemoRound(o: RunOptions): Promise<ProofData> {
  const burner = loadBurner();
  const base = baseConnection();
  const baseProgram = makeProgram(base, burner);
  const adapter = createDealAdapter(o.mode, memorySecretStore());
  const bots = [0, 1, 2, 3].map((i) => deriveBotKeypair(burner, i));
  const rng = mulberry32(o.demo ? DEMO_SEED : (Date.now() >>> 0));
  const roundId = new BN(Date.now());
  const table = tablePda(roundId);

  const openSig = await openTable(baseProgram, burner, roundId, o.mode, o.durationSecs, ENTRY_LAMPORTS);
  log(`table ${table.toBase58()} open; watch it at /app/?round=${roundId.toString()}`);
  const fundTargets = bots.map((b) => b.publicKey).concat(o.seat4 ? [o.seat4] : []);
  await fundAccounts(base, burner, fundTargets, 0.03 * LAMPORTS_PER_SOL);

  const joins: string[] = [];
  for (const b of bots.slice(0, 3)) joins.push(await joinTable(baseProgram, burner, b, table, adapter.commitmentFor(table, b.publicKey)));
  let humanJoined = false;
  if (o.seat4) {
    log(`waiting ${o.joinWindowSecs}s for the browser seat ${o.seat4.toBase58()}`);
    const deadline = Date.now() + o.joinWindowSecs * 1000;
    while (Date.now() < deadline) {
      const v = await fetchTable(baseProgram, table);
      if (v && v.seatCount === 4) { humanJoined = true; break; }
      await sleep(1000);
    }
  }
  if (!humanJoined) joins.push(await joinTable(baseProgram, burner, bots[3], table, adapter.commitmentFor(table, bots[3].publicKey)));

  const seated = await fetchTable(baseProgram, table);
  if (!seated || seated.seatCount !== 4) throw new Error("table did not fill four seats");
  const owners = seated.seats.map((s) => s.owner);
  // Owner keypairs this process holds, in seat order (the bots; a browser seat's key is never held here).
  const seatKeys = owners.map((ow) => bots.find((b) => b.publicKey.equals(ow)) ?? null).filter((k): k is Keypair => k !== null);
  const ctx: DealContext = { roundId, table, seatOwners: owners, payer: burner, seatKeys };
  const delegations = await delegatePdas(baseProgram, burner, roundId, table, owners, adapter.validator);
  const setup = await adapter.afterDelegate(ctx);

  const erBurner = makeProgram(await adapter.erConnection(burner), burner);
  const dealSig = await requestDeal(erBurner, burner, table, Math.floor(rng() * 256));
  let view: TableView = await waitForPhase(erBurner, table, "trading", 45_000);
  log(`dealt; trading until ${new Date(view.endTs * 1000).toISOString()}`);

  const botSeats = owners.map((ow, seat) => ({ seat, key: bots.find((b) => b.publicKey.equals(ow)) ?? null })).filter((x): x is { seat: number; key: Keypair } => x.key !== null);
  const ers = await Promise.all(botSeats.map(async (b) => makeProgram(await adapter.erConnection(b.key), b.key)));
  const own = await Promise.all(botSeats.map(async (b) => {
    const h = await adapter.readOwnHand(ctx, b.key);
    if (!h) throw new Error(`seat ${b.seat} cannot read its own hand`);
    return h[0] + h[1];
  }));
  const personas = botSeats.map((b) => personaFor(b.seat, rng));
  const mems: BotMemory[] = botSeats.map(() => ({ wobble: 0 }));
  const startMs = view.startTs * 1000;
  const endMs = view.endTs * 1000;
  const next = personas.map((p) => Date.now() + Math.floor(rng() * p.intervalMaxMs));
  const trades: string[] = [];
  let lastRefresh = 0;
  while (Date.now() < endMs - 1500) {
    let i = 0;
    for (let k = 1; k < next.length; k++) if (next[k] < next[i]) i = k;
    const wait = next[i] - Date.now();
    if (wait > 0) await sleep(wait);
    if (Date.now() >= endMs - 1500) break;
    if (Date.now() - lastRefresh > 800) {
      view = (await fetchTable(erBurner, table).catch(() => null)) ?? view;
      lastRefresh = Date.now();
    }
    const seat = botSeats[i].seat;
    const order = decide(own[i], view.seats[seat].pos, Date.now() - startMs, personas[i], mems[i], rng);
    if (order) {
      try {
        trades.push(await sendTrade(ers[i], botSeats[i].key, table, order.side, order.qty));
        view.seats[seat].pos += order.side === "buy" ? order.qty : -order.qty;
      } catch (e) {
        log(`seat ${seat} trade skipped: ${e instanceof Error ? e.message.slice(0, 120) : String(e)}`);
      }
    }
    const p = personas[i];
    next[i] = Date.now() + Math.floor(p.intervalMinMs + rng() * (p.intervalMaxMs - p.intervalMinMs));
  }

  const bellAt = endMs + 1000;
  if (Date.now() < bellAt) await sleep(bellAt - Date.now());
  log("bell");
  const reveal = await adapter.reveal(ctx, botSeats.map((b) => b.key));
  view = await waitForPhase(erBurner, table, "revealed", 60_000);
  const settleSig = await settleRound(erBurner, burner, view);
  await waitForOwner(base, table, PROGRAM_ID, 120_000);
  const settled = await waitForPhase(baseProgram, table, "settled", 30_000);
  const claimSig = await claimPot(baseProgram, burner, settled);
  const known = [openSig, ...joins, ...delegations, claimSig];
  const commitUndelegate = await findCommitSignatures(base, table, known);
  log(`hidden sum ${settled.hiddenSum}, close ${(settled.priceC / 100).toFixed(2)}, winner seat ${settled.winner}`);

  const data: ProofData = {
    generatedAt: new Date().toISOString(), mode: o.mode, programId: PROGRAM_ID.toBase58(), table: table.toBase58(),
    roundId: roundId.toString(), validator: adapter.validator.toBase58(), erRpc: adapter.erRpc,
    base: { openTable: openSig, joins, delegations, commitUndelegate, claimPot: claimSig },
    er: { setup, requestDeal: dealSig, trades, reveal, settle: settleSig },
    result: {
      hiddenSum: settled.hiddenSum, closeC: settled.priceC, winnerSeat: settled.winner ?? 0,
      winner: settled.seats[settled.winner ?? 0].owner.toBase58(), pnlC: settled.pnlC,
      potLamports: ENTRY_LAMPORTS * 4, cards: settled.cards,
    },
  };
  if (o.proof) {
    mkdirSync(resolve(REPO_ROOT, "docs/proof"), { recursive: true });
    writeFileSync(resolve(REPO_ROOT, "docs/proof/devnet-round.md"), formatProof(data), "utf8");
    log("wrote docs/proof/devnet-round.md");
  }
  return data;
}

export function parseArgs(argv: string[]): RunOptions {
  const has = (f: string) => argv.includes(f);
  const val = (f: string) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : undefined; };
  const demo = has("--demo");
  const seat4 = val("--seat4");
  const mode = (val("--mode") ?? DEFAULT_DEAL_MODE) as DealMode;
  return {
    demo,
    proof: has("--proof"),
    seat4: seat4 ? new PublicKey(seat4) : null,
    durationSecs: Number(val("--duration") ?? (demo ? 75 : 90)),
    mode,
    joinWindowSecs: 20,
  };
}
