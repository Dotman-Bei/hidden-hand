import { describe, expect, it } from "vitest";
import { type Connection, Keypair, type PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import nacl from "tweetnacl";
import {
  PROGRAM_ID, TEE_RPC, connectStandard, countingSigner, fundingIxs, isBlockhashExpired, isSolanaSigningWallet, isUserRejection,
  keypairSigner, mockStandardWallet, readonlyProgram, sendWithSigner, standardSigner, sweepLamports, teeConnectionForSigner, tradeWith,
} from "../src/index";

function stubConnection(err: unknown = null) {
  const sent: Uint8Array[] = [];
  const blockhash = Keypair.generate().publicKey.toBase58();
  const conn = {
    rpcEndpoint: "http://stub.invalid",
    getAccountInfo: async () => null,
    getLatestBlockhash: async () => ({ blockhash, lastValidBlockHeight: 1000 }),
    sendRawTransaction: async (raw: Uint8Array) => {
      sent.push(raw);
      return "STUBSIG";
    },
    confirmTransaction: async () => ({ context: { slot: 1 }, value: { err } }),
  } as unknown as Connection;
  return { conn, sent, blockhash };
}

describe("wallet signer layer", () => {
  it("keypairSigner signs messages verifiably", async () => {
    const kp = Keypair.generate();
    const m = new TextEncoder().encode("hello");
    const sig = await keypairSigner(kp).signMessage(m);
    expect(nacl.sign.detached.verify(m, sig, kp.publicKey.toBytes())).toBe(true);
  });

  it("the mock is a Solana-signing Wallet Standard wallet that connects to its keypair", async () => {
    const kp = Keypair.generate();
    const w = mockStandardWallet(kp);
    expect(isSolanaSigningWallet(w)).toBe(true);
    const account = await connectStandard(w);
    expect(account.address).toBe(kp.publicKey.toBase58());
  });

  it("standardSigner signs a transaction the keypair really signed, through solana:signTransaction", async () => {
    const kp = Keypair.generate();
    const w = mockStandardWallet(kp);
    const signer = standardSigner(w, await connectStandard(w));
    expect(signer.publicKey.equals(kp.publicKey)).toBe(true);
    const tx = new Transaction().add(SystemProgram.transfer({ fromPubkey: kp.publicKey, toPubkey: Keypair.generate().publicKey, lamports: 1 }));
    tx.feePayer = kp.publicKey;
    tx.recentBlockhash = Keypair.generate().publicKey.toBase58();
    const signed = await signer.signTransaction(tx);
    expect(signed.verifySignatures()).toBe(true);
    expect(signed.feePayer?.equals(kp.publicKey)).toBe(true);
  });

  it("standardSigner signs messages through solana:signMessage", async () => {
    const kp = Keypair.generate();
    const w = mockStandardWallet(kp);
    const signer = standardSigner(w, await connectStandard(w));
    const m = new TextEncoder().encode("challenge");
    expect(nacl.sign.detached.verify(m, await signer.signMessage(m), kp.publicKey.toBytes())).toBe(true);
  });

  it("standardSigner refuses a wallet without Solana signing features", async () => {
    const kp = Keypair.generate();
    const w = mockStandardWallet(kp);
    const bare = { ...w, features: { "standard:connect": w.features["standard:connect"] } };
    expect(isSolanaSigningWallet(bare)).toBe(false);
    expect(() => standardSigner(bare, w.accounts[0])).toThrow(/cannot sign/);
  });

  it("sendWithSigner: the wallet pays, the blockhash comes from the given connection, one popup, every signature valid", async () => {
    const kp = Keypair.generate();
    const extra = Keypair.generate();
    const { conn, sent, blockhash } = stubConnection();
    const popups: string[] = [];
    const w = mockStandardWallet(kp);
    const signer = countingSigner(standardSigner(w, await connectStandard(w)), (k) => popups.push(k));
    const a = SystemProgram.transfer({ fromPubkey: kp.publicKey, toPubkey: extra.publicKey, lamports: 1 });
    const b = SystemProgram.transfer({ fromPubkey: extra.publicKey, toPubkey: kp.publicKey, lamports: 1 });
    expect(await sendWithSigner(conn, [a, b], signer, [extra])).toBe("STUBSIG");
    expect(popups).toEqual(["transaction"]);
    const tx = Transaction.from(sent[0]);
    expect(tx.feePayer?.equals(kp.publicKey)).toBe(true);
    expect(tx.recentBlockhash).toBe(blockhash);
    expect(tx.signatures).toHaveLength(2);
    expect(tx.verifySignatures()).toBe(true);
  });

  it("sendWithSigner throws when the confirmation carries an error", async () => {
    const kp = Keypair.generate();
    const { conn } = stubConnection({ InstructionError: [0, "Custom"] });
    const ix = SystemProgram.transfer({ fromPubkey: kp.publicKey, toPubkey: Keypair.generate().publicKey, lamports: 1 });
    await expect(sendWithSigner(conn, [ix], keypairSigner(kp))).rejects.toThrow(/failed/);
  });

  it("a rejected popup throws and sends nothing", async () => {
    const kp = Keypair.generate();
    const { conn, sent } = stubConnection();
    const w = mockStandardWallet(kp, { reject: () => true });
    const signer = standardSigner(w, await connectStandard(w));
    const ix = SystemProgram.transfer({ fromPubkey: kp.publicKey, toPubkey: Keypair.generate().publicKey, lamports: 1 });
    const err = await sendWithSigner(conn, [ix], signer).catch((e: unknown) => e);
    expect(isUserRejection(err)).toBe(true);
    expect(sent).toHaveLength(0);
  });

  it("teeConnectionForSigner signs the challenge once with signMessage and puts the token on the TEE URL", async () => {
    const kp = Keypair.generate();
    const popups: string[] = [];
    const w = mockStandardWallet(kp);
    const signer = countingSigner(standardSigner(w, await connectStandard(w)), (k) => popups.push(k));
    const challenge = new TextEncoder().encode("hidden-hand-test-challenge");
    const fake = async (rpc: string, pk: PublicKey, sign: (m: Uint8Array) => Promise<Uint8Array>) => {
      expect(rpc).toBe(TEE_RPC);
      expect(pk.equals(kp.publicKey)).toBe(true);
      const sig = await sign(challenge);
      expect(nacl.sign.detached.verify(challenge, sig, kp.publicKey.toBytes())).toBe(true);
      return { token: "tok123", expiresAt: 1_900_000_000 };
    };
    const { connection, expiresAt } = await teeConnectionForSigner(signer, fake);
    expect(connection.rpcEndpoint).toBe(`${TEE_RPC}?token=tok123`);
    expect(expiresAt).toBe(1_900_000_000);
    expect(popups).toEqual(["message"]);
  });

  it("tradeWith sends one program trade ix with the wallet as signing trader", async () => {
    const kp = Keypair.generate();
    const { conn, sent } = stubConnection();
    const table = Keypair.generate().publicKey;
    await tradeWith(conn, keypairSigner(kp), table, "sell", 3);
    const tx = Transaction.from(sent[0]);
    expect(tx.instructions).toHaveLength(1);
    const ix = tx.instructions[0];
    expect(ix.programId.equals(PROGRAM_ID)).toBe(true);
    expect(ix.keys.some((k) => k.pubkey.equals(kp.publicKey) && k.isSigner)).toBe(true);
    expect(ix.keys.some((k) => k.pubkey.equals(table) && k.isWritable)).toBe(true);
    const expected = readonlyProgram(conn, kp.publicKey).coder.instruction.encode("trade", { side: 1, qty: 3 });
    expect(Buffer.from(ix.data).equals(Buffer.from(expected))).toBe(true);
  });

  it("fundingIxs skips zero amounts; sweepLamports leaves exactly the fee", () => {
    const from = Keypair.generate().publicKey;
    const ixs = fundingIxs(from, [{ to: Keypair.generate().publicKey, lamports: 5 }, { to: Keypair.generate().publicKey, lamports: 0 }]);
    expect(ixs).toHaveLength(1);
    expect(sweepLamports(1_000_000)).toBe(995_000);
    expect(sweepLamports(4_000)).toBe(0);
  });

  it("recognises expired-blockhash and user-rejection errors", () => {
    expect(isBlockhashExpired(new Error("Transaction simulation failed: Blockhash not found"))).toBe(true);
    expect(isBlockhashExpired(new Error("block height exceeded"))).toBe(true);
    expect(isBlockhashExpired(new Error("custom program error: 0x1770"))).toBe(false);
    expect(isUserRejection(new Error("User rejected the request."))).toBe(true);
    expect(isUserRejection(new Error("Blockhash not found"))).toBe(false);
  });
});
