import { Keypair } from "@solana/web3.js";
import BN from "bn.js";
import { describe, expect, it } from "vitest";
import { handPda, tablePda, vaultPda } from "../src/pda";

describe("pdas", () => {
  it("are deterministic per round and distinct across rounds", () => {
    expect(tablePda(new BN(1)).equals(tablePda(new BN(1)))).toBe(true);
    expect(tablePda(new BN(1)).equals(tablePda(new BN(2)))).toBe(false);
  });
  it("give every owner its own hand and the table one vault", () => {
    const t = tablePda(new BN(5));
    const a = Keypair.fromSeed(new Uint8Array(32).fill(1)).publicKey;
    const b = Keypair.fromSeed(new Uint8Array(32).fill(2)).publicKey;
    expect(handPda(t, a).equals(handPda(t, b))).toBe(false);
    expect(vaultPda(t).equals(t)).toBe(false);
  });
});
