import { describe, expect, it } from "vitest";
import type BN from "bn.js";
import { type Connection, Keypair, type PublicKey } from "@solana/web3.js";
import { ENTRY_LAMPORTS, handPda, keypairSigner, tablePda, type TableView } from "@hidden-hand/client";
import {
  type HouseIo, InsufficientFundsError, type WalletPhase, memoryVault, newHouseKeys, parseKeys, runWalletRound, serializeKeys, walletRoundBudget,
} from "../src/house-round";

const RENT = { tableRent: 5_000_000, handRent: 1_500_000 };

function fakeIo(o: { balance?: number; failAt?: string } = {}) {
  const calls: string[] = [];
  const funded: number[] = [];
  let t = 1_800_000_000_000;
  let v: TableView | null = null;
  const owners: PublicKey[] = [];
  const step = (name: string) => {
    calls.push(name);
    if (o.failAt === name) throw new Error(`boom at ${name}`);
  };
  const view = (): TableView => {
    if (!v) throw new Error("no table");
    return { ...v, seats: v.seats.map((s) => ({ ...s })) };
  };
  const io: HouseIo = {
    rent: async () => RENT,
    balance: async () => o.balance ?? 1_000_000_000,
    fund: async (_w, targets) => {
      step("fund");
      funded.push(...targets.map((x) => x.lamports));
      return "sig-fund";
    },
    openTable: async (house, roundId: BN, secs) => {
      step("open");
      v = {
        address: tablePda(roundId), roundId, authority: house.publicKey, mode: "tee", phase: "open", durationSecs: secs,
        entryLamports: ENTRY_LAMPORTS, seatCount: 0, seats: [], priceC: 6400, startTs: 0, endTs: 0, cards: [], hiddenSum: 0,
        winner: null, pnlC: [0, 0, 0, 0], paid: false, tradeCount: 0, trades: [],
      };
      return "sig-open";
    },
    joinWallet: async (wallet, table) => {
      step("joinWallet");
      owners.push(wallet.publicKey);
      v = { ...view(), seatCount: owners.length, seats: owners.map((ow) => ({ owner: ow, hand: handPda(table, ow), cashC: 0, pos: 0, revealed: false })) };
      return "sig-join-wallet";
    },
    signIn: async () => {
      step("signIn");
      return { rpcEndpoint: "tee-as-wallet" } as unknown as Connection;
    },
    joinBot: async (_h, bot, table) => {
      step("joinBot");
      owners.push(bot.publicKey);
      v = { ...view(), seatCount: owners.length, seats: owners.map((ow) => ({ owner: ow, hand: handPda(table, ow), cashC: 0, pos: 0, revealed: false })) };
      return `sig-join-${owners.length}`;
    },
    baseTable: async () => view(),
    delegate: async () => {
      step("delegate");
      return ["sig-del-table", "sig-del-0", "sig-del-1", "sig-del-2", "sig-del-3"];
    },
    afterDelegate: async () => {
      step("afterDelegate");
      return ["sig-perm"];
    },
    requestDeal: async () => {
      step("requestDeal");
      const start = Math.floor(t / 1000);
      v = { ...view(), phase: "trading", startTs: start, endTs: start + view().durationSecs };
      return "sig-deal";
    },
    erTable: async () => view(),
    readBotHand: async () => [14, 15],
    botTrade: async () => {
      calls.push("botTrade");
      return `sig-trade-${calls.length}`;
    },
    reveal: async () => {
      step("reveal");
      v = { ...view(), phase: "revealed", cards: [1, 2, 3, 4, 5, 6, 7, 8], hiddenSum: 36 };
      return ["sig-reveal"];
    },
    settle: async () => {
      step("settle");
      v = { ...view(), phase: "settled", winner: 0, pnlC: [100, -50, -25, -25] };
      return "sig-settle";
    },
    waitForOwner: async () => {
      step("waitForOwner");
    },
    claim: async () => {
      step("claim");
      return "sig-claim";
    },
    commitSignatures: async () => ["sig-commit"],
    sweep: async () => {
      calls.push("sweep");
      return { sig: "sig-sweep", lamports: 1_000 };
    },
    now: () => t,
    sleep: async (ms) => {
      t += ms;
    },
  };
  return { io, calls, funded };
}

