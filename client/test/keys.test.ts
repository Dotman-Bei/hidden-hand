import { Keypair } from "@solana/web3.js";
import { describe, expect, it } from "vitest";
import { deriveBotKeypair, keypairFromJson, parseDotEnv } from "../src/keys";

const burner = Keypair.fromSeed(new Uint8Array(32).fill(7));

describe("keys", () => {
  it("derives stable, distinct bot keys from the burner", () => {
    const a = deriveBotKeypair(burner, 0);
    expect(deriveBotKeypair(burner, 0).publicKey.equals(a.publicKey)).toBe(true);
    expect(deriveBotKeypair(burner, 1).publicKey.equals(a.publicKey)).toBe(false);
    expect(a.publicKey.equals(burner.publicKey)).toBe(false);
  });
  it("parses a 64-number keypair JSON and rejects anything else", () => {
    const kp = keypairFromJson(JSON.stringify(Array.from(burner.secretKey)));
    expect(kp.publicKey.equals(burner.publicKey)).toBe(true);
    expect(() => keypairFromJson("[1,2,3]")).toThrow(/64 numbers/);
    expect(() => keypairFromJson("not json")).toThrow();
  });
  it("reads one variable from .env text with CRLF line endings", () => {
    const text = "# c\r\nOTHER=1\r\nHH_BURNER_KEYPAIR_JSON=[1,2]\r\n";
    expect(parseDotEnv(text, "HH_BURNER_KEYPAIR_JSON")).toBe("[1,2]");
    expect(parseDotEnv(text, "MISSING")).toBeNull();
    expect(parseDotEnv("HH_BURNER_KEYPAIR_JSON=\n", "HH_BURNER_KEYPAIR_JSON")).toBeNull();
  });
});
