import type { Program } from "@coral-xyz/anchor";
import type { Connection, Keypair, PublicKey } from "@solana/web3.js";
import type { Side } from "./engine";
import type { HiddenHand } from "./idl/hidden_hand";
import { vaultPda } from "./pda";
import type { TableView } from "./round-base";
import { sendIxs } from "./tx";

export function sideCode(side: Side): number {
  return side === "buy" ? 0 : 1;
}

/** ER: one trade, signed by the seat's own key (zero fee, no wallet prompt). */
export async function sendTrade(er: Program<HiddenHand>, trader: Keypair, table: PublicKey, side: Side, qty: number): Promise<string> {
  const ix = await er.methods.trade(sideCode(side), qty).accountsPartial({ table, trader: trader.publicKey }).instruction();
  return sendIxs(er.provider.connection, [ix], trader);
}

/** ER: P&L + winner, then commit + undelegate the table and the four hands. */
export async function settleRound(er: Program<HiddenHand>, payer: Keypair, view: TableView): Promise<string> {
  const h = view.seats.map((s) => s.hand);
  const ix = await er.methods
    .settleRound()
    .accountsPartial({ payer: payer.publicKey, table: view.address, hand0: h[0], hand1: h[1], hand2: h[2], hand3: h[3] })
    .instruction();
  return sendIxs(er.provider.connection, [ix], payer);
}

/** Base layer, after the undelegation lands: pay the vault to the recorded winner. */
export async function claimPot(base: Program<HiddenHand>, payer: Keypair, view: TableView): Promise<string> {
  if (view.winner === null) throw new Error("table has no winner yet");
  const ix = await base.methods
    .claimPot()
    .accountsPartial({ table: view.address, vault: vaultPda(view.address), winner: view.seats[view.winner].owner, payer: payer.publicKey })
    .instruction();
  return sendIxs(base.provider.connection, [ix], payer);
}

/** Base-layer signatures on the table that this process did not send: the validator's commit/undelegate landings. */
export async function findCommitSignatures(base: Connection, table: PublicKey, known: string[]): Promise<string[]> {
  const sigs = await base.getSignaturesForAddress(table, { limit: 25 }, "confirmed");
  const mine = new Set(known);
  return sigs.filter((s) => !mine.has(s.signature) && s.err === null).map((s) => s.signature);
}
