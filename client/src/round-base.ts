import type { IdlAccounts, Program } from "@coral-xyz/anchor";
import BN from "bn.js";
import { type Connection, type Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { DEFAULT_EPHEMERAL_QUEUE, type DealMode } from "./config";
import type { HiddenHand } from "./idl/hidden_hand";
import { handPda, tablePda, vaultPda } from "./pda";
import { sendIxs } from "./tx";

export type PhaseName = "open" | "dealing" | "trading" | "revealed" | "settled";
export interface SeatView { owner: PublicKey; hand: PublicKey; cashC: number; pos: number; revealed: boolean }
export interface TradeView { index: number; seat: number; side: "buy" | "sell"; qty: number; priceAfterC: number; ts: number }
export interface TableView {
  address: PublicKey; roundId: BN; authority: PublicKey; mode: DealMode; phase: PhaseName;
  durationSecs: number; entryLamports: number; seatCount: number; seats: SeatView[]; priceC: number;
  startTs: number; endTs: number; cards: number[]; hiddenSum: number; winner: number | null; pnlC: number[];
  paid: boolean; tradeCount: number; trades: TradeView[];
}

type RawTable = IdlAccounts<HiddenHand>["table"];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function decodeTable(address: PublicKey, raw: RawTable): TableView {
  const ring = raw.trades.length;
  const count = raw.tradeCount;
  const n = Math.min(count, ring);
  const trades: TradeView[] = [];
  for (let k = count - n; k < count; k++) {
    const t = raw.trades[k % ring];
    trades.push({ index: k, seat: t.seat, side: t.side === 0 ? "buy" : "sell", qty: t.qty, priceAfterC: t.priceAfterC, ts: t.ts.toNumber() });
  }
  return {
    address,
    roundId: raw.roundId,
    authority: raw.authority,
    mode: Object.keys(raw.mode)[0] === "tee" ? "tee" : "commit-reveal",
    phase: Object.keys(raw.phase)[0] as PhaseName,
    durationSecs: raw.durationSecs,
    entryLamports: raw.entryLamports.toNumber(),
    seatCount: raw.seatCount,
    seats: raw.seats.map((s) => ({ owner: s.owner, hand: s.hand, cashC: s.cashC.toNumber(), pos: s.pos, revealed: s.revealed })),
    priceC: raw.priceC,
    startTs: raw.startTs.toNumber(),
    endTs: raw.endTs.toNumber(),
    cards: [...raw.cards],
    hiddenSum: raw.hiddenSum,
    winner: raw.winner === 255 ? null : raw.winner,
    pnlC: raw.pnlC.map((x) => x.toNumber()),
    paid: raw.paid,
    tradeCount: count,
    trades,
  };
}

export async function fetchTable(program: Program<HiddenHand>, table: PublicKey): Promise<TableView | null> {
  const raw = await program.account.table.fetchNullable(table);
  return raw ? decodeTable(table, raw) : null;
}

export async function waitForPhase(program: Program<HiddenHand>, table: PublicKey, phase: PhaseName, timeoutMs: number): Promise<TableView> {
  const deadline = Date.now() + timeoutMs;
  let last: TableView | null = null;
  while (Date.now() < deadline) {
    last = await fetchTable(program, table).catch(() => null);
    if (last && last.phase === phase) return last;
    await sleep(500);
  }
  throw new Error(`table ${table.toBase58()} did not reach phase ${phase} in ${timeoutMs} ms (last: ${last ? last.phase : "unreadable"})`);
}

export async function waitUntilOnEr(er: Connection, account: PublicKey, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const info = await er.getAccountInfo(account).catch(() => null);
    if (info) return;
    await sleep(500);
  }
  throw new Error(`${account.toBase58()} not visible on the ER after ${timeoutMs} ms`);
}

export async function waitForOwner(base: Connection, account: PublicKey, owner: PublicKey, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const info = await base.getAccountInfo(account, "confirmed").catch(() => null);
    if (info && info.owner.equals(owner)) return;
    await sleep(1000);
  }
  throw new Error(`${account.toBase58()} is not owned by ${owner.toBase58()} after ${timeoutMs} ms`);
}

/** Top up each target to `lamportsEach` from the payer in one base-layer tx; null when nobody needed funds. */
export async function fundAccounts(base: Connection, payer: Keypair, targets: PublicKey[], lamportsEach: number): Promise<string | null> {
  const ixs = [];
  for (const to of targets) {
    const have = await base.getBalance(to, "confirmed");
    if (have < lamportsEach) ixs.push(SystemProgram.transfer({ fromPubkey: payer.publicKey, toPubkey: to, lamports: lamportsEach - have }));
  }
  return ixs.length > 0 ? sendIxs(base, ixs, payer) : null;
}

export async function openTable(
  base: Program<HiddenHand>, authority: Keypair, roundId: BN, mode: DealMode, durationSecs: number, entryLamports: number,
): Promise<string> {
  const ix = await base.methods
    .openTable(roundId, mode === "tee" ? { tee: {} } : { commitReveal: {} }, durationSecs, new BN(entryLamports))
    .accountsPartial({ table: tablePda(roundId), authority: authority.publicKey })
    .instruction();
  return sendIxs(base.provider.connection, [ix], authority);
}

export async function joinTable(
  base: Program<HiddenHand>, payer: Keypair, player: Keypair, table: PublicKey, commitment: Uint8Array,
): Promise<string> {
  const ix = await base.methods
    .joinTable(Array.from(commitment))
    .accountsPartial({ table, hand: handPda(table, player.publicKey), vault: vaultPda(table), player: player.publicKey })
    .instruction();
  const extra = payer.publicKey.equals(player.publicKey) ? [] : [player];
  return sendIxs(base.provider.connection, [ix], payer, extra);
}

/** Base layer: delegate the table, then each hand, one tx each. Returns the base-layer signatures (proof). */
export async function delegatePdas(
  base: Program<HiddenHand>, payer: Keypair, roundId: BN, table: PublicKey, owners: PublicKey[], validator: PublicKey,
): Promise<string[]> {
  const conn = base.provider.connection;
  const sigs: string[] = [];
  const tIx = await base.methods.delegatePda({ table: { roundId } }).accountsPartial({ payer: payer.publicKey, validator, pda: table }).instruction();
  sigs.push(await sendIxs(conn, [tIx], payer));
  for (const owner of owners) {
    const ix = await base.methods
      .delegatePda({ hand: { table, owner } })
      .accountsPartial({ payer: payer.publicKey, validator, pda: handPda(table, owner) })
      .instruction();
    sigs.push(await sendIxs(conn, [ix], payer));
  }
  return sigs;
}

export async function requestDeal(er: Program<HiddenHand>, payer: Keypair, table: PublicKey, clientSeed: number): Promise<string> {
  const ix = await er.methods
    .requestDeal(clientSeed)
    .accountsPartial({ payer: payer.publicKey, table, oracleQueue: DEFAULT_EPHEMERAL_QUEUE })
    .instruction();
  return sendIxs(er.provider.connection, [ix], payer);
}

