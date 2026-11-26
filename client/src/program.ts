import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { type Connection, type Keypair, Transaction, VersionedTransaction } from "@solana/web3.js";
import type { HiddenHand } from "./idl/hidden_hand";
import idl from "./idl/hidden_hand.json";

type ProviderWallet = ConstructorParameters<typeof AnchorProvider>[1];

export function keypairWallet(kp: Keypair): ProviderWallet {
  const sign = <T extends Transaction | VersionedTransaction>(tx: T): T => {
    if (tx instanceof VersionedTransaction) tx.sign([kp]);
    else tx.partialSign(kp);
    return tx;
  };
  return {
    publicKey: kp.publicKey,
    payer: kp,
    signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T) => sign(tx),
    signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]) => txs.map(sign),
  } as ProviderWallet;
}

export function makeProgram(connection: Connection, kp: Keypair): Program<HiddenHand> {
  const provider = new AnchorProvider(connection, keypairWallet(kp), { commitment: "confirmed" });
  return new Program<HiddenHand>(idl as unknown as HiddenHand, provider);
}
