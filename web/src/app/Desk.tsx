import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { MAX_LOT, POS_CAP, START_PRICE_C, handEdge, quote, type Side } from "@hidden-hand/client/engine";
import type { TableView } from "@hidden-hand/client";
import { PriceChart } from "../shared/PriceChart";
import type { RoundApi } from "./useRound";

export const DEMO_COMMAND = "pnpm --filter @hidden-hand/bots demo-round -- --demo";
const LOTS = [1, 2, 3, 4, 5].filter((n) => n <= MAX_LOT);

const fmt = (c: number): string => (c / 100).toFixed(2);
const signed = (c: number): string => `${c > 0 ? "+" : c < 0 ? "−" : ""}${Math.abs(c / 100).toFixed(2)}`;
const clock = (s: number): string => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const posText = (p: number): string => (p > 0 ? `long ${p}` : p < 0 ? `short ${-p}` : "flat");
const sol = (lamports: number): string => (lamports / 1e9).toFixed(2);

const PHASE_LABEL: Record<string, string> = {
  "no-round": "Idle",
  loading: "Reading",
  error: "Error",
  "waiting-for-seats": "Open",
  "waiting-for-deal": "Dealing",
  trading: "Trading",
  bell: "Bell",
  revealed: "Revealed",
  settled: "Settled",
};

export function CopyButton({ text, label, secondary }: { text: string; label: string; secondary?: boolean }) {
  return (
    <button type="button" className={`btn ${secondary ? "btn--secondary" : "btn--primary"} copy`} data-copy={text} data-copied-label="Copied">
      {label}
    </button>
  );
}

function Card({ up, face }: { up: boolean; face: number }) {
  return (
    <span className="pit-card" data-up={up ? "true" : "false"} aria-hidden="true">
      <span className="pit-card__back" />
      <span className="pit-card__face">{face}</span>
    </span>
  );
}

function Seat({ i, r }: { i: number; r: RoundApi }) {
  const v = r.view;
  const joined = v !== null && i < v.seatCount;
  const open = v !== null && (v.phase === "revealed" || v.phase === "settled");
  const mine = r.mySeat === i;
  const own = mine && r.myHand ? r.myHand : null;
  const faces: [number, number] = open && v ? [v.cards[i * 2] ?? 0, v.cards[i * 2 + 1] ?? 0] : own ?? [0, 0];
  const up = open || own !== null;
  const seat = v?.seats[i];
  const settled = v !== null && v.phase === "settled";
  const winner = settled && v.winner === i;
  const pnl = settled && v ? v.pnlC[i] : undefined;
  return (
    <li className="desk-seat" data-empty={joined ? undefined : "true"} data-winner={winner ? "true" : undefined}>
      <span className="desk-seat__name">{`Seat ${i + 1}${mine ? " · you" : ""}${winner ? " · winner" : ""}`}</span>
      <span className="desk-seat__cards">
        <Card up={up} face={faces[0]} />
        <Card up={up} face={faces[1]} />
      </span>
      <span className="desk-seat__pos">
        {joined && seat ? posText(seat.pos) : "open"}
        {pnl !== undefined && <small>{signed(pnl)}</small>}
      </span>
    </li>
  );
}

