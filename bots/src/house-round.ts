import BN from "bn.js";
import { type Connection, Keypair, type PublicKey } from "@solana/web3.js";
import {
  type DealContext, ENTRY_LAMPORTS, PROGRAM_ID, type Side, TEE_RPC, TEE_VALIDATOR, type TableView, type WalletSigner, tablePda,
} from "@hidden-hand/client";
import { type BotMemory, decide, mulberry32, personaFor } from "./policy";
import type { ProofData } from "./proof";

export type WalletPhase =
  | "funding" | "opening" | "joining" | "signing-in" | "seating-bots" | "delegating" | "dealing"
  | "trading" | "bell" | "settling" | "claiming" | "sweeping" | "done" | "error";

export interface HouseKeys { house: Keypair; bots: Keypair[] }
export interface KeyVault { load(): HouseKeys | null; save(keys: HouseKeys): void; clear(): void }
export interface RoundRent { tableRent: number; handRent: number }
export interface WalletRoundBudget { house: number; bot: number; wallet: number; total: number }
export interface SweepResult { sig: string | null; lamports: number }

/** Every chain call the wallet round makes. liveHouseIo() is the devnet one; tests pass a fake. */
export interface HouseIo {
  rent(): Promise<RoundRent>;
  balance(who: PublicKey): Promise<number>;
  fund(wallet: WalletSigner, targets: { to: PublicKey; lamports: number }[]): Promise<string>;
  openTable(house: Keypair, roundId: BN, durationSecs: number): Promise<string>;
  joinWallet(wallet: WalletSigner, table: PublicKey): Promise<string>;
  signIn(wallet: WalletSigner): Promise<Connection>;
  joinBot(house: Keypair, bot: Keypair, table: PublicKey): Promise<string>;
  baseTable(table: PublicKey): Promise<TableView | null>;
  delegate(house: Keypair, roundId: BN, table: PublicKey, owners: PublicKey[]): Promise<string[]>;
  afterDelegate(ctx: DealContext): Promise<string[]>;
  requestDeal(house: Keypair, table: PublicKey, clientSeed: number): Promise<string>;
  erTable(house: Keypair, table: PublicKey): Promise<TableView | null>;
  readBotHand(ctx: DealContext, bot: Keypair): Promise<[number, number] | null>;
  botTrade(bot: Keypair, table: PublicKey, side: Side, qty: number): Promise<string>;
  reveal(ctx: DealContext): Promise<string[]>;
  settle(house: Keypair, view: TableView): Promise<string>;
  waitForOwner(table: PublicKey, owner: PublicKey, timeoutMs: number): Promise<void>;
  claim(house: Keypair, view: TableView): Promise<string>;
  commitSignatures(table: PublicKey, known: string[]): Promise<string[]>;
  sweep(from: Keypair, to: PublicKey): Promise<SweepResult>;
  now(): number;
  sleep(ms: number): Promise<void>;
}

export interface WalletRoundEvent {
  phase: WalletPhase;
  table?: PublicKey;
  roundId?: string;
  /** The wallet's own TEE connection (from the sign-in popup): the UI trades and reads its hand through it. */
  walletEr?: Connection;
  view?: TableView;
  error?: string;
  swept?: number;
}
export interface WalletRoundOptions { durationSecs?: number; seed?: number; signal?: AbortSignal; onEvent?: (e: WalletRoundEvent) => void }
export interface WalletRoundResult { proof: ProofData; walletPopups: number; sweptLamports: number; budget: WalletRoundBudget; table: PublicKey; roundId: string }

export const WALLET_ROUND_SECS = 90;
export const DELEGATION_ALLOWANCE_LAMPORTS = 4_000_000;
export const SEAT_FEE_ALLOWANCE_LAMPORTS = 2_000_000;
export const HOUSE_FEE_ALLOWANCE_LAMPORTS = 5_000_000;

export class InsufficientFundsError extends Error {
  constructor(readonly needLamports: number, readonly haveLamports: number) {
    super(`The wallet holds ${(haveLamports / 1e9).toFixed(3)} devnet SOL; one round needs ${(needLamports / 1e9).toFixed(3)}.`);
    this.name = "InsufficientFundsError";
  }
}
export class RoundAbortedError extends Error {
  constructor() {
    super("The round was stopped.");
    this.name = "RoundAbortedError";
  }
}

export function walletRoundBudget(r: RoundRent): WalletRoundBudget {
  const bot = ENTRY_LAMPORTS + r.handRent + SEAT_FEE_ALLOWANCE_LAMPORTS;
  const house = r.tableRent + 5 * DELEGATION_ALLOWANCE_LAMPORTS + HOUSE_FEE_ALLOWANCE_LAMPORTS;
  const wallet = ENTRY_LAMPORTS + r.handRent + SEAT_FEE_ALLOWANCE_LAMPORTS;
  return { house, bot, wallet, total: house + 3 * bot + wallet };
}

