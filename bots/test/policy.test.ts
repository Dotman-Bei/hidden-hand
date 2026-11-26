import { describe, expect, it } from "vitest";
import { botTarget, decide, mulberry32, personaFor } from "../src/policy";

describe("policy", () => {
  it("is deterministic for a seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
  it("targets the hand's edge in contracts once ramped, capped at 15", () => {
    const p = { intervalMinMs: 700, intervalMaxMs: 1900, rampMs: 20_000, wobbleProb: 0, maxLot: 3 };
    expect(botTarget(26, 20_000, p, { wobble: 0 })).toBe(10);
    expect(botTarget(26, 10_000, p, { wobble: 0 })).toBe(5);
    expect(botTarget(4, 60_000, p, { wobble: 0 })).toBe(-12);
    expect(botTarget(30, 60_000, p, { wobble: 1 })).toBe(15);
  });
  it("trades toward the target in lots no larger than the gap", () => {
    const p = { ...personaFor(0, mulberry32(1)), wobbleProb: 0 };
    const o = decide(20, 3, 60_000, p, { wobble: 0 }, mulberry32(3));
    expect(o).not.toBeNull();
    expect(o?.side).toBe("buy");
    expect(o?.qty).toBe(1);
    expect(decide(16, 0, 60_000, p, { wobble: 0 }, mulberry32(3))).toBeNull();
  });
});
