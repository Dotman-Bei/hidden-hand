// Hidden Hand engine (TS port of program/engine). Integer cents. Pinned by program/engine-vectors.json.
export const START_PRICE_C = 6400;
export const STEP_C = 100;
export const MAX_LOT = 5;
export const POS_CAP = 15;
export const MIN_PRICE_C = 800;
export const MAX_PRICE_C = 12000;
export const SEATS = 4;
export const CARDS_PER_SEAT = 2;
export const HAND_MEAN = 16; // two cards, each uniform 1..15

export type Side = "buy" | "sell";
export type TradeError = "LotSize" | "PositionCap" | "PriceBound";
export interface SeatBook { cashC: number; pos: number }
export interface Fill { priceAfterC: number; cashDeltaC: number; posDelta: number }

export function quote(priceC: number, pos: number, side: Side, qty: number): Fill | TradeError {
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_LOT) return "LotSize";
  const impact = (STEP_C * qty * qty) / 2;
  if (side === "buy") {
    if (pos + qty > POS_CAP) return "PositionCap";
    const priceAfterC = priceC + STEP_C * qty;
    if (priceAfterC > MAX_PRICE_C) return "PriceBound";
    return { priceAfterC, cashDeltaC: -(qty * priceC + impact), posDelta: qty };
  }
  if (pos - qty < -POS_CAP) return "PositionCap";
  const priceAfterC = priceC - STEP_C * qty;
  if (priceAfterC < MIN_PRICE_C) return "PriceBound";
  return { priceAfterC, cashDeltaC: qty * priceC - impact, posDelta: -qty };
}

export function cardsFromRandomness(bytes: Uint8Array): number[] {
  const cards: number[] = [];
  for (let i = 0; i < SEATS * CARDS_PER_SEAT; i++) cards.push(1 + (bytes[i] % 15));
  return cards;
}

export function hiddenSum(cards: number[]): number {
  return cards.reduce((a, b) => a + b, 0);
}

export function pnlC(seat: SeatBook, sum: number): number {
  return seat.cashC + seat.pos * sum * 100;
}

export function winner(seats: SeatBook[], sum: number): number {
  let best = 0;
  for (let i = 1; i < seats.length; i++) if (pnlC(seats[i], sum) > pnlC(seats[best], sum)) best = i;
  return best;
}

/** What a sealed hand knows, in contracts: one contract moves the price one point. */
export function handEdge(cards: [number, number]): number {
  return cards[0] + cards[1] - HAND_MEAN;
}
