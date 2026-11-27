import { describe, expect, it } from "vitest";
import type { ProofData } from "../src/proof";
import { checkWalletProof, formatWalletProof, type WalletProofExtra } from "../src/wallet-proof";

const S = (c: string) => c.repeat(88);
const data: ProofData = {
  generatedAt: "2026-11-27T10:00:00.000Z", mode: "tee", programId: "HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb", table: "11111111111111111111111111111111",
  roundId: "1", validator: "MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo", erRpc: "https://devnet-tee.magicblock.app",
  base: { openTable: S("2"), joins: [S("3")], delegations: [S("4")], commitUndelegate: [S("5")], claimPot: S("6") },
  er: { setup: [S("7")], requestDeal: S("8"), trades: [S("9")], reveal: [S("A")], settle: S("B") },
  result: { hiddenSum: 60, closeC: 6100, winnerSeat: 0, winner: "11111111111111111111111111111111", pnlC: [1, 2, 3, 4], potLamports: 40_000_000, cards: [1, 2, 3, 4, 5, 6, 7, 8] },
};
const extra: WalletProofExtra = {
  wallet: "11111111111111111111111111111111", popups: { fund: 1, join: 1, signIn: 1, trades: 3, total: 6 }, walletTrades: [S("C"), S("D"), S("E")],
  delayedSign: { delayMs: 8000, landed: true, error: null }, budgetLamports: 110_000_000, spentLamports: 30_000_000, sweptLamports: 70_000_000,
};

describe("wallet proof", () => {
  it("formats a proof that checks", () => {
    const text = formatWalletProof(data, extra);
    expect(text.startsWith("# Devnet wallet-mode round proof")).toBe(true);
    expect(checkWalletProof(text)).toEqual({ ok: true, missing: [] });
  });
  it("records a failed delayed signature honestly and still checks", () => {
    const text = formatWalletProof(data, { ...extra, delayedSign: { delayMs: 8000, landed: false, error: "Blockhash not found" } });
    expect(text).toContain("- delayed signature (8000 ms before signing): failed: Blockhash not found");
    expect(checkWalletProof(text).ok).toBe(true);
  });
  it("fails without wallet trades", () => {
    const r = checkWalletProof(formatWalletProof(data, { ...extra, walletTrades: [], popups: { ...extra.popups, trades: 0, total: 3 } }));
    expect(r.ok).toBe(false);
    expect(r.missing).toContain("wallet trades");
  });
});
