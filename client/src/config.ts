import { PublicKey } from "@solana/web3.js";
import idl from "./idl/hidden_hand.json";

export type DealMode = "tee" | "commit-reveal";
export const DEFAULT_DEAL_MODE: DealMode = "tee";

export const PROGRAM_ID = new PublicKey(idl.address);
export const BASE_RPC = "https://api.devnet.solana.com";
export const TEE_RPC = "https://devnet-tee.magicblock.app";
export const TEE_VALIDATOR = new PublicKey("MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo");
export const AS_RPC = "https://devnet-as.magicblock.app";
export const AS_VALIDATOR = new PublicKey("MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57");
export const DEFAULT_EPHEMERAL_QUEUE = new PublicKey("5hBR571xnXppuCPveTrctfTU7tJLSN94nq7kv7FRK5Tc");
export const EPHEMERAL_VAULT_ID = new PublicKey("MagicVau1t999999999999999999999999999999999");

export const TABLE_SEED = "table";
export const HAND_SEED = "hand";
export const VAULT_SEED = "vault";
export const ENTRY_LAMPORTS = 10_000_000; // 0.01 devnet SOL per seat

export const explorerTx = (sig: string): string => `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
export const explorerAddress = (address: string): string => `https://explorer.solana.com/address/${address}?cluster=devnet`;
