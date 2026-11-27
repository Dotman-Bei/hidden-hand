import type BN from "bn.js";
import { Keypair, type PublicKey } from "@solana/web3.js";
import {
  ENTRY_LAMPORTS, TeeDealAdapter, baseConnection, claimPot, delegatePdas, fetchTable, findCommitSignatures, fundingIxs, joinTable,
  joinTableWith, makeProgram, openTable, requestDeal, sendTrade, sendWithSigner, settleRound, sweepTo, teeConnectionForSigner, waitForOwner,
} from "@hidden-hand/client";
import type { HouseIo } from "./house-round";
import { retryStaleProgram } from "./retry";

export function liveHouseIo(log: (m: string) => void = () => undefined): HouseIo {
  const base = baseConnection();
  const adapter = new TeeDealAdapter();
  const reader = makeProgram(base, Keypair.generate()); // reads and rent sizes only; never signs or funds
  const onBase = (kp: Keypair) => makeProgram(base, kp);
  const onEr = async (kp: Keypair) => makeProgram(await adapter.erConnection(kp), kp);
  return {
    rent: async () => ({
      tableRent: await base.getMinimumBalanceForRentExemption(reader.account.table.size),
      handRent: await base.getMinimumBalanceForRentExemption(reader.account.hand.size),
    }),
    balance: (who: PublicKey) => base.getBalance(who, "confirmed"),
    fund: (wallet, targets) => sendWithSigner(base, fundingIxs(wallet.publicKey, targets), wallet),
    openTable: (house, roundId: BN, secs) => openTable(onBase(house), house, roundId, "tee", secs, ENTRY_LAMPORTS),
    joinWallet: (wallet, table) => joinTableWith(base, wallet, table),
    signIn: async (wallet) => (await teeConnectionForSigner(wallet)).connection,
    joinBot: (house, bot, table) => joinTable(onBase(house), house, bot, table, adapter.commitmentFor()),
    baseTable: (table) => fetchTable(reader, table),
    delegate: (house, roundId, table, owners) => delegatePdas(onBase(house), house, roundId, table, owners, adapter.validator),
    afterDelegate: (ctx) => adapter.afterDelegate(ctx),
    requestDeal: async (house, table, seed) => {
      const er = await onEr(house);
      return retryStaleProgram(() => requestDeal(er, house, table, seed), { log });
    },
    erTable: async (house, table) => fetchTable(await onEr(house), table),
    readBotHand: (ctx, bot) => adapter.readOwnHand(ctx, bot),
    botTrade: async (bot, table, side, qty) => sendTrade(await onEr(bot), bot, table, side, qty),
    reveal: (ctx) => adapter.reveal(ctx),
    settle: async (house, view) => settleRound(await onEr(house), house, view),
    waitForOwner: (table, owner, ms) => waitForOwner(base, table, owner, ms),
    claim: (house, view) => claimPot(onBase(house), house, view),
    commitSignatures: (table, known) => findCommitSignatures(base, table, known),
    sweep: (from, to) => sweepTo(base, from, to),
    now: () => Date.now(),
    sleep: (ms) => new Promise<void>((r) => setTimeout(r, ms)),
  };
}
