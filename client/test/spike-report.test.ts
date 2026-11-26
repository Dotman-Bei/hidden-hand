import { describe, expect, it } from "vitest";
import { cuEntriesForTx, formatCuLines, formatSpikeResult, formatVersionLine, programInvocations } from "../src/spike-report";

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
  it("appends informational lines after every check line", () => {
    const out = formatSpikeResult(new Date(0), "P", [{ id: "a", pass: true, detail: "ok" }], ["- validator tee: 2.0.5 / feature-set=1", "- cu x: 5"]);
    const lines = out.split("\n");
    const lastCheck = Math.max(...["a", "b", "c", "f"].map((id) => lines.findIndex((l) => l.startsWith(`(${id}) `))));
    expect(lines.indexOf("- validator tee: 2.0.5 / feature-set=1")).toBeGreaterThan(lastCheck);
    expect(lines.indexOf("- cu x: 5")).toBeGreaterThan(lastCheck);
    expect(out).toMatch(/^\(a\) PASS/m);
  });
});

describe("validator and compute-unit lines", () => {
  const PID = "HHprog1111111111111111111111111111111111111";
  const logs = [
    "Program ComputeBudget111111111111111111111111111111 invoke [1]",
    "Program ComputeBudget111111111111111111111111111111 success",
    "Program Vrf1RNUjXmQGjmQrQLvJHs9SNkvDJEsRVFPkfSQUwGz invoke [1]",
    `Program ${PID} invoke [2]`,
    "Program log: Instruction: CallbackDeal",
    "Program 11111111111111111111111111111111 invoke [3]",
    "Program 11111111111111111111111111111111 success",
    `Program ${PID} consumed 123456 of 180000 compute units`,
    `Program ${PID} success`,
    "Program Vrf1RNUjXmQGjmQrQLvJHs9SNkvDJEsRVFPkfSQUwGz consumed 130000 of 200000 compute units",
    "Program Vrf1RNUjXmQGjmQrQLvJHs9SNkvDJEsRVFPkfSQUwGz success",
    `Program ${PID} invoke [1]`,
    "Program log: Instruction: RevealHands",
    `Program ${PID} consumed 4000 of 70000 compute units`,
    `Program ${PID} success`,
  ];

  it("parses the program's consumed lines with their instruction names", () => {
    expect(programInvocations(logs, PID)).toEqual([
      { name: "CallbackDeal", consumed: 123456, limit: 180000 },
      { name: "RevealHands", consumed: 4000, limit: 70000 },
    ]);
  });

  it("makes one entry per program instruction, or one per tx when the program is absent", () => {
    const e = cuEntriesForTx("oracle callback", { computeUnitsConsumed: 140000, logMessages: logs }, PID);
    expect(e.map((x) => x.label)).toEqual(["oracle callback CallbackDeal", "oracle callback RevealHands"]);
    expect(e[0].units).toBe(123456);
    expect(e[0].detail).toContain("tx total 140000");
    expect(cuEntriesForTx("fund", { computeUnitsConsumed: 150, logMessages: [] }, PID)).toEqual([{ label: "fund", units: 150, detail: "tx total" }]);
    expect(cuEntriesForTx("lost", null, PID)).toEqual([{ label: "lost", units: null, detail: "transaction not found" }]);
  });

  it("prints '- cu <label>: <units>' and flags anything at or over 100000", () => {
    const lines = formatCuLines([
      { label: "a", units: 99999 },
      { label: "b", units: 100000, detail: "of 200000" },
      { label: "c", units: null, detail: "transaction not found" },
    ]);
    expect(lines[0]).toBe("- cu a: 99999");
    expect(lines[1]).toBe("- cu b: 100000 OVER 100000 (of 200000)");
    expect(lines[2]).toBe("- cu c: unknown (transaction not found)");
  });

  it("formats a validator version, solana-core first", () => {
    expect(formatVersionLine("tee", { "feature-set": 42, "solana-core": "2.0.5", "magicblock-core": "0.3.1" })).toBe(
      "- validator tee: 2.0.5 / feature-set=42, magicblock-core=0.3.1",
    );
    expect(formatVersionLine("devnet-as", new Error("fetch failed"))).toBe("- validator devnet-as: unavailable (fetch failed)");
  });
});
