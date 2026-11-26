import { sha256 } from "@noble/hashes/sha256";
import { Keypair } from "@solana/web3.js";

/** Seat keys derived from the burner: deterministic, never generated or stored, never printed. */
export function deriveBotKeypair(burner: Keypair, index: number): Keypair {
  const tag = new TextEncoder().encode(`hidden-hand-bot-${index}`);
  const buf = new Uint8Array(32 + tag.length);
  buf.set(burner.secretKey.slice(0, 32), 0);
  buf.set(tag, 32);
  return Keypair.fromSeed(sha256(buf));
}

export function keypairFromJson(json: string): Keypair {
  const parsed: unknown = JSON.parse(json);
  if (!Array.isArray(parsed) || parsed.length !== 64 || !parsed.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) {
    throw new Error("HH_BURNER_KEYPAIR_JSON must be a JSON array of 64 numbers");
  }
  return Keypair.fromSecretKey(Uint8Array.from(parsed as number[]));
}

export function parseDotEnv(text: string, name: string): string | null {
  for (const line of text.split(/\r?\n/)) {
    const i = line.indexOf("=");
    if (i > 0 && line.slice(0, i).trim() === name) {
      const value = line.slice(i + 1).trim();
      return value.length > 0 ? value : null;
    }
  }
  return null;
}
