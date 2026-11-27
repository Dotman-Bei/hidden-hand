import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { getAuthToken } from "@magicblock-labs/ephemeral-rollups-sdk";
import { Connection, type Keypair, type PublicKey, Transaction, type TransactionInstruction } from "@solana/web3.js";
import nacl from "tweetnacl";
import { TEE_RPC } from "../config";
import type { HiddenHand } from "../idl/hidden_hand";
import idl from "../idl/hidden_hand.json";

/** The one shape the app signs with: a real wallet (Wallet Standard), the mock, or a local keypair. */
export interface WalletSigner {
  readonly publicKey: PublicKey;
  signTransaction(tx: Transaction): Promise<Transaction>;
  signMessage(message: Uint8Array): Promise<Uint8Array>;
}

export function keypairSigner(kp: Keypair): WalletSigner {
  return {
    publicKey: kp.publicKey,
    signTransaction: async (tx) => {
      tx.partialSign(kp);
      return tx;
    },
    signMessage: async (m) => nacl.sign.detached(m, kp.secretKey),
  };
}

/** Calls onPopup before every signature the wrapped signer is asked for (the UI's popup counter). */
export function countingSigner(s: WalletSigner, onPopup: (kind: "transaction" | "message") => void): WalletSigner {
  return {
    publicKey: s.publicKey,
    signTransaction: (tx) => {
      onPopup("transaction");
      return s.signTransaction(tx);
    },
    signMessage: (m) => {
      onPopup("message");
      return s.signMessage(m);
    },
  };
}

type ProviderWallet = ConstructorParameters<typeof AnchorProvider>[1];

/** A Program that only builds instructions and reads accounts; it never signs. */
export function readonlyProgram(connection: Connection, publicKey: PublicKey): Program<HiddenHand> {
  const refuse = () => Promise.reject(new Error("readonlyProgram never signs"));
  const wallet = { publicKey, signTransaction: refuse, signAllTransactions: refuse } as unknown as ProviderWallet;
  return new Program<HiddenHand>(idl as unknown as HiddenHand, new AnchorProvider(connection, wallet, { commitment: "confirmed" }));
}

/**
 * Build, sign with the wallet (one popup), then with any local keys, and send on `connection` (base or the TEE).
 * Mirrors sendIxs: the blockhash comes from the same connection right before the popup, skipPreflight, confirm by signature.
 */
export async function sendWithSigner(
  connection: Connection,
  ixs: TransactionInstruction[],
  signer: WalletSigner,
  extraSigners: Keypair[] = [],
): Promise<string> {
  const tx = new Transaction().add(...ixs);
  tx.feePayer = signer.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
  const signed = await signer.signTransaction(tx);
  for (const k of extraSigners) signed.partialSign(k);
  const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: true });
  const res = await connection.confirmTransaction(sig, "confirmed");
  if (res.value.err) throw new Error(`transaction ${sig} failed: ${JSON.stringify(res.value.err)}`);
  return sig;
}

export type AuthTokenFn = (
  rpcUrl: string,
  publicKey: PublicKey,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>,
) => Promise<{ token: string; expiresAt: number }>;

/** A TEE connection that reads and writes as the signer: one signMessage popup for the auth token. */
export async function teeConnectionForSigner(
  signer: WalletSigner,
  getToken: AuthTokenFn = getAuthToken,
): Promise<{ connection: Connection; expiresAt: number }> {
  const auth = await getToken(TEE_RPC, signer.publicKey, (m) => signer.signMessage(m));
  const url = `${TEE_RPC}?token=${auth.token}`;
  const ws = `${TEE_RPC.replace(/^http/, "ws")}?token=${auth.token}`;
  return { connection: new Connection(url, { commitment: "confirmed", wsEndpoint: ws }), expiresAt: auth.expiresAt };
}
