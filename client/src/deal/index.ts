import type { DealMode } from "../config";
import { TeeDealAdapter } from "./tee";
import type { DealAdapter, SecretStore } from "./types";

export function memorySecretStore(): SecretStore {
  const m = new Map<string, Uint8Array>();
  return { get: (k) => m.get(k) ?? null, set: (k, v) => void m.set(k, v) };
}

export function createDealAdapter(mode: DealMode, store: SecretStore): DealAdapter {
  void store;
  if (mode === "tee") return new TeeDealAdapter();
  throw new Error(`deal mode "${mode}" is not built on this path (the fallback task client:21 adds commit-reveal)`);
}

export { TeeDealAdapter };
export type { DealAdapter, DealContext, SecretStore } from "./types";