const phasesOf = (events: { phase: WalletPhase }[]) => events.map((e) => e.phase).filter((p, i, a) => i === 0 || a[i - 1] !== p);

describe("runWalletRound", () => {
  it("plays a full round in order with exactly three wallet popups before trading, then sweeps every in-tab key", async () => {
    const { io, calls, funded } = fakeIo();
    const vault = memoryVault();
    const events: { phase: WalletPhase }[] = [];
    const wallet = keypairSigner(Keypair.generate());
    const r = await runWalletRound(io, wallet, vault, { durationSecs: 90, seed: 7, onEvent: (e) => events.push(e) });
    const main = calls.filter((c) => c !== "botTrade" && c !== "sweep");
    expect(main).toEqual([
      "fund", "open", "joinWallet", "signIn", "joinBot", "joinBot", "joinBot", "delegate", "afterDelegate", "requestDeal",
      "reveal", "settle", "waitForOwner", "claim",
    ]);
    expect(calls.filter((c) => c === "botTrade").length).toBeGreaterThan(5);
    expect(calls.slice(-4)).toEqual(["sweep", "sweep", "sweep", "sweep"]);
    expect(phasesOf(events)).toEqual([
      "funding", "opening", "joining", "signing-in", "seating-bots", "delegating", "dealing", "trading", "bell", "settling", "claiming", "sweeping", "done",
    ]);
    const b = walletRoundBudget(RENT);
    expect(funded).toEqual([b.house, b.bot, b.bot, b.bot]);
    expect(r.walletPopups).toBe(3);
    expect(r.sweptLamports).toBe(4_000);
    expect(r.proof.mode).toBe("tee");
    expect(r.proof.base.joins).toHaveLength(4);
    expect(r.proof.result.winnerSeat).toBe(0);
    expect(r.proof.result.winner).toBe(wallet.publicKey.toBase58());
    expect(vault.load()).toBeNull();
  });

  it("refuses to start, before any popup, when the wallet holds less than the budget", async () => {
    const { io, calls } = fakeIo({ balance: 1_000 });
    const err = await runWalletRound(io, keypairSigner(Keypair.generate()), memoryVault()).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(InsufficientFundsError);
    expect((err as InsufficientFundsError).needLamports).toBe(walletRoundBudget(RENT).total);
    expect(calls).toEqual([]);
  });

  it("still sweeps all four in-tab keys when the round fails after funding, then reports the error", async () => {
    const { io, calls } = fakeIo({ failAt: "joinWallet" });
    const vault = memoryVault();
    const events: { phase: WalletPhase; error?: string }[] = [];
    await expect(
      runWalletRound(io, keypairSigner(Keypair.generate()), vault, { onEvent: (e) => events.push(e) }),
    ).rejects.toThrow(/boom at joinWallet/);
    expect(calls.filter((c) => c === "sweep")).toHaveLength(4);
    expect(events[events.length - 1].phase).toBe("error");
    expect(events[events.length - 1].error).toMatch(/boom at joinWallet/);
    expect(vault.load()).toBeNull();
  });

  it("budget: total = house + 3 bots + the wallet's own seat", () => {
    const b = walletRoundBudget(RENT);
    expect(b.bot).toBe(ENTRY_LAMPORTS + RENT.handRent + 2_000_000);
    expect(b.house).toBe(RENT.tableRent + 5 * 4_000_000 + 5_000_000);
    expect(b.wallet).toBe(ENTRY_LAMPORTS + RENT.handRent + 2_000_000);
    expect(b.total).toBe(b.house + 3 * b.bot + b.wallet);
  });

  it("keys survive a serialize / parse round trip and junk parses to null", () => {
    const k = newHouseKeys();
    const back = parseKeys(serializeKeys(k));
    expect(back?.house.publicKey.equals(k.house.publicKey)).toBe(true);
    expect(back?.bots.map((b) => b.publicKey.toBase58())).toEqual(k.bots.map((b) => b.publicKey.toBase58()));
    expect(parseKeys("not json")).toBeNull();
    expect(parseKeys(JSON.stringify({ house: [1], bots: [] }))).toBeNull();
  });
});
