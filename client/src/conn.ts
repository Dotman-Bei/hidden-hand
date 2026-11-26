import { getAuthToken } from "@magicblock-labs/ephemeral-rollups-sdk";
import { Connection, type Keypair } from "@solana/web3.js";
import nacl from "tweetnacl";
import { BASE_RPC, TEE_RPC } from "./config";

export function baseConnection(): Connection {
  return new Connection(BASE_RPC, "confirmed");
}

export function publicErConnection(rpc: string): Connection {
  return new Connection(rpc, { commitment: "confirmed", wsEndpoint: rpc.replace(/^http/, "ws") });
}

/** A TEE connection that reads as `identity` (its auth token decides which private accounts it sees). */
export async function teeConnection(identity: Keypair): Promise<{ connection: Connection; expiresAt: number }> {
  const auth = await getAuthToken(TEE_RPC, identity.publicKey, (message: Uint8Array) =>
    Promise.resolve(nacl.sign.detached(message, identity.secretKey)),
  );
  const url = `${TEE_RPC}?token=${auth.token}`;
  const ws = `${TEE_RPC.replace(/^http/, "ws")}?token=${auth.token}`;
  return { connection: new Connection(url, { commitment: "confirmed", wsEndpoint: ws }), expiresAt: auth.expiresAt };
}
