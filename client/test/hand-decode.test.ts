import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { describe, expect, it } from "vitest";
import { HAND_ACCOUNT, decodeHand } from "../src/deal/tee";
import { makeProgram } from "../src/program";

// The owner's real TEE read of a dealt Hand (devnet, spike diagnostic #2): 8-byte discriminator, table, owner,
// seat u8, cards [u8; 2], dealt bool = 76 bytes.
const HAND_HEX =
  "33386598c4c768f29adcd689d487a1b59445ac3e5b90ae7ad9d12c3d1dfa56e12896a90947e0ff380080624a8f71cb3b98e3dac8903cecebfadf481c6633b0cf7d97aea8eba4474d00070801";

// Offline: the connection is never used, makeProgram only needs it to build the provider.
const program = () => makeProgram(new Connection("http://127.0.0.1:8899"), Keypair.fromSeed(new Uint8Array(32).fill(9)));

describe("decodeHand", () => {
  it("decodes the captured 76-byte owner read with the program's own coder", () => {
    const data = Buffer.from(HAND_HEX, "hex");
    expect(data.length).toBe(76);
    const hand = decodeHand(program().coder, data);
    expect({ seat: hand.seat, cards: Array.from(hand.cards), dealt: hand.dealt }).toEqual({ seat: 0, cards: [7, 8], dealt: true });
    expect(hand.table.equals(new PublicKey(data.subarray(8, 40)))).toBe(true);
    expect(hand.owner.equals(new PublicKey(data.subarray(40, 72)))).toBe(true);
  });

  it("uses an account name the coder actually knows (the IDL's PascalCase name is not it)", () => {
    const coder = program().coder;
    expect(() => coder.accounts.decode("Hand", Buffer.from(HAND_HEX, "hex"))).toThrow(/Account not found: Hand/);
    expect(HAND_ACCOUNT).toBe("hand");
  });

  it("rejects data with the wrong discriminator", () => {
    const bad = Buffer.from(HAND_HEX, "hex");
    bad[0] ^= 0xff;
    expect(() => decodeHand(program().coder, bad)).toThrow(/discriminator/);
  });
});
