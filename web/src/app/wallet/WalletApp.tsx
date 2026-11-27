import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Desk } from "../Desk";
import { Record } from "../Record";
import { Tape } from "../Tape";
import { useWalletRound, type WalletApi } from "./useWalletRound";
import { WalletPanel, hasWalletPanel } from "./WalletPanel";

const short = (a: string): string => `${a.slice(0, 4)}…${a.slice(-4)}`;
const sol2 = (lamports: number): string => (lamports / 1e9).toFixed(2);
const sol3 = (lamports: number): string => (lamports / 1e9).toFixed(3);
const clock = (s: number): string => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function Strip({ w }: { w: WalletApi }) {
  if (w.address === null) return null;
  const ui = w.ui;
  return (
    <div className="wallet-strip" aria-label="Your wallet" role="region">
      <div className="wallet-strip__row">
        <span className="wallet-strip__id">
          <span>{w.walletName}</span>
          <span className="wallet-strip__mono">{short(w.address)}</span>
        </span>
        <span className="wallet-strip__mono">{w.balance === null ? "… SOL" : `${sol2(w.balance)} SOL`}</span>
        <span>{`Popups signed: ${w.popups}`}</span>
        {ui.kind === "trading" && (
          <span className="wallet-strip__mono" role="timer" aria-label="Round clock">{clock(ui.secondsLeft)}</span>
        )}
        <button type="button" className="wallet-strip__link" onClick={w.disconnect}>Disconnect</button>
      </div>
      {ui.kind === "trading" && (
        <p className="desk-note">
          Each trade is one wallet popup, lots of 1 to 5. Your wallet previews it against Solana, where the table is locked to the Rollup, so it may warn that the transaction could fail. That warning is expected: the app sends the trade to the Private ER, where it runs.
        </p>
      )}
      {ui.kind === "settled" && (
        <div className="wallet-strip__row">
          <p className="desk-note">{`Swept ${sol3(w.swept ?? 0)} SOL back to your wallet.`}</p>
          <button type="button" className="btn btn--primary" onClick={w.retry}>Play another round</button>
        </div>
      )}
    </div>
  );
}

/** Wallet mode: the visitor's own wallet holds seat 1; the house and three bots run in this tab. */
export function WalletApp() {
  const { round, wallet } = useWalletRound();
  // the page ships the record as plain markup; the live one replaces it once, then renders in its place
  const [recordReady, setRecordReady] = useState(false);
  useEffect(() => {
    document.getElementById("record-root")?.replaceChildren();
    setRecordReady(true);
  }, []);
  const record = document.getElementById("record-root");
  const chip = `Wallet · ${round.roundParam ? `Round ${round.roundParam} · Private ER` : "devnet"}`;
  const panel = hasWalletPanel(wallet) ? <WalletPanel w={wallet} /> : undefined;
  return (
    <>
      <Strip w={wallet} />
      <Desk r={round} tape={<Tape r={round} />} panel={panel} chip={chip} />
      {record && recordReady ? createPortal(<Record table={round.table} />, record) : null}
    </>
  );
}