export function newHouseKeys(): HouseKeys {
  return { house: Keypair.generate(), bots: [Keypair.generate(), Keypair.generate(), Keypair.generate()] };
}
export function memoryVault(): KeyVault {
  let held: HouseKeys | null = null;
  return { load: () => held, save: (k) => void (held = k), clear: () => void (held = null) };
}
export function serializeKeys(k: HouseKeys): string {
  return JSON.stringify({ house: Array.from(k.house.secretKey), bots: k.bots.map((b) => Array.from(b.secretKey)) });
}
export function parseKeys(text: string): HouseKeys | null {
  try {
    const o = JSON.parse(text) as { house?: unknown; bots?: unknown };
    const ok = (a: unknown): a is number[] => Array.isArray(a) && a.length === 64 && a.every((n) => Number.isInteger(n) && n >= 0 && n <= 255);
    if (!ok(o.house) || !Array.isArray(o.bots) || o.bots.length !== 3 || !o.bots.every(ok)) return null;
    return { house: Keypair.fromSecretKey(Uint8Array.from(o.house)), bots: (o.bots as number[][]).map((b) => Keypair.fromSecretKey(Uint8Array.from(b))) };
  } catch {
    return null;
  }
}

/** Bots first, then the house, back to `to`. Never throws; ok = every sweep went through. */
export async function sweepAll(io: HouseIo, keys: HouseKeys, to: PublicKey): Promise<{ lamports: number; ok: boolean }> {
  let lamports = 0;
  let ok = true;
  for (const k of [...keys.bots, keys.house]) {
    try {
      lamports += (await io.sweep(k, to)).lamports;
    } catch {
      ok = false;
    }
  }
  return { lamports, ok };
}

const message = (e: unknown): string => (e instanceof Error ? e.message : String(e));

async function waitPhase(io: HouseIo, read: () => Promise<TableView | null>, phase: TableView["phase"], timeoutMs: number): Promise<TableView> {
  const deadline = io.now() + timeoutMs;
  let last: TableView | null = null;
  while (io.now() < deadline) {
    last = await read().catch(() => null);
    if (last && last.phase === phase) return last;
    await io.sleep(500);
  }
  throw new Error(`The table did not reach ${phase} in ${Math.round(timeoutMs / 1000)} s (last: ${last ? last.phase : "unreadable"}).`);
}

/** The runner's bot loop (bots/src/runner.ts), driven through HouseIo and its clock. Returns the bots' ER trade signatures. */
async function botLoop(
  io: HouseIo, ctx: DealContext, bots: Keypair[], start: TableView, rng: () => number,
  onView: (v: TableView) => void, signal: AbortSignal | undefined,
): Promise<string[]> {
  const seats = ctx.seatOwners
    .map((ow, seat) => ({ seat, key: bots.find((b) => b.publicKey.equals(ow)) ?? null }))
    .filter((x): x is { seat: number; key: Keypair } => x.key !== null);
  const own = await Promise.all(
    seats.map(async (b) => {
      const h = await io.readBotHand(ctx, b.key);
      if (!h) throw new Error(`Seat ${b.seat + 1} cannot read its own hand.`);
      return h[0] + h[1];
    }),
  );
  const personas = seats.map((b) => personaFor(b.seat, rng));
  const mems: BotMemory[] = seats.map(() => ({ wobble: 0 }));
  const startMs = start.startTs * 1000;
  const endMs = start.endTs * 1000;
  const next = personas.map((p) => io.now() + Math.floor(rng() * p.intervalMaxMs));
  const trades: string[] = [];
  let view = start;
  let lastRefresh = 0;
  while (io.now() < endMs - 1500) {
    if (signal?.aborted) throw new RoundAbortedError();
    let i = 0;
    for (let k = 1; k < next.length; k++) if (next[k] < next[i]) i = k;
    const wait = next[i] - io.now();
    if (wait > 0) await io.sleep(wait);
    if (io.now() >= endMs - 1500) break;
    if (io.now() - lastRefresh > 800) {
      view = (await io.erTable(ctx.payer, ctx.table).catch(() => null)) ?? view;
      lastRefresh = io.now();
      onView(view);
    }
    const seat = seats[i].seat;
    const order = decide(own[i], view.seats[seat].pos, io.now() - startMs, personas[i], mems[i], rng);
    if (order) {
      try {
        trades.push(await io.botTrade(seats[i].key, ctx.table, order.side, order.qty));
        view.seats[seat].pos += order.side === "buy" ? order.qty : -order.qty;
      } catch {
        // a skipped bot trade is not fatal (same as the runner)
      }
    }
    const p = personas[i];
    next[i] = io.now() + Math.floor(p.intervalMinMs + rng() * (p.intervalMaxMs - p.intervalMinMs));
  }
  return trades;
}

/**
 * One wallet-mode round. Wallet popups, in order: fund (one tx, four transfers), join (seat 1), sign-in (signMessage for
 * the TEE token). Trades are the UI's (tradeWith on event.walletEr). The house and the bots do everything else, and every
 * in-tab key is swept back to the wallet at the end, on error, and on abort.
 */
