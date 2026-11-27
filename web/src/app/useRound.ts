import BN from "bn.js";
import type { Program } from "@coral-xyz/anchor";
import type { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Fragment, createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  DEFAULT_DEAL_MODE,
  baseConnection,
  createDealAdapter,
  fetchTable,
  joinTable,
  makeProgram,
  sendTrade,
  tablePda,
  type DealAdapter,
  type DealMode,
  type HiddenHand,
  type SecretStore,
  type Side,
  type TableView,
} from "@hidden-hand/client";
import { loadSeatKey } from "./burner";
import { Desk } from "./Desk";
import { Record } from "./Record";
import { Tape } from "./Tape";
import { deriveUiState, type UiState } from "./states";

const POLL_MS = 700;
const PHASE_ORDER: Record<TableView["phase"], number> = { open: 0, dealing: 1, trading: 2, revealed: 3, settled: 4 };

export interface SentTrade { sig: string; side: Side; qty: number }

export interface RoundApi {
  roundParam: string | null;
  mode: DealMode;
  ui: UiState;
  view: TableView | null;
  nowMs: number;
  seatKey: string;
  /** Seat key balance in lamports, null until read. */
  balance: number | null;
  mySeat: number | null;
  myHand: [number, number] | null;
  erRpc: string;
  sent: SentTrade[];
  acting: "join" | "trade" | null;
  actionError: string | null;
  table: PublicKey | null;
  join: () => Promise<void>;
  trade: (side: Side, qty: number) => Promise<void>;
  retry: () => void;
}

/** The later phase wins, then the higher trade count; an equal read is the newer one. */
export function further(a: TableView | null, b: TableView | null): TableView | null {
  if (a === null) return b;
  if (b === null) return a;
  const pa = PHASE_ORDER[a.phase];
  const pb = PHASE_ORDER[b.phase];
  if (pa !== pb) return pa > pb ? a : b;
  return b.tradeCount >= a.tradeCount ? b : a;
}

function localSecretStore(): SecretStore {
  const key = (k: string) => `hh-secret:${k}`;
  return {
    get(k) {
      try {
        const raw = window.localStorage.getItem(key(k));
        return raw ? Uint8Array.from(JSON.parse(raw) as number[]) : null;
      } catch {
        return null;
      }
    },
    set(k, v) {
      try {
        window.localStorage.setItem(key(k), JSON.stringify(Array.from(v)));
      } catch {
        // storage blocked: the secret lives for this tab only
      }
    },
  };
}

const message = (e: unknown): string => {
  const text = e instanceof Error ? e.message : String(e);
  return text.length > 200 ? `${text.slice(0, 200)}…` : text;
};
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface Setup {
  roundParam: string | null;
  mode: DealMode;
  roundId: BN | null;
  table: PublicKey | null;
  adapter: DealAdapter | null;
  seat: Keypair;
  error: string | null;
}

function setup(): Setup {
  const params = new URLSearchParams(window.location.search);
  const roundParam = params.get("round");
  const modeParam = params.get("mode");
  const mode: DealMode = modeParam === "tee" || modeParam === "commit-reveal" ? modeParam : DEFAULT_DEAL_MODE;
  const seat = loadSeatKey();
  if (roundParam === null) return { roundParam, mode, roundId: null, table: null, adapter: null, seat, error: null };
  if (!/^\d{1,19}$/.test(roundParam)) {
    return { roundParam, mode, roundId: null, table: null, adapter: null, seat, error: `Round “${roundParam.slice(0, 24)}” is not a round number. Use the link demo-round prints.` };
  }
  try {
    const roundId = new BN(roundParam, 10);
    const adapter = createDealAdapter(mode, localSecretStore());
    return { roundParam, mode, roundId, table: tablePda(roundId), adapter, seat, error: null };
  } catch (e) {
    return { roundParam, mode, roundId: null, table: null, adapter: null, seat, error: message(e) };
  }
}

