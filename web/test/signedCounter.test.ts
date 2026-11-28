import { Keypair } from "@solana/web3.js";
import { describe, expect, it } from "vitest";
import { connectStandard, mockStandardWallet, standardSigner } from "@hidden-hand/client";
import { signedCounter } from "../src/app/wallet/signedCounter";

describe("the popup counter", () => {
  it("counts a popup only when the wallet hands back a signature", async () => {
    let refuse = false;
    let asked = 0;
    const w = mockStandardWallet(Keypair.generate(), { onSign: () => (asked += 1), reject: () => refuse });
    let popups = 0;
    const s = signedCounter(standardSigner(w, await connectStandard(w)), () => (popups += 1));
    await s.signMessage(new TextEncoder().encode("one"));
    refuse = true;
    await expect(s.signMessage(new TextEncoder().encode("two"))).rejects.toThrow(/rejected/);
    refuse = false;
    await s.signMessage(new TextEncoder().encode("three"));
    expect(asked).toBe(3);
    expect(popups).toBe(2);
  });
});
