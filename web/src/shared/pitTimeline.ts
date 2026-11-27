import { decide, mulberry32, personaFor, type BotMemory, type BotPersona } from "@hidden-hand/bots/policy";
import { CARDS_PER_SEAT, SEATS, START_PRICE_C, hiddenSum, quote, type Side } from "@hidden-hand/client/engine";

export interface PitEvent { tMs: number; seat: number; side: Side; qty: number; priceAfterC: number }
export interface PitTimeline { cards: number[]; hiddenSum: number; events: PitEvent[]; closeC: number }

/** One illustrative round: the same policy and engine as the live bots, simulated with a seed (no network). */
export function pitTimeline(seed: number, roundMs: number): PitTimeline {
  const rng = mulberry32(seed);
  const cards: number[] = [];
  for (let i = 0; i < SEATS * CARDS_PER_SEAT; i++) cards.push(1 + Math.floor(rng() * 15));
  const pos = new Array<number>(SEATS).fill(0);
  const personas: BotPersona[] = [];
  const mems: BotMemory[] = [];
  const next: number[] = [];
  for (let s = 0; s < SEATS; s++) {
    personas.push(personaFor(s, rng));
    mems.push({ wobble: 0 });
    next.push(Math.floor(rng() * personas[s].intervalMaxMs));
  }
  let priceC = START_PRICE_C;
  const events: PitEvent[] = [];
  for (;;) {
    let s = 0;
    for (let k = 1; k < SEATS; k++) if (next[k] < next[s]) s = k;
    if (next[s] >= roundMs) break;
    const t = next[s];
    const own = cards[2 * s] + cards[2 * s + 1];
    const order = decide(own, pos[s], t, personas[s], mems[s], rng);
    if (order) {
      const f = quote(priceC, pos[s], order.side, order.qty);
      if (typeof f !== "string") {
        priceC = f.priceAfterC;
        pos[s] += f.posDelta;
        events.push({ tMs: t, seat: s, side: order.side, qty: order.qty, priceAfterC: priceC });
      }
    }
    const p = personas[s];
    next[s] = t + Math.floor(p.intervalMinMs + rng() * (p.intervalMaxMs - p.intervalMinMs));
  }
  return { cards, hiddenSum: hiddenSum(cards), events, closeC: priceC };
}
