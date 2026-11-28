import type { Connection, PublicKey } from "@solana/web3.js";
import type { Wallet } from "@wallet-standard/base";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TEE_RPC,
  baseConnection,
  connectStandard,
  fetchTable,
  isBlockhashExpired,
  isUserRejection,
  readHandAs,
  readonlyProgram,
  standardSigner,
  tradeWith,
  type Side,
  type TableView,
  type WalletSigner,
} from "@hidden-hand/client";
import {
  InsufficientFundsError,
  RoundAbortedError,
  liveHouseIo,
  runWalletRound,
  sweepAll,
  walletRoundBudget,
  type WalletPhase,
  type WalletRoundEvent,
} from "@hidden-hand/bots/house";
import { deriveUiState, type UiState } from "../states";
import { further, type RoundApi, type SentTrade } from "../useRound";
import { connectErrorText } from "./connectError";
import { sessionVault } from "./sessionVault";
import { signedCounter } from "./signedCounter";
import { useDetectedWallets } from "./useDetectedWallets";
import { WALLET_CLOSED, deriveWalletUi, walletErrorText, type WalletUi } from "./walletStates";

/** A wallet that blocks a popup without answering must not hang the trade buttons. */
function answerWithin(s: WalletSigner, ms: number): WalletSigner {
  const limit = <T,>(p: Promise<T>): Promise<T> =>
    Promise.race([p, new Promise<T>((_, no) => setTimeout(() => no(new Error(`The wallet did not answer within ${ms / 1000} s`)), ms))]);
  return { publicKey: s.publicKey, signTransaction: (tx) => limit(s.signTransaction(tx)), signMessage: (m) => limit(s.signMessage(m)) };
}

export interface WalletApi {
  ui: WalletUi;
  wallets: { name: string; icon: string }[];
  walletName: string | null;
  address: string | null;
  balance: number | null; // lamports, base devnet
  needLamports: number | null; // walletRoundBudget(rent).total
  popups: number; // signatures the wallet returned, for this wallet and this round
  swept: number | null; // lamports swept back at the end
  leftover: boolean; // sessionVault() holds keys from an unfinished round
  /** The wallet's connect popup; null once it connected, else the words the connect modal shows. */
  connect(name: string): Promise<string | null>;
  disconnect(): void;
  start(): Promise<void>;
  retry(): void; // error -> back to ready (re-reads balance); never re-runs a half round
  sweepLeftover(): Promise<void>;
}