function Controls({ r, v }: { r: RoundApi; v: TableView }) {
  const [lot, setLot] = useState(1);
  const seated = r.mySeat !== null;
  const pos = seated ? v.seats[r.mySeat as number].pos : 0;
  const can = (side: Side): boolean => seated && r.acting !== "trade" && typeof quote(v.priceC, pos, side, lot) !== "string";
  const edge = r.myHand ? handEdge(r.myHand) : null;
  const edgeText = edge === null ? "" : edge > 0 ? `+${edge}` : edge < 0 ? `−${-edge}` : "0";
  const atCap = seated && (typeof quote(v.priceC, pos, "buy", lot) === "string" || typeof quote(v.priceC, pos, "sell", lot) === "string");
  return (
    <>
      <div className="desk-hand">
        {seated ? (
          <>
            <span className="desk-hand__cards">
              <Card up={r.myHand !== null} face={r.myHand ? r.myHand[0] : 0} />
              <Card up={r.myHand !== null} face={r.myHand ? r.myHand[1] : 0} />
            </span>
            <p className="desk-hand__hint">
              {edge === null
                ? "Dealing sealed hands with VRF… Your hand shows here once it is dealt."
                : `Your hand is worth ${edgeText} ${Math.abs(edge) === 1 ? "contract" : "contracts"}`}
            </p>
          </>
        ) : (
          <p className="desk-hand__hint">You are watching. Every trade prints on the tape.</p>
        )}
      </div>
      <div className="desk-trade">
        <div className="desk-lots" role="group" aria-label="Lot size">
          {LOTS.map((n) => (
            <button key={n} type="button" className="desk-lot" aria-pressed={lot === n} onClick={() => setLot(n)} disabled={!seated}>
              {n}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn--primary" disabled={!can("buy")} onClick={() => void r.trade("buy", lot)}>{`Buy ${lot}`}</button>
        <button type="button" className="btn btn--secondary" disabled={!can("sell")} onClick={() => void r.trade("sell", lot)}>{`Sell ${lot}`}</button>
      </div>
      {atCap && <p className="desk-note">{`Positions stop at ±${POS_CAP} contracts, and the price stays between 8.00 and 120.00.`}</p>}
    </>
  );
}

function Panel({ r }: { r: RoundApi }) {
  const v = r.view;
  const ui = r.ui;
  switch (ui.kind) {
    case "loading":
      return (
        <>
          <p className="desk-panel__title">Reading the table…</p>
          <p className="desk-panel__text">Asking the Rollup first, then Solana.</p>
        </>
      );
    case "no-round":
      return (
        <>
          <p className="desk-panel__title">Start a round</p>
          <p className="desk-panel__text">Run it with a funded devnet burner, then open the printed link.</p>
          <code className="desk-code">{DEMO_COMMAND}</code>
          <CopyButton text={DEMO_COMMAND} label="Copy the demo command" />
        </>
      );
    case "error":
      return (
        <>
          <p className="desk-panel__title">The table did not load</p>
          <p className="desk-panel__text" role="alert">{ui.message}</p>
          <button type="button" className="btn btn--primary" onClick={r.retry}>Try again</button>
        </>
      );
    case "waiting-for-seats": {
      const taken = v ? v.seatCount : 0;
      const funded = r.balance !== null && v !== null && r.balance >= v.entryLamports;
      return (
        <>
          <p className="desk-panel__title">{`${taken} of 4 seats taken`}</p>
          {r.mySeat !== null ? (
            <p className="desk-panel__text">{`You hold seat ${r.mySeat + 1}. The round deals when all four seats are taken.`}</p>
          ) : (
            <>
              <p className="desk-panel__text">
                {funded
                  ? `Your seat key holds ${sol(r.balance as number)} SOL, enough for the ${sol(v?.entryLamports ?? 0)} SOL seat.`
                  : "Fund this seat key on devnet, or pass it to demo-round with --seat4:"}
              </p>
              <code className="desk-code">{r.seatKey}</code>
              <div className="btn-row">
                {funded && (
                  <button type="button" className="btn btn--primary" disabled={r.acting === "join"} onClick={() => void r.join()}>Take the free seat</button>
                )}
                <CopyButton text={r.seatKey} label="Copy the seat key" secondary={funded} />
              </div>
            </>
          )}
          {r.actionError && <p className="desk-note" role="alert">{r.actionError}</p>}
        </>
      );
    }
    case "waiting-for-deal":
      return (
        <>
          <p className="desk-panel__title">Dealing sealed hands with VRF…</p>
          <p className="desk-panel__text">Each seat gets two cards from 1 to 15, readable by its owner only.</p>
        </>
      );
    case "trading":
      return v ? (
        <>
          <Controls r={r} v={v} />
          {r.actionError && <p className="desk-note" role="alert">{r.actionError}</p>}
        </>
      ) : null;
    case "bell":
      return (
        <>
          <p className="desk-panel__title">Bell. Trading is closed.</p>
          <p className="desk-panel__text">The hands flip on-chain next, then the round settles.</p>
        </>
      );
    case "revealed":
      return (
        <>
          <p className="desk-panel__title">Hands are face up</p>
          <p className="desk-panel__text">Profit and loss is being settled, then the table returns to Solana.</p>
        </>
      );
    case "settled": {
      if (!v) return null;
      const close = v.priceC / 100;
      const gap = Math.abs(close - v.hiddenSum);
      const pot = (v.entryLamports * v.seatCount) / 1e9;
      return (
        <>
          <dl className="desk-result">
            <div><dt>Hidden sum</dt><dd>{v.hiddenSum}</dd></div>
            <div><dt>Close</dt><dd>{close.toFixed(2)}</dd></div>
            <div><dt>Gap</dt><dd>{gap.toFixed(2)}</dd></div>
            <div><dt>{v.winner !== null ? `Seat ${v.winner + 1} wins` : "Winner"}</dt><dd>{`${pot.toFixed(2)} SOL`}</dd></div>
          </dl>
          <p className="desk-panel__text">
            {`The close tracks the sum because each trade's size encodes a hand's information. ${v.paid ? "The pot is paid." : "The pot waits for the claim on Solana."}`}
          </p>
        </>
      );
    }
  }
}

/** Picks the chart's viewBox height so its drawn height stays near a target in pixels, whatever the width. */
function useChartHeight(ref: RefObject<HTMLDivElement>): number {
  const [h, setH] = useState(130);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (w <= 0) return;
      const target = window.innerWidth < 640 ? 72 : window.innerWidth < 1024 ? 112 : window.innerHeight < 820 ? 112 : window.innerHeight < 860 ? 168 : 196;
      setH(Math.max(60, Math.min(260, Math.round((target * 640) / w))));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return h;
}

export function Desk({ r, tape, panel, chip }: { r: RoundApi; tape: ReactNode; panel?: ReactNode; chip?: string }) {
  const v = r.view;
  const ui = r.ui;
  const wrap = useRef<HTMLDivElement>(null);
  const height = useChartHeight(wrap);
  const durationMs = (v?.durationSecs ?? 90) * 1000;
  const revealSum = v && (v.phase === "revealed" || v.phase === "settled") ? v.hiddenSum : null;
  const points: { tMs: number; priceC: number }[] = v
    ? v.trades.map((t) => ({ tMs: (t.ts - v.startTs) * 1000, priceC: t.priceAfterC }))
    : [];
  if (v && v.phase === "trading") points.push({ tMs: Math.max(0, Math.min(durationMs, r.nowMs - v.startTs * 1000)), priceC: v.priceC });
  const idle = points.length === 0;
  const chartPoints = idle ? [{ tMs: 0, priceC: START_PRICE_C }, { tMs: durationMs, priceC: START_PRICE_C }] : points;
  const price = v ? v.priceC : START_PRICE_C;
  const chipText = chip ?? (r.roundParam === null ? "No round selected" : `Round ${r.roundParam} · ${r.mode === "tee" ? "Private ER" : "Commit-reveal"}`);
  const seconds = ui.kind === "trading" ? ui.secondsLeft : ui.kind === "bell" || ui.kind === "revealed" || ui.kind === "settled" ? 0 : (v?.durationSecs ?? 90);
  return (
    <div className="desk ui" data-state={ui.kind}>
      <div className="desk__bar">
        <span className="desk__chip">{chipText}</span>
        <span className="desk__phase">{PHASE_LABEL[ui.kind]}</span>
        <span className="desk__clock" role="timer" aria-label="Time left">{clock(seconds)}</span>
      </div>
      <div className="desk__body">
        <div className="desk__main">
          <div className="desk__chart" ref={wrap}>
            <p className="desk__price">{fmt(price)}</p>
            <PriceChart points={chartPoints} durationMs={durationMs} revealSum={revealSum} height={height} label={idle ? "Opening price" : "Live round"} />
          </div>
          <div className="desk-panel" aria-live="polite">
            {panel ?? <Panel r={r} />}
          </div>
        </div>
        <div className="desk__side">
          <div className="desk__side-in">
            <ul className="desk__seats">
              {[0, 1, 2, 3].map((i) => (
                <Seat key={i} i={i} r={r} />
              ))}
            </ul>
            {tape}
          </div>
        </div>
      </div>
    </div>
  );
}
