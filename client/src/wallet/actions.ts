import { type Commitment, type Connection, type Keypair, type PublicKey, SystemProgram, type TransactionInstruction } from "@solana/web3.js";
import { decodeHand, READABLE_EVERY_MS, READABLE_TIMEOUT_MS } from "../deal/tee";
import { isReadable, pollReadable } from "../deal/readable";
import type { Side } from "../engine";
import { handPda, vaultPda } from "../pda";
import { sideCode } from "../round-play";
import { sendIxs } from "../tx";
import { readonlyProgram, sendWithSigner, type WalletSigner } from "./signer";

export const SIGNATURE_FEE_LAMPORTS = 5000;

/** Base layer: the wallet takes a seat (one popup). TEE deal: the commitment is 32 zero bytes. The wallet pays entry + hand rent. */
export async function joinTableWith(base: Connection, signer: WalletSigner, table: PublicKey): Promise<string> {
  const ix = await readonlyProgram(base, signer.publicKey)
    .methods.joinTable(Array.from(new Uint8Array(32)))
    .accountsPartial({ table, hand: handPda(table, signer.publicKey), vault: vaultPda(table), player: signer.publicKey })
    .instruction();
  return sendWithSigner(base, [ix], signer);
}

/** ER (the wallet's own TEE connection): one trade, one popup, zero fee. */
export async function tradeWith(er: Connection, signer: WalletSigner, table: PublicKey, side: Side, qty: number): Promise<string> {
  const ix = await readonlyProgram(er, signer.publicKey)
    .methods.trade(sideCode(side), qty)
    .accountsPartial({ table, trader: signer.publicKey })
    .instruction();
  return sendWithSigner(er, [ix], signer);
}

/** The owner's dealt cards, read through a TEE connection authorized as the owner; null on timeout. */
export async function readHandAs(er: Connection, table: PublicKey, owner: PublicKey, timeoutMs = READABLE_TIMEOUT_MS): Promise<[number, number] | null> {
  const program = readonlyProgram(er, owner);
  const address = handPda(table, owner);
  const got: { cards?: [number, number] } = {};
  const readAt = async (c: Commitment) => {
    const info = await er.getAccountInfo(address, c);
    if (!isReadable(info)) return null;
    const hand = decodeHand(program.coder, info.data);
    if (!hand.dealt) return null;
    got.cards = [hand.cards[0], hand.cards[1]];
    return info;
  };
  await pollReadable(async () => (await readAt("confirmed").catch(() => null)) ?? (await readAt("processed")), timeoutMs, READABLE_EVERY_MS);
  return got.cards ?? null;
}

export function fundingIxs(from: PublicKey, targets: { to: PublicKey; lamports: number }[]): TransactionInstruction[] {
  return targets.filter((t) => t.lamports > 0).map((t) => SystemProgram.transfer({ fromPubkey: from, toPubkey: t.to, lamports: t.lamports }));
}

export function sweepLamports(balance: number): number {
  return Math.max(0, balance - SIGNATURE_FEE_LAMPORTS);
}

/** Base layer: send everything but the fee from an in-tab key back to `to`. */
export async function sweepTo(base: Connection, from: Keypair, to: PublicKey): Promise<{ sig: string | null; lamports: number }> {
  const lamports = sweepLamports(await base.getBalance(from.publicKey, "confirmed"));
  if (lamports === 0) return { sig: null, lamports: 0 };
  const sig = await sendIxs(base, [SystemProgram.transfer({ fromPubkey: from.publicKey, toPubkey: to, lamports })], from);
  return { sig, lamports };
}

const text = (e: unknown): string => (e instanceof Error ? e.message : String(e));
export function isBlockhashExpired(e: unknown): boolean {
  return /blockhash not found|BlockhashNotFound|block height exceeded|TransactionExpired/i.test(text(e));
}
export function isUserRejection(e: unknown): boolean {
  return /user rejected|rejected the request|request rejected|user denied|\b4001\b/i.test(text(e));
}
