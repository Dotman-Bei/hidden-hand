import { type AccountInfo, Keypair, PublicKey } from "@solana/web3.js";
import { describe, expect, it } from "vitest";
import { isReadable, pollReadable } from "../src/deal/readable";

const PROG = Keypair.fromSeed(new Uint8Array(32).fill(3)).publicKey;
const info = (owner: PublicKey, len: number): AccountInfo<Buffer> => ({
  data: Buffer.alloc(len, 1), executable: false, lamports: 1, owner, rentEpoch: 0,
});

describe("isReadable", () => {
  it("needs non-empty data owned by the program", () => {
    expect(isReadable(info(PROG, 8), PROG)).toBe(true);
    expect(isReadable(info(PROG, 0), PROG)).toBe(false);
    expect(isReadable(info(PublicKey.default, 8), PROG)).toBe(false);
    expect(isReadable(null, PROG)).toBe(false);
  });
});

describe("pollReadable", () => {
  it("keeps polling through nulls and transient errors until the account is readable", async () => {
    let calls = 0;
    const got = await pollReadable(async () => {
      calls++;
      if (calls === 1) return null;
      if (calls === 2) throw new Error("429 Too Many Requests");
      if (calls === 3) return info(PublicKey.default, 8);
      return info(PROG, 16);
    }, 2_000, 1, PROG);
    expect(calls).toBe(4);
    expect(got?.data.length).toBe(16);
  });
  it("returns null on timeout without throwing", async () => {
    let calls = 0;
    const t0 = Date.now();
    const got = await pollReadable(async () => {
      calls++;
      throw new Error("down");
    }, 60, 5, PROG);
    expect(got).toBeNull();
    expect(calls).toBeGreaterThan(1);
    expect(Date.now() - t0).toBeGreaterThanOrEqual(55);
  });
  it("returns null on timeout when the data stays empty", async () => {
    expect(await pollReadable(async () => info(PROG, 0), 30, 5, PROG)).toBeNull();
  });
});
