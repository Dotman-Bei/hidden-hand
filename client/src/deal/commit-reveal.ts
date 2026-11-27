import { sha256 } from "@noble/hashes/sha256";
import type { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { AS_RPC, AS_VALIDATOR } from "../config";
import { publicErConnection } from "../conn";
import { handPda } from "../pda";
import { makeProgram } from "../program";
import { fetchTable, waitUntilOnEr } from "../round-base";
import { sendIxs } from "../tx";
import type { DealAdapter, DealContext, SecretStore } from "./types";

const enc = new TextEncoder();
const concat = (...parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
};

export function commitmentOf(secret: Uint8Array): Uint8Array {
  return sha256(concat(enc.encode("hidden-hand-commit"), secret));
}

export function cardsForSeat(seed: Uint8Array, secret: Uint8Array, seat: number): [number, number] {
  const h = sha256(concat(enc.encode("hidden-hand-cards"), seed, secret, Uint8Array.of(seat)));
  return [1 + (h[0] % 15), 1 + (h[1] % 15)];
}

export class CrDealAdapter implements DealAdapter {
  readonly mode = "commit-reveal" as const;
  readonly erRpc = AS_RPC;
  readonly validator: PublicKey = AS_VALIDATOR;
  private readonly er: Connection = publicErConnection(AS_RPC);
  constructor(private readonly store: SecretStore) {}

  private key(table: PublicKey, owner: PublicKey): string {
    return `hh-secret:${table.toBase58()}:${owner.toBase58()}`;
  }

  commitmentFor(table: PublicKey, owner: PublicKey): Uint8Array {
    const k = this.key(table, owner);
    let secret = this.store.get(k);
    if (!secret) {
      secret = new Uint8Array(32);
      globalThis.crypto.getRandomValues(secret);
      this.store.set(k, secret);
    }
    return commitmentOf(secret);
  }

  async erConnection(): Promise<Connection> {
    return this.er;
  }

  async afterDelegate(ctx: DealContext): Promise<string[]> {
    await waitUntilOnEr(this.er, ctx.table, 30_000);
    for (const o of ctx.seatOwners) await waitUntilOnEr(this.er, handPda(ctx.table, o), 30_000);
    return [];
  }

  async readOwnHand(ctx: DealContext, owner: Keypair): Promise<[number, number] | null> {
    const secret = this.store.get(this.key(ctx.table, owner.publicKey));
    if (!secret) return null;
    const program = makeProgram(this.er, owner);
    const view = await fetchTable(program, ctx.table);
    if (!view || view.phase === "open" || view.phase === "dealing") return null;
    const raw = await program.account.table.fetch(ctx.table);
    const seat = view.seats.findIndex((s) => s.owner.equals(owner.publicKey));
    if (seat < 0) return null;
    return cardsForSeat(Uint8Array.from(raw.seed), secret, seat);
  }

  async reveal(ctx: DealContext, seatKeys: Keypair[]): Promise<string[]> {
    const sigs: string[] = [];
    for (const kp of seatKeys) {
      const program = makeProgram(this.er, kp);
      const view = await fetchTable(program, ctx.table);
      if (!view || view.phase !== "trading") continue;
      const seat = view.seats.findIndex((s) => s.owner.equals(kp.publicKey));
      if (seat < 0 || view.seats[seat].revealed) continue;
      const secret = this.store.get(this.key(ctx.table, kp.publicKey));
      if (!secret) throw new Error(`no stored secret for seat ${seat}`);
      const ix = await program.methods
        .revealSecret(Array.from(secret))
        .accountsPartial({ table: ctx.table, hand: handPda(ctx.table, kp.publicKey), owner: kp.publicKey })
        .instruction();
      sigs.push(await sendIxs(this.er, [ix], kp));
    }
    return sigs;
  }
}
