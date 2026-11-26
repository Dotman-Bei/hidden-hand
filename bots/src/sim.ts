import { CARDS_PER_SEAT, SEATS, START_PRICE_C, hiddenSum, quote, type SeatBook } from "@hidden-hand/client/engine";
import { type BotMemory, type BotPersona, type Order, decide, mulberry32, personaFor } from "./policy";

export type FourthSeat = "bot" | "slow-follower" | "random" | "idle";
export interface RoundOutcome { sum: number; closeC: number; trades: number }
export interface Summary { deals: number; within4: number; medianAbsErr: number; p90AbsErr: number; medianDoNothing: number; medianTrades: number }

interface Actor { seat: number; own: number; persona: BotPersona; mem: BotMemory; nextMs: number; kind: FourthSeat }

export function simulateRound(seed: number, roundMs: number, fourth: FourthSeat): RoundOutcome {
  const rng = mulberry32(seed);
  const cards: number[] = [];
  for (let i = 0; i < SEATS * CARDS_PER_SEAT; i++) cards.push(1 + Math.floor(rng() * 15));
  const books: SeatBook[] = Array.from({ length: SEATS }, () => ({ cashC: 0, pos: 0 }));
  let priceC = START_PRICE_C;
  let trades = 0;
  const actors: Actor[] = [];
  for (let seat = 0; seat < SEATS; seat++) {
    const kind: FourthSeat = seat === SEATS - 1 ? fourth : "bot";
    const persona = personaFor(seat, rng);
    if (kind === "slow-follower") {
      persona.intervalMinMs = 2000;
      persona.intervalMaxMs = 5000;
      persona.rampMs = 30_000 + Math.floor(rng() * 30_000);
    }
    const own = cards[seat * 2] + cards[seat * 2 + 1];
    actors.push({ seat, own, persona, mem: { wobble: 0 }, nextMs: Math.floor(rng() * persona.intervalMaxMs), kind });
  }
  for (;;) {
    let a = actors[0];
    for (const x of actors) if (x.nextMs < a.nextMs) a = x;
    if (a.nextMs >= roundMs) break;
    const t = a.nextMs;
    let order: Order | null = null;
    if (a.kind === "bot" || a.kind === "slow-follower") order = decide(a.own, books[a.seat].pos, t, a.persona, a.mem, rng);
    else if (a.kind === "random") order = { side: rng() < 0.5 ? "buy" : "sell", qty: 1 + Math.floor(rng() * 3) };
    if (order) {
      const fill = quote(priceC, books[a.seat].pos, order.side, order.qty);
      if (typeof fill !== "string") {
        priceC = fill.priceAfterC;
        books[a.seat].cashC += fill.cashDeltaC;
        books[a.seat].pos += fill.posDelta;
        trades++;
      }
    }
    const gap = a.kind === "random"
      ? 3000 + rng() * 5000
      : a.persona.intervalMinMs + rng() * (a.persona.intervalMaxMs - a.persona.intervalMinMs);
    a.nextMs = t + Math.floor(gap);
  }
  return { sum: hiddenSum(cards), closeC: priceC, trades };
}

export function summarize(firstSeed: number, deals: number, roundMs: number, fourth: FourthSeat): Summary {
  const errs: number[] = [];
  const idle: number[] = [];
  const tr: number[] = [];
  let within = 0;
  for (let i = 0; i < deals; i++) {
    const r = simulateRound(firstSeed + i, roundMs, fourth);
    const e = Math.abs(r.closeC / 100 - r.sum);
    errs.push(e);
    idle.push(Math.abs(64 - r.sum));
    tr.push(r.trades);
    if (e <= 4) within++;
  }
  const sorted = (v: number[]) => [...v].sort((x, y) => x - y);
  const med = (v: number[]) => sorted(v)[Math.floor(v.length / 2)];
  const p90 = (v: number[]) => sorted(v)[Math.floor(v.length * 0.9)];
  return { deals, within4: within / deals, medianAbsErr: med(errs), p90AbsErr: p90(errs), medianDoNothing: med(idle), medianTrades: med(tr) };
}
