// sessionVault.ts — the in-tab house and bot keys: sessionStorage only (never localStorage), never sent anywhere.
import { type KeyVault, parseKeys, serializeKeys } from "@hidden-hand/bots/house";

const KEY = "hh-wallet-round-v1";
export function sessionVault(): KeyVault {
  return {
    load() {
      try {
        const raw = window.sessionStorage.getItem(KEY);
        return raw ? parseKeys(raw) : null;
      } catch {
        return null;
      }
    },
    save(k) {
      try {
        window.sessionStorage.setItem(KEY, serializeKeys(k));
      } catch {
        // storage blocked: the keys live in memory for this round only
      }
    },
    clear() {
      try {
        window.sessionStorage.removeItem(KEY);
      } catch {
        // nothing stored
      }
    },
  };
}
