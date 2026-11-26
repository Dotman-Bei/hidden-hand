import type { Connection, Keypair, PublicKey } from "@solana/web3.js";
import type BN from "bn.js";
import type { DealMode } from "../config";

export interface SecretStore {
  get(key: string): Uint8Array | null;
  set(key: string, value: Uint8Array): void;
}

export interface DealContext {
  roundId: BN;
  table: PublicKey;
  seatOwners: PublicKey[];
  payer: Keypair;
}

export interface DealAdapter {
  readonly mode: DealMode;
  readonly erRpc: string;
  readonly validator: PublicKey;
  /** The 32-byte commitment a seat sends with join_table (TEE: all zeros). */
  commitmentFor(table: PublicKey, owner: PublicKey): Uint8Array;
  /** ER connection that reads and writes as `identity`. */
  erConnection(identity: Keypair): Promise<Connection>;
  /** ER setup once every PDA is delegated. Returns ER signatures. */
  afterDelegate(ctx: DealContext): Promise<string[]>;
  /** The owner's two cards once dealt, else null. */
  readOwnHand(ctx: DealContext, owner: Keypair): Promise<[number, number] | null>;
  /** The bell's reveal step for the seats this process controls. Returns ER signatures ([] when nothing to do). */
  reveal(ctx: DealContext, seatKeys: Keypair[]): Promise<string[]>;
}
