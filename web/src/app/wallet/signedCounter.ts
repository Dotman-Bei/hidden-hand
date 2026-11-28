import type { WalletSigner } from "@hidden-hand/client";

/** Counts a popup only when the wallet hands back a signature (a refused or closed popup is not counted). */
export function signedCounter(s: WalletSigner, onSigned: () => void): WalletSigner {
  return {
    publicKey: s.publicKey,
    signTransaction: async (tx) => {
      const out = await s.signTransaction(tx);
      onSigned();
      return out;
    },
    signMessage: async (m) => {
      const out = await s.signMessage(m);
      onSigned();
      return out;
    },
  };
}
