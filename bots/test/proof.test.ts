import { describe, expect, it } from "vitest";
import { type ProofData, checkProof, formatProof } from "../src/proof";

const sig = (c: string) => c.repeat(88);
const data: ProofData = {
  generatedAt: "2026-11-27T08:00:00.000Z", mode: "tee", programId: "HHprog1111111111111111111111111111111111111", table: "HHtable111111111111111111111111111111111111",
  roundId: "1764230400000", validator: "MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo", erRpc: "https://devnet-tee.magicblock.app",
  base: { openTable: sig("a"), joins: [sig("b")], delegations: [sig("c"), sig("d")], commitUndelegate: [sig("e")], claimPot: sig("f") },
  er: { setup: [sig("g")], requestDeal: sig("h"), trades: [sig("i")], reveal: [sig("j")], settle: sig("k") },
  result: { hiddenSum: 79, closeC: 7800, winnerSeat: 2, winner: "HHwin11111111111111111111111111111111111111", pnlC: [100, -50, 900, 0], potLamports: 40_000_000, cards: [9, 8, 12, 11, 7, 10, 14, 8] },
};

describe("proof", () => {
  it("formats a proof that passes its own check", () => {
    const text = formatProof(data);
    expect(text).toContain("| delegate_pda table |");
    expect(text).toContain("explorer.solana.com/tx/" + sig("c") + "?cluster=devnet");
    expect(text).toContain("- hidden sum: 79");
    expect(text).toContain("|close − sum| = 1.00");
    expect(checkProof(text)).toEqual({ ok: true, missing: [] });
  });
  it("flags a proof without base-layer commit/undelegate", () => {
    const text = formatProof({ ...data, base: { ...data.base, commitUndelegate: [] } });
    const r = checkProof(text);
    expect(r.ok).toBe(false);
    expect(r.missing).toContain("base commit/undelegate signature");
  });
});