const POLL_MS = 700;
const BALANCE_MS = 5000;
const message = (e: unknown): string => {
  const text = e instanceof Error ? e.message : String(e);
  return text.length > 200 ? `${text.slice(0, 200)}…` : text;
};
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function useWalletRound(): { round: RoundApi; wallet: WalletApi } {
  const base = useMemo(() => baseConnection(), []);
  const found: Wallet[] = useDetectedWallets();
  const [walletName, setWalletName] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [needLamports, setNeedLamports] = useState<number | null>(null);
  const [popups, setPopups] = useState(0);
  const [swept, setSwept] = useState<number | null>(null);
  const [leftover, setLeftover] = useState(false);
  const [phase, setPhase] = useState<WalletPhase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [table, setTable] = useState<PublicKey | null>(null);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [erReady, setErReady] = useState(false);
  const [view, setView] = useState<TableView | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [myHand, setMyHand] = useState<[number, number] | null>(null);
  const [sent, setSent] = useState<SentTrade[]>([]);
  const [acting, setActing] = useState<"join" | "trade" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const signerRef = useRef<WalletSigner | null>(null);
  const walletErRef = useRef<Connection | null>(null);
  const viewRef = useRef<TableView | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const runRef = useRef(0);

  // the clock the countdown reads
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 500);
    return () => window.clearInterval(id);
  }, []);

  // a round in flight stops (and sweeps) when the page goes away
  useEffect(() => () => abortRef.current?.abort(), []);

  const readBalance = useCallback(async () => {
    const s = signerRef.current;
    if (!s) return;
    try {
      const lamports = await base.getBalance(s.publicKey, "confirmed");
      if (signerRef.current === s) setBalance(lamports);
    } catch {
      // keep the last balance
    }
  }, [base]);

  const readNeed = useCallback(async () => {
    try {
      setNeedLamports(walletRoundBudget(await liveHouseIo().rent()).total);
    } catch {
      // read again on the next tick
    }
  }, []);

  const resetRound = useCallback(() => {
    setPhase(null);
    setError(null);
    setTable(null);
    setRoundId(null);
    setErReady(false);
    walletErRef.current = null;
    viewRef.current = null;
    setView(null);
    setMyHand(null);
    setSent([]);
    setActing(null);
    setActionError(null);
  }, []);

  const connect = useCallback(
    async (name: string): Promise<string | null> => {
      const w = found.find((x) => x.name === name);
      if (!w) return `${name} is no longer in this browser. Reload the page and try again.`;
      try {
        const account = await connectStandard(w);
        const signer = signedCounter(standardSigner(w, account), () => setPopups((n) => n + 1));
        setError(null);
        setPopups(0); // a new wallet starts its own count
        signerRef.current = signer;
        setWalletName(w.name);
        setAddress(signer.publicKey.toBase58());
        setLeftover(sessionVault().load() !== null);
        setBalance(null);
        void Promise.all([readBalance(), readNeed()]); // the desk shows "Reading your devnet balance" meanwhile
        return null;
      } catch (e) {
        return connectErrorText(e); // shown in the connect modal; the desk stays on its connect panel
      }
    },
    [found, readBalance, readNeed],
  );

  const disconnect = useCallback(() => {
    runRef.current += 1; // events from a round still sweeping no longer reach the page
    abortRef.current?.abort();
    abortRef.current = null;
    signerRef.current = null;
    setWalletName(null);
    setAddress(null);
    setBalance(null);
    setNeedLamports(null);
    setSwept(null);
    setLeftover(false);
    resetRound();
  }, [resetRound]);

  const start = useCallback(async () => {
    const signer = signerRef.current;
    if (!signer) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const run = ++runRef.current;
    resetRound();
    setSwept(null);
    setPopups(0); // a new round starts its own count
    const onEvent = (e: WalletRoundEvent) => {
      if (runRef.current !== run) return;
      setPhase(e.phase);
      if (e.table) setTable(e.table);
      if (e.roundId) setRoundId(e.roundId);
      if (e.walletEr) {
        walletErRef.current = e.walletEr;
        setErReady(true);
      }
      if (e.view) {
        const next = further(viewRef.current, e.view);
        viewRef.current = next;
        setView(next);
      }
      if (e.swept !== undefined) setSwept(e.swept);
    };
    try {
      const result = await runWalletRound(liveHouseIo(), signer, sessionVault(), { onEvent, signal: ctrl.signal });
      if (runRef.current !== run) return;
      setSwept(result.sweptLamports);
    } catch (e) {
      if (runRef.current !== run || e instanceof RoundAbortedError) return;
      if (e instanceof InsufficientFundsError) {
        setBalance(e.haveLamports);
        setNeedLamports(e.needLamports);
        setPhase(null);
        return;
      }
      setError(walletErrorText(message(e), isUserRejection(e), "You closed the wallet popup, so the round stopped. Leftover SOL was swept back to your wallet."));
    } finally {
      if (runRef.current === run) {
        setLeftover(sessionVault().load() !== null);
        void readBalance();
      }
    }
  }, [resetRound, readBalance]);

  const retry = useCallback(() => {
    runRef.current += 1;
    abortRef.current = null;
    resetRound();
    setLeftover(sessionVault().load() !== null);
    void readBalance();
  }, [resetRound, readBalance]);

  const sweepLeftover = useCallback(async () => {
    const signer = signerRef.current;
    const vault = sessionVault();
    const keys = vault.load();
    if (!signer || !keys) return;
    const r = await sweepAll(liveHouseIo(), keys, signer.publicKey);
    if (r.ok) vault.clear();
    setLeftover(!r.ok);
    await readBalance();
  }, [readBalance]);

  const wallets = useMemo(() => found.map((w) => ({ name: w.name, icon: w.icon })), [found]);
  const ui = deriveWalletUi({
    connected: address !== null,
    wallets: wallets.map((w) => w.name),
    balance,
    needLamports,
    phase,
    endTs: view ? view.endTs : null,
    nowMs,
    error,
  });

  // 2. the balance (and the round's cost) again every 5 s before a round, so a faucet top-up shows up
  const precheck = address !== null && phase === null && error === null;
  useEffect(() => {
    if (!precheck) return;
    const id = window.setInterval(() => {
      void readBalance();
      if (needLamports === null) void readNeed();
    }, BALANCE_MS);
    return () => window.clearInterval(id);
  }, [precheck, needLamports, readBalance, readNeed]);

  // 4. the table: the wallet's own TEE connection first, then the base layer; the view furthest along is kept
  const polling = table !== null && phase !== "done" && phase !== "error";
  useEffect(() => {
    const signer = signerRef.current;
    if (!polling || table === null || signer === null) return;
    let stop = false;
    const baseProgram = readonlyProgram(base, signer.publicKey);
    let erProgram: { c: Connection; p: ReturnType<typeof readonlyProgram> } | null = null;
    const read = async (): Promise<TableView | null> => {
      const er = walletErRef.current;
      if (er) {
        try {
          if (!erProgram || erProgram.c !== er) erProgram = { c: er, p: readonlyProgram(er, signer.publicKey) };
          const v = await fetchTable(erProgram.p, table);
          if (v) return v;
        } catch {
          // the base layer next
        }
      }
      try {
        return await fetchTable(baseProgram, table);
      } catch {
        return null;
      }
    };
    (async () => {
      while (!stop) {
        const v = await read();
        if (stop) return;
        if (v) {
          const next = further(viewRef.current, v);
          viewRef.current = next;
          setView(next);
        }
        await sleep(POLL_MS);
      }
    })();
    return () => {
      stop = true;
    };
  }, [polling, table, base]);

  // 5. your own hand, read through the wallet's TEE connection, until it shows
  useEffect(() => {
    const signer = signerRef.current;
    const er = walletErRef.current;
    if (phase !== "trading" || !erReady || !er || table === null || signer === null || myHand !== null) return;
    let stop = false;
    (async () => {
      while (!stop) {
        try {
          const hand = await readHandAs(er, table, signer.publicKey, 20_000);
          if (hand) {
            if (!stop) setMyHand(hand);
            return;
          }
        } catch {
          // not readable yet
        }
        await sleep(1000);
      }
    })();
    return () => {
      stop = true;
    };
  }, [phase, erReady, table, myHand]);

  // 6. one trade, one popup, sent to the Private ER
  const trade = useCallback(
    async (side: Side, qty: number) => {
      const signer = signerRef.current;
      const er = walletErRef.current;
      if (!signer || !er || table === null) return;
      setActing("trade");
      setActionError(null);
      try {
        const sig = await tradeWith(er, answerWithin(signer, 45_000), table, side, qty);
        setSent((prev) => [...prev, { sig, side, qty }]);
      } catch (e) {
        setActionError(
          isBlockhashExpired(e)
            ? "That signature took too long for the Rollup. Sign again a little faster."
            : walletErrorText(message(e), isUserRejection(e), WALLET_CLOSED),
        );
      } finally {
        setActing(null);
      }
    },
    [table],
  );

  const mySeat = useMemo(() => {
    if (!view || address === null) return null;
    const i = view.seats.slice(0, view.seatCount).findIndex((x) => x.owner.toBase58() === address);
    return i >= 0 ? i : null;
  }, [view, address]);

  // before a table exists the desk is idle, not reading (the plan's { kind: "loading" } read as "Reading" on the connect screen)
  const roundUi: UiState = view
    ? deriveUiState({ roundParam: roundId, loading: false, error: null, view, nowMs })
    : table === null
      ? { kind: "no-round" }
      : { kind: "loading" };

  const round: RoundApi = {
    roundParam: roundId,
    mode: "tee",
    ui: roundUi,
    view,
    nowMs,
    seatKey: address ?? "",
    balance,
    mySeat,
    myHand,
    erRpc: TEE_RPC,
    sent,
    acting,
    actionError,
    table,
    join: async () => {},
    trade,
    retry,
  };

  return {
    round,
    wallet: { ui, wallets, walletName, address, balance, needLamports, popups, swept, leftover, connect, disconnect, start, retry, sweepLeftover },
  };
}
