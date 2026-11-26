import { PublicKey } from "@solana/web3.js";
import type BN from "bn.js";
import { HAND_SEED, PROGRAM_ID, TABLE_SEED, VAULT_SEED } from "./config";

export function roundIdBytes(roundId: BN): Buffer {
  return roundId.toArrayLike(Buffer, "le", 8);
}
export function tablePda(roundId: BN, programId: PublicKey = PROGRAM_ID): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from(TABLE_SEED), roundIdBytes(roundId)], programId)[0];
}
export function handPda(table: PublicKey, owner: PublicKey, programId: PublicKey = PROGRAM_ID): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from(HAND_SEED), table.toBuffer(), owner.toBuffer()], programId)[0];
}
export function vaultPda(table: PublicKey, programId: PublicKey = PROGRAM_ID): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from(VAULT_SEED), table.toBuffer()], programId)[0];
}
