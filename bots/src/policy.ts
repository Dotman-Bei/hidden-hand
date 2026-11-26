import { HAND_MEAN, POS_CAP, type Side } from "@hidden-hand/client/engine";

export const DEMO_SEED = 20261127;

/** Seeded PRNG (mulberry32): the same seed gives the same sequence everywhere. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface BotPersona {
  intervalMinMs: number;
  intervalMaxMs: number;
  rampMs: number;
  wobbleProb: number;
  maxLot: number;
}
export interface BotMemory { wobble: number }
export interface Order { side: Side; qty: number }

/** Target position = the hand's edge in contracts (1 contract = 1 point), phased in over rampMs, plus a -1/0/+1 wobble. */
export function botTarget(ownSum: number, tMs: number, persona: BotPersona, mem: BotMemory): number {
  const edge = ownSum - HAND_MEAN;
  const ramp = Math.min(1, tMs / persona.rampMs);
  const raw = Math.round(edge * ramp) + mem.wobble;
  return Math.max(-POS_CAP, Math.min(POS_CAP, raw));
}

export function decide(ownSum: number, pos: number, tMs: number, persona: BotPersona, mem: BotMemory, rng: () => number): Order | null {
  if (rng() < persona.wobbleProb) mem.wobble = Math.floor(rng() * 3) - 1;
  const target = botTarget(ownSum, tMs, persona, mem);
  const diff = target - pos;
  if (diff === 0) return null;
  const lot = 1 + Math.floor(rng() * persona.maxLot);
  return { side: diff > 0 ? "buy" : "sell", qty: Math.min(Math.abs(diff), lot) };
}

export function personaFor(seat: number, rng: () => number): BotPersona {
  return {
    intervalMinMs: 700 + seat * 100,
    intervalMaxMs: 1900 + seat * 150,
    rampMs: 15_000 + Math.floor(rng() * 30_000),
    wobbleProb: 0.25,
    maxLot: 3,
  };
}
