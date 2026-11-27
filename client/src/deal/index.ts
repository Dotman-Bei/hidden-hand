import type { DealMode } from "../config";
import { CrDealAdapter } from "./commit-reveal";
import { TeeDealAdapter } from "./tee";
import type { DealAdapter, SecretStore } from "./types";

export function memorySecretStore(): SecretStore {
  const m = new Map<string, Uint8Array>();
  return { get: (k) => m.get(k) ?? null, set: (k, v) => void m.set(k, v) };
}

export function createDealAdapter(mode: DealMode, store: SecretStore): DealAdapter {
  if (mode === "tee") return new TeeDealAdapter();
  return new CrDealAdapter(store);
}

export { TeeDealAdapter };
export { isReadable, pollReadable, waitUntilReadable } from "./readable";
export type { DealAdapter, DealContext, SecretStore } from "./types";
export { CrDealAdapter, cardsForSeat, commitmentOf } from "./commit-reveal";
