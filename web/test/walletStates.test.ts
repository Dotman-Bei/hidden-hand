import { describe, expect, it } from "vitest";
import { playMode } from "../src/app/wallet/route";
import { WALLET_BLOCKED, WALLET_CLOSED, WALLET_COMPAT, deriveWalletUi, walletErrorText, type WalletUiInput } from "../src/app/wallet/walletStates";

const base: WalletUiInput = { connected: false, wallets: [], balance: null, needLamports: null, phase: null, endTs: null, nowMs: 1_000_000, error: null };

describe("playMode", () => {
  it("wallet mode is the default; a round link or ?mode=express is Express", () => {
    expect(playMode("")).toBe("wallet");
    expect(playMode("?foo=1")).toBe("wallet");
    expect(playMode("?round=1764230000000")).toBe("express");
    expect(playMode("?mode=express")).toBe("express");
    expect(playMode("?round=12&mode=tee")).toBe("express");
  });
});

describe("deriveWalletUi", () => {
  it("connect, checking, insufficient, ready", () => {
    expect(deriveWalletUi({ ...base, wallets: ["Phantom"] })).toEqual({ kind: "connect", wallets: ["Phantom"] });
    expect(deriveWalletUi({ ...base, connected: true })).toEqual({ kind: "checking" });
    expect(deriveWalletUi({ ...base, connected: true, balance: 5, needLamports: 10 })).toEqual({ kind: "insufficient", needLamports: 10, haveLamports: 5 });
    expect(deriveWalletUi({ ...base, connected: true, balance: 10, needLamports: 10 })).toEqual({ kind: "ready", needLamports: 10, haveLamports: 10 });
  });
  it("maps the round phases", () => {
    const at = (phase: WalletUiInput["phase"], endTs: number | null = null) => deriveWalletUi({ ...base, connected: true, balance: 1, needLamports: 1, phase, endTs }).kind;
    expect(at("funding")).toBe("funding");
    expect(at("opening")).toBe("opening");
    expect(at("joining")).toBe("joining");
    expect(at("signing-in")).toBe("signing-in");
    expect(at("seating-bots")).toBe("dealing");
    expect(at("delegating")).toBe("dealing");
    expect(at("dealing")).toBe("dealing");
    expect(at("trading", 1_030)).toBe("trading");
    expect(at("trading", 999)).toBe("bell");
    expect(at("bell")).toBe("bell");
    expect(at("settling")).toBe("bell");
    expect(at("claiming")).toBe("claim");
    expect(at("sweeping")).toBe("sweeping");
    expect(at("done")).toBe("settled");
  });
  it("trading carries the seconds left", () => {
    expect(deriveWalletUi({ ...base, connected: true, phase: "trading", endTs: 1_030 })).toEqual({ kind: "trading", secondsLeft: 30 });
  });
  it("an error wins and is retryable", () => {
    expect(deriveWalletUi({ ...base, connected: true, phase: "error", error: "boom" })).toEqual({ kind: "error", message: "boom", retryable: true });
  });
});

describe("WALLET_COMPAT", () => {
  it("carries the tested Phantom line, as recorded in docs/gates/wallet-manual-test.md", () => {
    expect(WALLET_COMPAT).toContain("Phantom: full round works on devnet (connect, funding, join, sign-in, Rollup trades, reveal).");
    expect(WALLET_COMPAT).not.toContain("not tested");
  });
});

describe("walletErrorText", () => {
  it("a Reject is closed; a mismatch, mainnet fee or silent wallet is blocked; other errors keep their text", () => {
    expect(walletErrorText("User rejected the request.", true)).toBe(WALLET_CLOSED);
    expect(walletErrorText("Network mismatch: this transaction is for mainnet", false)).toBe(WALLET_BLOCKED);
    expect(walletErrorText("Insufficient balance for network fee", false)).toBe(WALLET_BLOCKED);
    expect(walletErrorText("The wallet did not answer within 45 s", false)).toBe(WALLET_BLOCKED);
    expect(walletErrorText("account not found", false)).toBe("account not found");
  });
});
