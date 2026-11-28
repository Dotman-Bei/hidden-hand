import type { WalletPhase } from "@hidden-hand/bots/house";

export interface WalletUiInput {
  connected: boolean;
  wallets: string[];
  balance: number | null;
  needLamports: number | null;
  phase: WalletPhase | null;
  endTs: number | null;
  nowMs: number;
  error: string | null;
}
export type WalletUi =
  | { kind: "connect"; wallets: string[] }
  | { kind: "checking" }
  | { kind: "insufficient"; needLamports: number; haveLamports: number }
  | { kind: "ready"; needLamports: number; haveLamports: number }
  | { kind: "funding" }
  | { kind: "opening" }
  | { kind: "joining" }
  | { kind: "signing-in" }
  | { kind: "dealing" }
  | { kind: "trading"; secondsLeft: number }
  | { kind: "bell" }
  | { kind: "claim" }
  | { kind: "sweeping" }
  | { kind: "settled" }
  | { kind: "error"; message: string; retryable: boolean };

export function deriveWalletUi(i: WalletUiInput): WalletUi {
  if (i.error !== null || i.phase === "error") return { kind: "error", message: i.error ?? "The round stopped.", retryable: true };
  if (i.phase === null) {
    if (!i.connected) return { kind: "connect", wallets: i.wallets };
    if (i.balance === null || i.needLamports === null) return { kind: "checking" };
    return i.balance < i.needLamports
      ? { kind: "insufficient", needLamports: i.needLamports, haveLamports: i.balance }
      : { kind: "ready", needLamports: i.needLamports, haveLamports: i.balance };
  }
  switch (i.phase) {
    case "funding":
    case "opening":
    case "joining":
    case "signing-in":
      return { kind: i.phase };
    case "seating-bots":
    case "delegating":
    case "dealing":
      return { kind: "dealing" };
    case "trading": {
      const left = i.endTs === null ? 0 : Math.ceil(i.endTs - i.nowMs / 1000);
      return left > 0 ? { kind: "trading", secondsLeft: left } : { kind: "bell" };
    }
    case "bell":
    case "settling":
      return { kind: "bell" };
    case "claiming":
      return { kind: "claim" };
    case "sweeping":
      return { kind: "sweeping" };
    case "done":
      return { kind: "settled" };
  }
}

/** The copy for a wallet that refused a popup (tested on devnet, 2026-11-27: Solflare blocks Rollup trades, OKX the first popup). */
export const WALLET_CLOSED = "You closed the popup. No trade was sent.";
export const WALLET_BLOCKED =
  "Your wallet blocked this transaction. Rollup trades use the Private ER's own blockhash, which some wallets (tested: Solflare blocks it, OKX refuses the first popup) treat as mainnet. Phantom is the recommended wallet; or open Express mode.";
export const WALLET_COMPAT =
  "Tested on devnet: Solflare: connect, funding, join and sign-in work; Rollup trades are blocked by the wallet. OKX: blocked at the first popup. Phantom: full round works on devnet (connect, funding, join, sign-in, Rollup trades, reveal). Any Solana wallet is listed, but trades may not work in every wallet.";
const BLOCKED_RE = /mainnet|network mismatch|insufficient balance for network fee|not supported|rejected|did not answer/i;

/** A user Reject reads as closed; a network/blocked error as blocked; anything else keeps its own text. */
export function walletErrorText(text: string, userRejected: boolean, closed: string = WALLET_CLOSED): string {
  if (userRejected) return closed;
  return BLOCKED_RE.test(text) ? WALLET_BLOCKED : text;
}
