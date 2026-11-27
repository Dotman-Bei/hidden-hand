import { describe, expect, it } from "vitest";
import { deriveUiState } from "../src/app/states";

const base = { roundParam: "123", loading: false, error: null, nowMs: 100_000 };
describe("deriveUiState", () => {
  it("covers no-round, loading and error", () => {
    expect(deriveUiState({ ...base, roundParam: null, view: null }).kind).toBe("no-round");
    expect(deriveUiState({ ...base, loading: true, view: null }).kind).toBe("loading");
    expect(deriveUiState({ ...base, error: "rpc down", view: null })).toEqual({ kind: "error", message: "rpc down" });
  });
  it("waits for seats, then for the deal", () => {
    expect(deriveUiState({ ...base, view: { phase: "open", seatCount: 2, endTs: 0 } }).kind).toBe("waiting-for-seats");
    expect(deriveUiState({ ...base, view: { phase: "open", seatCount: 4, endTs: 0 } }).kind).toBe("waiting-for-deal");
    expect(deriveUiState({ ...base, view: { phase: "dealing", seatCount: 4, endTs: 0 } }).kind).toBe("waiting-for-deal");
  });
  it("trades until the bell, then waits for the reveal, then settles", () => {
    expect(deriveUiState({ ...base, view: { phase: "trading", seatCount: 4, endTs: 130 } })).toEqual({ kind: "trading", secondsLeft: 30 });
    expect(deriveUiState({ ...base, view: { phase: "trading", seatCount: 4, endTs: 90 } }).kind).toBe("bell");
    expect(deriveUiState({ ...base, view: { phase: "revealed", seatCount: 4, endTs: 90 } }).kind).toBe("revealed");
    expect(deriveUiState({ ...base, view: { phase: "settled", seatCount: 4, endTs: 90 } }).kind).toBe("settled");
  });
});
