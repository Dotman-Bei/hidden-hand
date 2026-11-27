import type { Wallet, WalletAccount } from "@wallet-standard/base";
import { type Keypair, Transaction } from "@solana/web3.js";
import nacl from "tweetnacl";

export interface MockWalletOptions {
  name?: string;
  /** Called before each signature request (the popup a real wallet would show). */
  onSign?: (kind: "transaction" | "message") => void;
  /** Return true to reject that request the way a wallet does when the user clicks Cancel. */
  reject?: (kind: "transaction" | "message") => boolean;
}

const ICON = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiLz4=" as const;

/** A Wallet Standard wallet backed by a local keypair: the tests' and the integration script's stand-in for Phantom. */
export function mockStandardWallet(kp: Keypair, o: MockWalletOptions = {}): Wallet {
  const account: WalletAccount = {
    address: kp.publicKey.toBase58(),
    publicKey: kp.publicKey.toBytes(),
    chains: ["solana:devnet"],
    features: ["solana:signTransaction", "solana:signMessage"],
  };
  const gate = (kind: "transaction" | "message") => {
    o.onSign?.(kind);
    if (o.reject?.(kind)) throw new Error("User rejected the request.");
  };
  return {
    version: "1.0.0",
    name: o.name ?? "Mock Wallet",
    icon: ICON,
    chains: ["solana:devnet"],
    accounts: [account],
    features: {
      "standard:connect": { version: "1.0.0", connect: async () => ({ accounts: [account] }) },
      "standard:events": { version: "1.0.0", on: () => () => undefined },
      "solana:signTransaction": {
        version: "1.0.0",
        supportedTransactionVersions: ["legacy"],
        signTransaction: async (...inputs: { transaction: Uint8Array }[]) =>
          inputs.map((i) => {
            gate("transaction");
            const tx = Transaction.from(i.transaction);
            tx.partialSign(kp);
            return { signedTransaction: tx.serialize({ requireAllSignatures: false, verifySignatures: false }) };
          }),
      },
      "solana:signMessage": {
        version: "1.0.0",
        signMessage: async (...inputs: { message: Uint8Array }[]) =>
          inputs.map((i) => {
            gate("message");
            return { signedMessage: i.message, signature: nacl.sign.detached(i.message, kp.secretKey) };
          }),
      },
    },
  };
}
