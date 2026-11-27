import { describe, expect, it } from "vitest";
import { isStaleProgramError, retryStaleProgram, staleBackoffMs } from "../src/retry";
import { parseArgs } from "../src/runner";

/** A fake clock: sleep advances it instantly and records each wait. */
function fakeClock() {
  let t = 1_000_000;
  const waits: number[] = [];
  return {
    now: () => t,
    sleep: async (ms: number) => { waits.push(ms); t += ms; },
    waits,
  };
}

const modeNotSupported = () => new Error('Transaction 5x failed ({"err":{"InstructionError":[0,{"Custom":6006}]}})');

describe("isStaleProgramError", () => {
  it("matches ModeNotSupported (6006) and unknown-instruction errors", () => {
    expect(isStaleProgramError(modeNotSupported())).toBe(true);
    expect(isStaleProgramError(new Error("AnchorError: Error Code: ModeNotSupported. Error Number: 6006."))).toBe(true);
    expect(isStaleProgramError(new Error("failed: custom program error: 0x1776"))).toBe(true);
    expect(isStaleProgramError(new Error("Error Code: InstructionFallbackNotFound. Fallback functions are not supported."))).toBe(true);
    expect(isStaleProgramError(new Error('failed ({"err":{"InstructionError":[0,{"Custom":101}]}})'))).toBe(true);
    expect(isStaleProgramError(new Error("failed: custom program error: 0x65"))).toBe(true);
    expect(isStaleProgramError(Object.assign(new Error("Simulation failed"), { logs: ["Program log: AnchorError ... ModeNotSupported"] }))).toBe(true);
  });

  it("does not match anything else", () => {
    expect(isStaleProgramError(new Error('failed ({"err":{"InstructionError":[0,{"Custom":6001}]}})'))).toBe(false);
    expect(isStaleProgramError(new Error("failed: custom program error: 0x651"))).toBe(false);
    expect(isStaleProgramError(new Error("429 Too Many Requests"))).toBe(false);
    expect(isStaleProgramError(new Error("Blockhash not found"))).toBe(false);
    expect(isStaleProgramError("custom 61006")).toBe(false);
  });
});

describe("staleBackoffMs", () => {
  it("is 5 s, 10 s, 20 s, then capped at 30 s", () => {
    expect([1, 2, 3, 4, 5, 9].map(staleBackoffMs)).toEqual([5_000, 10_000, 20_000, 30_000, 30_000, 30_000]);
  });
});

describe("retryStaleProgram", () => {
  it("returns at once when the first try succeeds", async () => {
    const c = fakeClock();
    const logs: string[] = [];
    await expect(retryStaleProgram(async () => "sig", { now: c.now, sleep: c.sleep, log: (m) => logs.push(m) })).resolves.toBe("sig");
    expect(c.waits).toEqual([]);
    expect(logs).toEqual([]);
  });

  it("retries the stale-ER error with backoff and logs every retry, then succeeds", async () => {
    const c = fakeClock();
    const logs: string[] = [];
    let calls = 0;
    const got = await retryStaleProgram(async () => {
      calls++;
      if (calls <= 3) throw modeNotSupported();
      return "sig";
    }, { now: c.now, sleep: c.sleep, log: (m) => logs.push(m) });
    expect(got).toBe("sig");
    expect(calls).toBe(4);
    expect(c.waits).toEqual([5_000, 10_000, 20_000]);
    expect(logs).toHaveLength(3);
    expect(logs[0]).toMatch(/^ER has not refreshed the program yet \(attempt 1, 0s elapsed\): .*6006/);
    expect(logs[1]).toMatch(/^ER has not refreshed the program yet \(attempt 2, 5s elapsed\): /);
    expect(logs[2]).toMatch(/^ER has not refreshed the program yet \(attempt 3, 15s elapsed\): /);
  });

  it("fails immediately on any other error", async () => {
    const c = fakeClock();
    const logs: string[] = [];
    let calls = 0;
    await expect(retryStaleProgram(async () => {
      calls++;
      throw new Error("Blockhash not found");
    }, { now: c.now, sleep: c.sleep, log: (m) => logs.push(m) })).rejects.toThrow("Blockhash not found");
    expect(calls).toBe(1);
    expect(c.waits).toEqual([]);
    expect(logs).toEqual([]);
  });

  it("gives up after ~6 minutes with a clear message", async () => {
    const c = fakeClock();
    const logs: string[] = [];
    let calls = 0;
    const p = retryStaleProgram(async () => {
      calls++;
      throw modeNotSupported();
    }, { now: c.now, sleep: c.sleep, log: (m) => logs.push(m) });
    await expect(p).rejects.toThrow(/ER still runs the old program after \d+s \(\d+ attempts\).*6006/);
    const total = c.waits.reduce((a, b) => a + b, 0);
    expect(total).toBeLessThanOrEqual(360_000);
    expect(total).toBeGreaterThan(330_000);
    expect(calls).toBe(c.waits.length + 1);
    expect(logs).toHaveLength(c.waits.length);
  });
});

describe("parseArgs mode precedence", () => {
  it("--mode wins over the default", () => {
    expect(parseArgs(["--mode", "commit-reveal"]).mode).toBe("commit-reveal");
    expect(parseArgs(["--mode", "tee"]).mode).toBe("tee");
  });
});
