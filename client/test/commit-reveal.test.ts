import { describe, expect, it } from "vitest";
import { cardsForSeat, commitmentOf } from "../src/deal/commit-reveal";

describe("commit-reveal hashes (pinned to the Rust engine)", () => {
  it("matches the engine's commitment and cards", () => {
    const secret = new Uint8Array(32).fill(7);
    const seed = new Uint8Array(32).fill(9);
    expect(Array.from(commitmentOf(secret))).toEqual([47, 239, 188, 243, 76, 65, 161, 202, 173, 206, 67, 255, 145, 173, 157, 224, 180, 87, 146, 60, 189, 203, 134, 169, 249, 122, 157, 10, 194, 227, 209, 217]);
    expect(cardsForSeat(seed, secret, 0)).toEqual([4, 10]);
    expect(cardsForSeat(seed, secret, 1)).toEqual([11, 11]);
    expect(cardsForSeat(seed, secret, 2)).toEqual([7, 13]);
    expect(cardsForSeat(seed, secret, 3)).toEqual([2, 2]);
  });
});
