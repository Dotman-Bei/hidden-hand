import type { IdlAccounts } from "@coral-xyz/anchor";
import { MAGIC_PROGRAM_ID, PERMISSION_PROGRAM_ID, permissionPdaFromAccount } from "@magicblock-labs/ephemeral-rollups-sdk";
import type { AccountInfo, Commitment, Connection, Keypair, PublicKey } from "@solana/web3.js";
import { EPHEMERAL_VAULT_ID, TEE_RPC, TEE_VALIDATOR } from "../config";
import { teeConnection } from "../conn";
import type { HiddenHand } from "../idl/hidden_hand";
import { handPda } from "../pda";
import { makeProgram } from "../program";
import { fetchTable, waitUntilOnEr } from "../round-base";
import { sendIxs } from "../tx";
import { isReadable, pollReadable, waitUntilReadable } from "./readable";
import type { DealAdapter, DealContext } from "./types";

type HandAccount = IdlAccounts<HiddenHand>["hand"];
export const READABLE_TIMEOUT_MS = 20_000;
export const READABLE_EVERY_MS = 400;

export class TeeDealAdapter implements DealAdapter {
  readonly mode = "tee" as const;
  readonly erRpc = TEE_RPC;
  readonly validator: PublicKey = TEE_VALIDATOR;
  private readonly conns = new Map<string, { connection: Connection; expiresAtMs: number }>();

  commitmentFor(): Uint8Array {
    return new Uint8Array(32);
  }

  async erConnection(identity: Keypair): Promise<Connection> {
    const key = identity.publicKey.toBase58();
    const hit = this.conns.get(key);
    if (hit && hit.expiresAtMs - Date.now() > 60_000) return hit.connection;
    const t = await teeConnection(identity);
    const expiresAtMs = t.expiresAt > 1e12 ? t.expiresAt : t.expiresAt * 1000;
    this.conns.set(key, { connection: t.connection, expiresAtMs });
    return t.connection;
  }

  async afterDelegate(ctx: DealContext): Promise<string[]> {
    const er = await this.erConnection(ctx.payer);
    const program = makeProgram(er, ctx.payer);
    const hands = ctx.seatOwners.map((o) => handPda(ctx.table, o));
    await waitUntilOnEr(er, ctx.table, 30_000);
    for (const h of hands) await waitUntilOnEr(er, h, 30_000);
    const common = {
      payer: ctx.payer.publicKey,
      permissionProgram: PERMISSION_PROGRAM_ID,
      ephemeralVault: EPHEMERAL_VAULT_ID,
      magicProgram: MAGIC_PROGRAM_ID,
    };
    const ixs = [
      await program.methods
        .createTablePermission()
        .accountsPartial({ table: ctx.table, permission: permissionPdaFromAccount(ctx.table), ...common })
        .instruction(),
    ];
    for (let i = 0; i < hands.length; i++) {
      ixs.push(
        await program.methods
          .createHandPermission(ctx.seatOwners[i])
          .accountsPartial({ table: ctx.table, hand: hands[i], permission: permissionPdaFromAccount(hands[i]), ...common })
          .instruction(),
      );
    }
    const sig = await sendIxs(er, ixs, ctx.payer);
    // Permission active = the owner reads its hand through its own authenticated TEE JSON-RPC connection.
    // (The SDK's permission-active waiter calls GET /permission, which the devnet TEE answers 404.)
    // Without seatKeys there is nothing to read as; readOwnHand polls the same way instead.
    if (ctx.seatKeys) {
      for (let i = 0; i < hands.length; i++) {
        const key = ctx.seatKeys.find((k) => k.publicKey.equals(ctx.seatOwners[i]));
        if (!key) continue;
        const ok = await waitUntilReadable(key, hands[i], READABLE_TIMEOUT_MS, READABLE_EVERY_MS);
        if (!ok) throw new Error(`permission not active: ${hands[i].toBase58()}`);
      }
    }
    return [sig];
  }

  async readOwnHand(ctx: DealContext, owner: Keypair): Promise<[number, number] | null> {
    const program = makeProgram(await this.erConnection(owner), owner);
    const address = handPda(ctx.table, owner.publicKey);
    const got: { hand?: HandAccount } = {};
    // Keep polling until the owner sees the DEALT hand: a missing, blurred / undecodable or not-yet-dealt read is a
    // miss (the first readable read used to end the poll even when it was the pre-deal state). Each attempt reads at
    // "confirmed" (as MagicBlock's private examples do) and, on a miss, again at "processed".
    const readAt = async (commitment: Commitment): Promise<AccountInfo<Buffer> | null> => {
      const i = await program.provider.connection.getAccountInfo(address, commitment);
      if (!isReadable(i)) return null;
      const hand = program.coder.accounts.decode<HandAccount>("Hand", i.data);
      if (!hand.dealt) return null;
      got.hand = hand;
      return i;
    };
    const info = await pollReadable(
      async () => (await readAt("confirmed").catch(() => null)) ?? (await readAt("processed")),
      READABLE_TIMEOUT_MS,
      READABLE_EVERY_MS,
    );
    const hand = got.hand;
    if (!info || !hand || !hand.dealt) return null;
    return [hand.cards[0], hand.cards[1]];
  }

  async reveal(ctx: DealContext): Promise<string[]> {
    const program = makeProgram(await this.erConnection(ctx.payer), ctx.payer);
    const view = await fetchTable(program, ctx.table);
    if (!view || view.phase !== "trading") return [];
    const h = view.seats.map((s) => s.hand);
    const ix = await program.methods
      .revealHands()
      .accountsPartial({
        table: ctx.table,
        hand0: h[0], hand1: h[1], hand2: h[2], hand3: h[3],
        permission0: permissionPdaFromAccount(h[0]),
        permission1: permissionPdaFromAccount(h[1]),
        permission2: permissionPdaFromAccount(h[2]),
        permission3: permissionPdaFromAccount(h[3]),
        payer: ctx.payer.publicKey,
        permissionProgram: PERMISSION_PROGRAM_ID,
        ephemeralVault: EPHEMERAL_VAULT_ID,
        magicProgram: MAGIC_PROGRAM_ID,
      })
      .instruction();
    return [await sendIxs(program.provider.connection, [ix], ctx.payer)];
  }
}
