import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { START_PRICE_C, cardsFromRandomness, handEdge, hiddenSum, pnlC, quote, winner, type SeatBook, type Side } from "../src/engine";

interface Vectors {
  randomness: { bytes: number[]; cards: number[]; hiddenSum: number }[];
  cases: {
    name: string; hiddenSum: number;
    trades: { seat: number; side: Side; qty: number; expect: string }[];
    final: { priceC: number; cashC: number[]; pos: number[]; pnlC: number[]; winner: number };
  }[];
}
const vectors = JSON.parse(readFileSync(new URL("../../program/engine-vectors.json", import.meta.url), "utf8")) as Vectors;

describe("engine golden vectors (shared with the Rust engine)", () => {
  it("derives cards from randomness", () => {
    for (const r of vectors.randomness) {
      const cards = cardsFromRandomness(Uint8Array.from(r.bytes));
      expect(cards).toEqual(r.cards);
      expect(hiddenSum(cards)).toBe(r.hiddenSum);
    }
  });
  for (const c of vectors.cases) {
    it(c.name, () => {
      let priceC = START_PRICE_C;
      const books: SeatBook[] = [0, 1, 2, 3].map(() => ({ cashC: 0, pos: 0 }));
      c.trades.forEach((t, k) => {
        const f = quote(priceC, books[t.seat].pos, t.side, t.qty);
        if (typeof f === "string") {
          expect(f, `trade ${k}`).toBe(t.expect);
        } else {
          expect("ok", `trade ${k}`).toBe(t.expect);
          priceC = f.priceAfterC;
          books[t.seat].cashC += f.cashDeltaC;
          books[t.seat].pos += f.posDelta;
        }
      });
      expect(priceC).toBe(c.final.priceC);
      expect(books.map((b) => b.cashC)).toEqual(c.final.cashC);
      expect(books.map((b) => b.pos)).toEqual(c.final.pos);
      expect(books.map((b) => pnlC(b, c.hiddenSum))).toEqual(c.final.pnlC);
      expect(winner(books, c.hiddenSum)).toBe(c.final.winner);
    });
  }
  it("prices a hand's edge in contracts", () => {
    expect(handEdge([15, 14])).toBe(13);
    expect(handEdge([1, 2])).toBe(-13);
  });
});