export async function runWalletRound(io: HouseIo, wallet: WalletSigner, vault: KeyVault, o: WalletRoundOptions = {}): Promise<WalletRoundResult> {
  const emit = (e: WalletRoundEvent) => o.onEvent?.(e);
  const check = () => {
    if (o.signal?.aborted) throw new RoundAbortedError();
  };
  const durationSecs = o.durationSecs ?? WALLET_ROUND_SECS;
  const rng = mulberry32(o.seed ?? io.now() >>> 0);
  const budget = walletRoundBudget(await io.rent());
  const have = await io.balance(wallet.publicKey);
  if (have < budget.total) throw new InsufficientFundsError(budget.total, have);
  const keys = newHouseKeys();
  vault.save(keys); // before the funding popup, so a reload after funding can still sweep
  const { house, bots } = keys;
  let popups = 0;
  try {
    emit({ phase: "funding" });
    await io.fund(wallet, [{ to: house.publicKey, lamports: budget.house }, ...bots.map((b) => ({ to: b.publicKey, lamports: budget.bot }))]);
    popups++;
    check();
    const roundId = new BN(io.now());
    const id = roundId.toString();
    const table = tablePda(roundId);
    emit({ phase: "opening", table, roundId: id });
    const openSig = await io.openTable(house, roundId, durationSecs);
    check();
    emit({ phase: "joining", table, roundId: id });
    const joins = [await io.joinWallet(wallet, table)];
    popups++;
    check();
    emit({ phase: "signing-in", table, roundId: id });
    const walletEr = await io.signIn(wallet);
    popups++;
    check();
    emit({ phase: "seating-bots", table, roundId: id, walletEr });
    for (const b of bots) joins.push(await io.joinBot(house, b, table));
    const seated = await io.baseTable(table);
    if (!seated || seated.seatCount !== 4) throw new Error("The table did not fill four seats.");
    const owners = seated.seats.map((s) => s.owner);
    const ctx: DealContext = { roundId, table, seatOwners: owners, payer: house, seatKeys: bots };
    check();
    emit({ phase: "delegating", table, roundId: id, walletEr, view: seated });
    const delegations = await io.delegate(house, roundId, table, owners);
    const setup = await io.afterDelegate(ctx);
    check();
    emit({ phase: "dealing", table, roundId: id, walletEr });
    const dealSig = await io.requestDeal(house, table, Math.floor(rng() * 256));
    let view = await waitPhase(io, () => io.erTable(house, table), "trading", 45_000);
    emit({ phase: "trading", table, roundId: id, walletEr, view });
    const trades = await botLoop(io, ctx, bots, view, rng, (v) => emit({ phase: "trading", table, roundId: id, walletEr, view: v }), o.signal);
    const bellAt = view.endTs * 1000 + 1000;
    if (io.now() < bellAt) await io.sleep(bellAt - io.now());
    emit({ phase: "bell", table, roundId: id, walletEr });
    const reveal = await io.reveal(ctx);
    view = await waitPhase(io, () => io.erTable(house, table), "revealed", 60_000);
    emit({ phase: "settling", table, roundId: id, walletEr, view });
    const settleSig = await io.settle(house, view);
    await io.waitForOwner(table, PROGRAM_ID, 120_000);
    const settled = await waitPhase(io, () => io.baseTable(table), "settled", 30_000);
    emit({ phase: "claiming", table, roundId: id, walletEr, view: settled });
    const claimSig = await io.claim(house, settled);
    const commitUndelegate = await io.commitSignatures(table, [openSig, ...joins, ...delegations, claimSig]);
    emit({ phase: "sweeping", table, roundId: id, walletEr, view: settled });
    const swept = await sweepAll(io, keys, wallet.publicKey);
    if (swept.ok) vault.clear();
    const winnerSeat = settled.winner ?? 0;
    const proof: ProofData = {
      generatedAt: new Date(io.now()).toISOString(), mode: "tee", programId: PROGRAM_ID.toBase58(), table: table.toBase58(),
      roundId: id, validator: TEE_VALIDATOR.toBase58(), erRpc: TEE_RPC,
      base: { openTable: openSig, joins, delegations, commitUndelegate, claimPot: claimSig },
      er: { setup, requestDeal: dealSig, trades, reveal, settle: settleSig },
      result: {
        hiddenSum: settled.hiddenSum, closeC: settled.priceC, winnerSeat, winner: settled.seats[winnerSeat].owner.toBase58(),
        pnlC: settled.pnlC, potLamports: ENTRY_LAMPORTS * 4, cards: settled.cards,
      },
    };
    emit({ phase: "done", table, roundId: id, walletEr, view: settled, swept: swept.lamports });
    return { proof, walletPopups: popups, sweptLamports: swept.lamports, budget, table, roundId: id };
  } catch (e) {
    emit({ phase: "sweeping" });
    const swept = await sweepAll(io, keys, wallet.publicKey);
    if (swept.ok) vault.clear();
    emit({ phase: "error", error: message(e), swept: swept.lamports });
    throw e;
  }
}
