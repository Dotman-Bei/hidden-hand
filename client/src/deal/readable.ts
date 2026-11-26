import type { AccountInfo, Connection, Keypair, PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "../config";
import { teeConnection } from "../conn";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Readable = the account came back with non-empty data owned by the program (on the TEE: the permission lets this identity see it). */
export function isReadable(info: AccountInfo<Buffer> | null, programId: PublicKey = PROGRAM_ID): info is AccountInfo<Buffer> {
  return info !== null && info.data.length > 0 && info.owner.equals(programId);
}

/** Poll `read` until it returns a readable account (returned) or `timeoutMs` passes (null). A throwing read is a transient miss. */
export async function pollReadable(
  read: () => Promise<AccountInfo<Buffer> | null>,
  timeoutMs: number,
  everyMs: number,
  programId: PublicKey = PROGRAM_ID,
): Promise<AccountInfo<Buffer> | null> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const info = await read().catch(() => null);
    if (isReadable(info, programId)) return info;
    const left = deadline - Date.now();
    if (left <= 0) return null;
    await sleep(Math.min(everyMs, left));
  }
}

/**
 * True once `owner` can read `account` through its own authenticated TEE JSON-RPC connection (= its permission is active);
 * false on timeout. Never throws on a transient RPC error. Replaces the SDK's permission-active waiter, whose
 * `GET /permission` endpoint the devnet TEE does not serve.
 */
export async function waitUntilReadable(owner: Keypair, account: PublicKey, timeoutMs = 20_000, everyMs = 400): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  let conn: Connection | null = null;
  while (conn === null) {
    conn = await teeConnection(owner).then((t) => t.connection).catch(() => null);
    if (conn !== null) break;
    if (Date.now() >= deadline) return false;
    await sleep(everyMs);
  }
  const connection: Connection = conn;
  const info = await pollReadable(() => connection.getAccountInfo(account, "confirmed"), Math.max(0, deadline - Date.now()), everyMs);
  return info !== null;
}
