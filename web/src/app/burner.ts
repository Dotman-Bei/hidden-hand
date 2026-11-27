import { Keypair } from "@solana/web3.js";

const KEY = "hidden-hand-seat-key-v1";

export function loadSeatKey(): Keypair {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw) as number[]));
  } catch {
    // storage blocked or corrupt: fall through to a session-only key
  }
  const kp = Keypair.generate();
  try {
    window.localStorage.setItem(KEY, JSON.stringify(Array.from(kp.secretKey)));
  } catch {
    // session-only key
  }
  return kp;
}
