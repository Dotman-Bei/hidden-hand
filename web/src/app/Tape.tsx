import type { TradeView } from "@hidden-hand/client";
import type { RoundApi, SentTrade } from "./useRound";

const erTx = (erRpc: string, sig: string): string =>
  `https://explorer.solana.com/tx/${sig}?cluster=custom&customUrl=${encodeURIComponent(erRpc)}`;

const stamp = (secs: number): string => {
  const s = Math.max(0, Math.round(secs));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** Pairs the trades this browser sent with the newest trades of its own seat, newest first, while side and size agree. */
export function matchSent(trades: TradeView[], seat: number | null, sent: SentTrade[]): Map<number, string> {
  const out = new Map<number, string>();
  if (seat === null) return out;
  let k = sent.length - 1;
  for (let i = trades.length - 1; i >= 0 && k >= 0; i--) {
    const t = trades[i];
    if (t.seat !== seat) continue;
    const mine = sent[k];
    if (mine.side !== t.side || mine.qty !== t.qty) break;
    out.set(t.index, mine.sig);
    k--;
  }
  return out;
}

export function Tape({ r }: { r: RoundApi }) {
  const v = r.view;
  const newest = v ? v.trades.slice(-12).reverse() : [];
  const mine = v ? matchSent(v.trades, r.mySeat, r.sent) : new Map<number, string>();
  return (
    <div className="desk__tape">
      <p className="desk__label">Tape</p>
      {newest.length === 0 ? (
        <p className="desk__tape-empty">No trades yet</p>
      ) : (
        <ol className="desk__tape-list">
          {newest.map((t) => {
            const sig = mine.get(t.index);
            const text = `Seat ${t.seat + 1} ${t.side === "buy" ? "bought" : "sold"} ${t.qty} at ${(t.priceAfterC / 100).toFixed(2)}`;
            return (
              <li key={t.index}>
                {sig ? (
                  <a className="link" href={erTx(r.erRpc, sig)} target="_blank" rel="noreferrer">{text}</a>
                ) : (
                  <span>{text}</span>
                )}
                <span className="desk__tape-time">{`#${t.index + 1} · ${stamp(v ? t.ts - v.startTs : 0)}`}</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