export function useRound(): RoundApi {
  const s = useMemo(setup, []);
  const [view, setView] = useState<TableView | null>(null);
  const [loading, setLoading] = useState(s.roundParam !== null && s.error === null);
  const [error, setError] = useState<string | null>(s.error);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [balance, setBalance] = useState<number | null>(null);
  const [myHand, setMyHand] = useState<[number, number] | null>(null);
  const [sent, setSent] = useState<SentTrade[]>([]);
  const [acting, setActing] = useState<"join" | "trade" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [kick, setKick] = useState(0);
  const viewRef = useRef<TableView | null>(null);
  const revealed = useRef(false);

  // the clock the countdown reads
  useEffect(() => {
    if (s.roundParam === null) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [s.roundParam]);

  // the poll: the ER first, the base layer when the ER has nothing; the view furthest along is kept
  useEffect(() => {
    const { adapter, table, seat } = s;
    if (adapter === null || table === null) return;
    let stop = false;
    const programs = new Map<Connection, Program<HiddenHand>>();
    const programFor = (c: Connection): Program<HiddenHand> => {
      const hit = programs.get(c);
      if (hit) return hit;
      const p = makeProgram(c, seat);
      programs.set(c, p);
      return p;
    };
    const baseProgram = makeProgram(baseConnection(), seat);
    const read = async (): Promise<{ view: TableView | null; err: string | null }> => {
      let erErr: string | null = null;
      try {
        const er = await adapter.erConnection(seat);
        const v = await fetchTable(programFor(er), table);
        if (v) return { view: v, err: null };
      } catch (e) {
        erErr = message(e);
      }
      try {
        const v = await fetchTable(baseProgram, table);
        return { view: v, err: v ? null : erErr };
      } catch (e) {
        return { view: null, err: message(e) };
      }
    };
    (async () => {
      while (!stop) {
        const got = await read();
        if (stop) return;
        if (got.view) {
          const next = further(viewRef.current, got.view);
          viewRef.current = next;
          setView(next);
          setError(null);
        } else if (viewRef.current === null) {
          setError(got.err ?? `Round ${s.roundParam} was not found on devnet.`);
        }
        setLoading(false);
        await sleep(POLL_MS);
      }
    })();
    return () => {
      stop = true;
    };
  }, [s, kick]);

  const mySeat = useMemo(() => {
    if (!view) return null;
    const i = view.seats.slice(0, view.seatCount).findIndex((x) => x.owner.equals(s.seat.publicKey));
    return i >= 0 ? i : null;
  }, [view, s.seat]);

  const ui = deriveUiState({ roundParam: s.roundParam, loading, error, view, nowMs });

  // the seat key's balance, while a seat is still open to it
  const waitingForSeat = ui.kind === "waiting-for-seats" && mySeat === null;
  useEffect(() => {
    if (!waitingForSeat) return;
    let stop = false;
    const base = baseConnection();
    const tick = async () => {
      try {
        const lamports = await base.getBalance(s.seat.publicKey, "confirmed");
        if (!stop) setBalance(lamports);
      } catch {
        // keep the last balance
      }
    };
    void tick();
    const id = window.setInterval(tick, 4000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [waitingForSeat, s.seat]);

  // your own hand, read as your own key, polled until the Rollup shows it
  const tradingOn = view !== null && PHASE_ORDER[view.phase] >= PHASE_ORDER.trading;
  useEffect(() => {
    const { adapter, table, roundId, seat } = s;
    if (!adapter || !table || !roundId || mySeat === null || !tradingOn || myHand !== null) return;
    let stop = false;
    (async () => {
      while (!stop) {
        const v = viewRef.current;
        if (v) {
          try {
            const hand = await adapter.readOwnHand({ roundId, table, seatOwners: v.seats.map((x) => x.owner), payer: seat, seatKeys: [seat] }, seat);
            if (hand) {
              if (!stop) setMyHand(hand);
              return;
            }
          } catch {
            // not readable yet
          }
        }
        await sleep(1000);
      }
    })();
    return () => {
      stop = true;
    };
  }, [s, mySeat, tradingOn, myHand]);

  // commit-reveal only: at the bell this browser's seat sends its own reveal_secret, once
  useEffect(() => {
    const { adapter, table, roundId, seat } = s;
    if (!adapter || adapter.mode !== "commit-reveal" || !table || !roundId || mySeat === null || ui.kind !== "bell" || revealed.current) return;
    const v = viewRef.current;
    if (!v) return;
    revealed.current = true;
    adapter.reveal({ roundId, table, seatOwners: v.seats.map((x) => x.owner), payer: seat }, [seat]).catch(() => {
      // the runner reveals the other seats; a failed own reveal shows as a missing hand on the tape
    });
  }, [s, mySeat, ui.kind]);

  const join = useCallback(async () => {
    const { adapter, table, seat } = s;
    if (!adapter || !table) return;
    setActing("join");
    setActionError(null);
    try {
      await joinTable(makeProgram(baseConnection(), seat), seat, seat, table, adapter.commitmentFor(table, seat.publicKey));
    } catch (e) {
      setActionError(message(e));
    } finally {
      setActing(null);
    }
  }, [s]);

  const trade = useCallback(
    async (side: Side, qty: number) => {
      const { adapter, table, seat } = s;
      if (!adapter || !table) return;
      setActing("trade");
      setActionError(null);
      try {
        const er = makeProgram(await adapter.erConnection(seat), seat);
        const sig = await sendTrade(er, seat, table, side, qty);
        setSent((prev) => [...prev, { sig, side, qty }]);
      } catch (e) {
        setActionError(message(e));
      } finally {
        setActing(null);
      }
    },
    [s],
  );

  const retry = useCallback(() => {
    if (s.error !== null) {
      window.location.reload();
      return;
    }
    setError(null);
    setLoading(true);
    setKick((k) => k + 1);
  }, [s.error]);

  return {
    roundParam: s.roundParam,
    mode: s.mode,
    ui,
    view,
    nowMs,
    seatKey: s.seat.publicKey.toBase58(),
    balance,
    mySeat,
    myHand,
    erRpc: s.adapter?.erRpc ?? "",
    sent,
    acting,
    actionError,
    table: s.table,
    join,
    trade,
    retry,
  };
}

/** The live page: loaded only when the address names a round, so an idle visit never pays for the Solana libraries. */
export function LiveApp() {
  const round = useRound();
  // the page ships the record as plain markup; the live one replaces it once, then renders in its place
  const [recordReady, setRecordReady] = useState(false);
  useEffect(() => {
    document.getElementById("record-root")?.replaceChildren();
    setRecordReady(true);
  }, []);
  const record = document.getElementById("record-root");
  return createElement(
    Fragment,
    null,
    createElement(Desk, { r: round, tape: createElement(Tape, { r: round }) }),
    record && recordReady ? createPortal(createElement(Record, { table: round.table }), record) : null,
  );
}
