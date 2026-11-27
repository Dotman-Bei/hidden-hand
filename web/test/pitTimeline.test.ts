import { describe, expect, it } from "vitest";
import { pitTimeline } from "../src/shared/pitTimeline";

describe("pitTimeline (the illustrative round)", () => {
  it("is deterministic and chronological", () => {
    const a = pitTimeline(7, 75_000);
    expect(pitTimeline(7, 75_000)).toEqual(a);
    for (let i = 1; i < a.events.length; i++) expect(a.events[i].tMs).toBeGreaterThanOrEqual(a.events[i - 1].tMs);
    expect(a.cards.length).toBe(8);
    expect(a.hiddenSum).toBe(a.cards.reduce((x, y) => x + y, 0));
  });
  it("closes near the hidden sum, like the real market (linear information market)", () => {
    let near = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const t = pitTimeline(seed, 75_000);
      if (Math.abs(t.closeC / 100 - t.hiddenSum) <= 4) near++;
    }
    expect(near / 200).toBeGreaterThanOrEqual(0.6);
  });
});
