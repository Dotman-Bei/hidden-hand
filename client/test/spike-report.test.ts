import { describe, expect, it } from "vitest";
import { formatSpikeResult } from "../src/spike-report";

describe("formatSpikeResult", () => {
  it("prints one line per check and the eligibility verdict", () => {
    const out = formatSpikeResult(new Date("2026-11-26T19:00:00Z"), "Prog1111", [
      { id: "c", pass: true, detail: "revealed" },
      { id: "a", pass: true, detail: "owner read [3,9]" },
      { id: "b", pass: true, detail: "dealt" },
      { id: "f", pass: false, detail: "timeout\nwaiting" },
    ]);
    const lines = out.split("\n");
    expect(lines.findIndex((l) => l.startsWith("(a) PASS"))).toBeLessThan(lines.findIndex((l) => l.startsWith("(b) PASS")));
    expect(out).toMatch(/^\(c\) PASS/m);
    expect(out).toMatch(/^\(f\) FAIL .*timeout waiting/m);
    expect(out).toContain("TEE path eligible: yes");
  });
  it("says to switch when any of (a)(b)(c) fails", () => {
    const out = formatSpikeResult(new Date(0), "P", [
      { id: "a", pass: false, detail: "denied" },
      { id: "b", pass: true, detail: "ok" },
      { id: "c", pass: true, detail: "ok" },
    ]);
    expect(out).toMatch(/^\(a\) FAIL .*denied/m);
    expect(out).toContain("TEE path eligible: no");
    expect(out).toMatch(/^\(f\) FAIL .*not run/m);
  });
});
