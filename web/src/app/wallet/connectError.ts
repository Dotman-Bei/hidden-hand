import { isUserRejection } from "@hidden-hand/client";
import { walletErrorText } from "./walletStates";

export const CONNECT_CLOSED = "You closed the wallet popup, so no wallet was connected.";

const text = (e: unknown): string => {
  const t = e instanceof Error ? e.message : String(e);
  return t.length > 200 ? `${t.slice(0, 200)}…` : t;
};

/** The words the connect modal shows for a failed or refused connect popup. */
export function connectErrorText(e: unknown): string {
  return walletErrorText(text(e), isUserRejection(e), CONNECT_CLOSED);
}
