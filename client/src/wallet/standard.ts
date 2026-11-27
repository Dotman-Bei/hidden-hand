import { SolanaSignMessage, type SolanaSignMessageFeature, SolanaSignTransaction, type SolanaSignTransactionFeature } from "@solana/wallet-standard-features";
import type { IdentifierString, Wallet, WalletAccount } from "@wallet-standard/base";
import { StandardConnect, type StandardConnectFeature } from "@wallet-standard/features";
import { PublicKey, Transaction } from "@solana/web3.js";
import type { WalletSigner } from "./signer";

export const SOLANA_DEVNET_CHAIN: IdentifierString = "solana:devnet";

/** True when the wallet can connect, sign Solana transactions and sign messages: what wallet mode needs. */
export function isSolanaSigningWallet(w: Wallet): boolean {
  return StandardConnect in w.features && SolanaSignTransaction in w.features && SolanaSignMessage in w.features;
}

/** standard:connect (the wallet's connect popup); the first account it returns. */
export async function connectStandard(w: Wallet): Promise<WalletAccount> {
  const f = (w.features as unknown as StandardConnectFeature)[StandardConnect];
  const { accounts } = await f.connect();
  const account = accounts[0] ?? w.accounts[0];
  if (!account) throw new Error(`${w.name} returned no account`);
  return account;
}

/** A WalletSigner over a Wallet Standard wallet: signTransaction / signMessage popups, never signAndSend. */
export function standardSigner(w: Wallet, account: WalletAccount, chain: IdentifierString = SOLANA_DEVNET_CHAIN): WalletSigner {
  if (!isSolanaSigningWallet(w)) throw new Error(`${w.name} cannot sign Solana transactions and messages`);
  const st = (w.features as unknown as SolanaSignTransactionFeature)[SolanaSignTransaction];
  const sm = (w.features as unknown as SolanaSignMessageFeature)[SolanaSignMessage];
  return {
    publicKey: new PublicKey(Uint8Array.from(account.publicKey)),
    async signTransaction(tx) {
      const transaction = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
      const [out] = await st.signTransaction({ account, transaction, chain });
      if (!out) throw new Error(`${w.name} returned no signed transaction`);
      return Transaction.from(out.signedTransaction);
    },
    async signMessage(message) {
      const [out] = await sm.signMessage({ account, message });
      if (!out) throw new Error(`${w.name} returned no signature`);
      return Uint8Array.from(out.signature);
    },
  };
}
