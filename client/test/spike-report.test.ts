import { describe, expect, it } from "vitest";
import {
  compressAttempts,
  cuEntriesForTx,
  describeAccountRead,
  findPermissionMember,
  formatCuLines,
  formatSpikeResult,
  formatVersionLine,
  handDataLines,
  hexAll,
  memberFlagNames,
  programInvocations,
} from "../src/spike-report";

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

describe("(a) diagnostics", () => {
  const owner = { toBase58: () => "HHprog" };

  it("puts the diagnostics section after the informational one, check lines first", () => {
    const out = formatSpikeResult(new Date(0), "P", [{ id: "a", pass: false, detail: "owner read returned null" }], ["- cu x: 5"], ["- owner read #1 (t+0 ms) x1: null"]);
    const lines = out.split("\n");
    expect(out).toMatch(/^\(a\) FAIL/m);
    expect(lines.indexOf("## (a) diagnostics")).toBeGreaterThan(lines.indexOf("## Informational"));
    expect(lines.indexOf("- owner read #1 (t+0 ms) x1: null")).toBeGreaterThan(lines.indexOf("## (a) diagnostics"));
    expect(formatSpikeResult(new Date(0), "P", [], ["- cu x: 5"])).not.toContain("## (a) diagnostics");
  });

  it("describes a raw read: null, error, or lamports/owner/len/head/dealt", () => {
    expect(describeAccountRead(null)).toBe("null");
    expect(describeAccountRead(new Error("401\nUnauthorized"))).toBe("error: 401 Unauthorized");
    const data = Uint8Array.from({ length: 20 }, (_, i) => i);
    expect(describeAccountRead({ lamports: 7, owner, data }, true)).toBe("lamports=7 owner=HHprog len=20 head=000102030405060708090a0b0c0d0e0f dealt=true");
    expect(describeAccountRead({ lamports: 7, owner, data: new Uint8Array(0) }, "undecodable")).toBe("lamports=7 owner=HHprog len=0 head= dealt=undecodable");
    expect(describeAccountRead({ lamports: 1, owner, data: new Uint8Array(2) })).toBe("lamports=1 owner=HHprog len=2 head=0000");
  });

  it("collapses runs of identical attempts into one line each, keeping order", () => {
    const lines = compressAttempts("owner read", [
      { atMs: 0, result: "null" },
      { atMs: 400, result: "null" },
      { atMs: 800, result: "null" },
      { atMs: 1200, result: "error: 429" },
      { atMs: 1600, result: "null" },
    ]);
    expect(lines).toEqual([
      "- owner read #1-3 (t+0..800 ms) x3: null",
      "- owner read #4 (t+1200 ms) x1: error: 429",
      "- owner read #5 (t+1600 ms) x1: null",
    ]);
    expect(compressAttempts("x", [])).toEqual(["- x: no attempts"]);
  });

  it("finds a member pubkey and names its flags in permission data", () => {
    const member = Uint8Array.from({ length: 32 }, (_, i) => 200 + (i % 50));
    const data = new Uint8Array(40 + 32);
    data[39] = 0x03;
    data.set(member, 40);
    expect(findPermissionMember(data, member)).toBe("member found at byte 40, flags=0x03 (AUTHORITY|TX_LOGS)");
    expect(findPermissionMember(new Uint8Array(40), member)).toBe("member not found (len 40, bytes 34..39=0000000000)");
    expect(memberFlagNames(0)).toBe("none");
    expect(memberFlagNames(0x1e)).toBe("TX_LOGS|TX_BALANCES|TX_MESSAGE|ACCOUNT_SIGNATURES");
  });

  it("dumps the full hand data as hex and the exact decoder error text", () => {
    const data = Uint8Array.from({ length: 76 }, (_, i) => i);
    const hex = hexAll(data);
    expect(hex).toHaveLength(152);
    expect(hex.startsWith("000102")).toBe(true);
    expect(hex.endsWith("4a4b")).toBe(true);
    expect(handDataLines("owner", { lamports: 7, owner, data }, new Error("Invalid bool: 2"))).toEqual([
      `- owner hand full data (len=76): ${hex}`,
      "- owner hand decode error: Invalid bool: 2",
    ]);
    expect(handDataLines("owner", { lamports: 7, owner, data }, null)).toEqual([`- owner hand full data (len=76): ${hex}`, "- owner hand decode: ok"]);
    expect(handDataLines("stranger", null, null)).toEqual(["- stranger hand full data: null"]);
    expect(handDataLines("stranger", new Error("401\nUnauthorized"), null)).toEqual(["- stranger hand full data: error: 401 Unauthorized"]);
    expect(handDataLines("owner", { lamports: 1, owner, data: new Uint8Array(1) }, "not an Error")).toEqual([
      "- owner hand full data (len=1): 00",
      "- owner hand decode error: not an Error",
    ]);
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
