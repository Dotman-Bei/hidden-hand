import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEMO_SEED } from "@hidden-hand/bots/policy";
import { SEATS, START_PRICE_C } from "@hidden-hand/client/engine";
import { PriceChart } from "../shared/PriceChart";
import { pitTimeline } from "../shared/pitTimeline";

const ROUND_MS = 75_000; // the simulated round
const WALL_MS = 24_000; // the same round compressed into 24 s of wall time
const HOLD_MS = 4_000; // the hands stay up after the bell
const SCALE = WALL_MS / ROUND_MS;
const CLOCK_S = 90; // the round the page is about

function fmtClock(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

function PitCard({ value, up }: { value: number; up: boolean }) {
  return (
    <span className="pit-card" data-up={up} aria-hidden="true">
      <span className="pit-card__back" />
      <span className="pit-card__face">{value}</span>
    </span>
  );
}

function prefersReduced(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function PitIllustration() {
  const [seed, setSeed] = useState(DEMO_SEED);
  const [paused, setPaused] = useState(false);
  const [reduced] = useState(prefersReduced);
  const [wall, setWall] = useState(reduced ? WALL_MS : 0);
  const wallRef = useRef(reduced ? WALL_MS : 0);

  const deal = useCallback((next: number) => {
    wallRef.current = reduced ? WALL_MS : 0;
    setWall(wallRef.current);
    setSeed(next);
  }, [reduced]);

  useEffect(() => {
    if (reduced || paused) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(now - last, 250);
      last = now;
      wallRef.current += dt;
      if (wallRef.current >= WALL_MS + HOLD_MS) {
        wallRef.current = 0;
        setSeed((s) => s + 1);
      }
      const tick = Math.floor(wallRef.current / 100) * 100;
      setWall((w) => (w === tick ? w : tick));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reduced, paused]);

  const tl = useMemo(() => pitTimeline(seed, ROUND_MS), [seed]);
  const bell = wall >= WALL_MS;
  const roundNow = bell ? ROUND_MS : wall / SCALE;
  const shown = useMemo(() => tl.events.filter((e) => e.tMs <= roundNow), [tl, roundNow]);
  const points = useMemo(() => shown.map((e) => ({ tMs: e.tMs, priceC: e.priceAfterC })), [shown]);
  const priceC = shown.length > 0 ? shown[shown.length - 1].priceAfterC : START_PRICE_C;
  const pos = useMemo(() => {
    const p = new Array<number>(SEATS).fill(0);
    for (const e of shown) p[e.seat] += e.side === "buy" ? e.qty : -e.qty;
    return p;
  }, [shown]);
  const tape = shown.slice(-5).reverse();
  const clock = bell ? 0 : Math.ceil(CLOCK_S * (1 - wall / WALL_MS));

  return (
    <div className="pit ui ui-pit" data-bell={bell}>
      <div className="pit__bar">
        <span className="pit__chip" role="status">Illustrative round · simulated in your browser</span>
        <span className="pit__clock" aria-label={`Round clock ${fmtClock(clock)}`}>{fmtClock(clock)}</span>
        <button type="button" className="btn btn--secondary btn--sm pit__again" onClick={() => deal(seed + 1)}>Deal again</button>
      </div>
      <div className="pit__body">
        <div className="pit__main">
            <button
              type="button"
              className="ui-pause loop-pause pit__pause"
              aria-pressed={paused}
              aria-label={paused ? "Play the illustrative round" : "Pause the illustrative round"}
              onClick={() => setPaused((p) => !p)}
            >
              {paused ? (
                <svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3.5 2.2v9.6L11.6 7z" /></svg>
              ) : (
                <svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3.5 2h2.6v10H3.5zM7.9 2h2.6v10H7.9z" /></svg>
              )}
            </button>
          <p className="pit__price" aria-label={`Price ${(priceC / 100).toFixed(2)}`}>{(priceC / 100).toFixed(2)}</p>
          <PriceChart points={points} durationMs={ROUND_MS} revealSum={bell ? tl.hiddenSum : null} height={170} label="Illustrative round" />
          <ol className="pit__tape" aria-label="Latest trades">
            {tape.map((e) => (
              <li key={`${seed}-${e.tMs}-${e.seat}`}>{`Seat ${e.seat + 1} ${e.side === "buy" ? "bought" : "sold"} ${e.qty} at ${(e.priceAfterC / 100).toFixed(2)}`}</li>
            ))}
          </ol>
        </div>
        <div className="pit__side">
          <ul className="pit__seats">
            {Array.from({ length: SEATS }, (_, s) => (
              <li key={s} className="pit-seat">
                <span className="pit-seat__name">Seat {s + 1}</span>
                <span className="pit-seat__cards">
                  <PitCard value={tl.cards[2 * s]} up={bell} />
                  <PitCard value={tl.cards[2 * s + 1]} up={bell} />
                </span>
                <span className="pit-seat__pos">{pos[s] > 0 ? `long ${pos[s]}` : pos[s] < 0 ? `short ${-pos[s]}` : "flat"}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
