import { type Connection, type Keypair, Transaction, type TransactionInstruction, sendAndConfirmTransaction } from "@solana/web3.js";

export async function sendIxs(
  connection: Connection,
  ixs: TransactionInstruction[],
  payer: Keypair,
  extraSigners: Keypair[] = [],
): Promise<string> {
  const tx = new Transaction().add(...ixs);
  tx.feePayer = payer.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
  return sendAndConfirmTransaction(connection, tx, [payer, ...extraSigners], { skipPreflight: true, commitment: "confirmed" });
}
