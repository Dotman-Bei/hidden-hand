import type { Wallet } from "@wallet-standard/base";
import { useEffect, useState } from "react";
import { onWalletsChanged, solanaWallets } from "./discover";

/** Every Wallet Standard wallet that can sign Solana, now and as wallets register or leave. */
export function useDetectedWallets(): Wallet[] {
  const [found, setFound] = useState<Wallet[]>(() => solanaWallets());
  useEffect(() => {
    const refresh = () => setFound(solanaWallets());
    refresh();
    return onWalletsChanged(refresh);
  }, []);
  return found;
}
