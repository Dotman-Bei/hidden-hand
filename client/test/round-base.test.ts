import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { describe, expect, it } from "vitest";
import { decodeTable } from "../src/round-base";

const pk = PublicKey.default;
function rawTable(tradeCount: number) {
  const trades = Array.from({ length: 128 }, (_, i) => ({ seat: i % 4, side: i % 2, qty: 1, priceAfterC: 6400 + i, ts: new BN(i) }));
  return {
    roundId: new BN(9), authority: pk, mode: { tee: {} }, phase: { trading: {} }, durationSecs: 75,
    entryLamports: new BN(10_000_000), seatCount: 4,
    seats: Array.from({ length: 4 }, () => ({ owner: pk, hand: pk, cashC: new BN(-650), pos: 1, commitment: new Array(32).fill(0), revealed: false })),
    priceC: 6500, startTs: new BN(100), endTs: new BN(175), seed: new Array(32).fill(0), cards: new Array(8).fill(0),
    hiddenSum: 0, winner: 255, pnlC: [new BN(0), new BN(0), new BN(0), new BN(0)], paid: false, tradeCount, trades,
  };
}

describe("decodeTable", () => {
  it("returns the ring in chronological order once it wraps", () => {
    const v = decodeTable(pk, rawTable(130) as unknown as Parameters<typeof decodeTable>[1]);
    expect(v.trades.length).toBe(128);
    expect(v.trades[0].index).toBe(2);
    expect(v.trades[127].index).toBe(129);
    expect(v.trades[127].priceAfterC).toBe(6400 + (129 % 128));
  });
  it("maps phase, mode, BN fields and the no-winner sentinel", () => {
    const v = decodeTable(pk, rawTable(3) as unknown as Parameters<typeof decodeTable>[1]);
    expect(v.phase).toBe("trading");
    expect(v.mode).toBe("tee");
    expect(v.winner).toBeNull();
    expect(v.seats[0].cashC).toBe(-650);
    expect(v.trades.map((t) => t.index)).toEqual([0, 1, 2]);
    expect(v.trades[1].side).toBe("sell");
  });
});
