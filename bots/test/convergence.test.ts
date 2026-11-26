import { describe, expect, it } from "vitest";
import { summarize } from "../src/sim";

describe("convergence (the money-shot gate)", () => {
  for (const [label, ms] of [["demo 75 s", 75_000], ["live 90 s", 90_000]] as const) {
    it(`${label}, four bots: close within 4 of the hidden sum in >= 60% of 1000 seeded deals`, () => {
      const s = summarize(1, 1000, ms, "bot");
      console.log(`${label}: within4=${(s.within4 * 100).toFixed(1)}% median=${s.medianAbsErr} p90=${s.p90AbsErr} doNothing=${s.medianDoNothing}`);
      expect(s.deals).toBe(1000);
      expect(s.within4).toBeGreaterThanOrEqual(0.6);
      expect(s.medianAbsErr).toBeLessThan(s.medianDoNothing);
    });
  }
});
