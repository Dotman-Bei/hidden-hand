// discover.ts — Wallet Standard discovery (any Wallet Standard wallet registers itself here).
import { getWallets } from "@wallet-standard/app";
import type { Wallet } from "@wallet-standard/base";
import { isSolanaSigningWallet } from "@hidden-hand/client";

export function solanaWallets(): Wallet[] {
  return getWallets().get().filter(isSolanaSigningWallet);
}
export function onWalletsChanged(cb: () => void): () => void {
  const { on } = getWallets();
  const a = on("register", cb);
  const b = on("unregister", cb);
  return () => {
    a();
    b();
  };
}
