import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Desk } from "../Desk";
import { Record } from "../Record";
import { Tape } from "../Tape";
import { AccountControl } from "./AccountControl";
import { footerAction, useFooterAction } from "./useFooterAction";
import { useWalletRound, type WalletApi } from "./useWalletRound";
import { WalletModal } from "./WalletModal";
import { WalletPanel, hasWalletPanel } from "./WalletPanel";

const short = (a: string): string => `${a.slice(0, 4)}…${a.slice(-4)}`;
const sol2 = (lamports: number): string => (lamports / 1e9).toFixed(2);
const sol3 = (lamports: number): string => (lamports / 1e9).toFixed(3);
const clock = (s: number): string => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function Strip({ w }: { w: WalletApi }) {
  if (w.address === null) return null;
  const ui = w.ui;
  return (
    <div className="wallet-strip" aria-label="Your wallet" role="region" tabIndex={-1}>
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

/** The nav's actions slot: its static button (labelled by the page's inline script) is replaced once, before paint. */
function useNavHost(): HTMLElement | null {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const el = document.querySelector<HTMLElement>(".nav__actions");
    if (!el) return;
    el.replaceChildren();
    setHost(el);
  }, []);
  return host;
}

const shown = (el: HTMLElement | null): HTMLElement | null => (el && el.getClientRects().length > 0 ? el : null);

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
  const navHost = useNavHost();

  // one connect modal for the nav's button, the desk's and the footer's
  const [picking, setPicking] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  const openPicker = useCallback((el: HTMLElement | null) => {
    opener.current = el;
    setPicking(true);
  }, []);
  // the footer's static button (the inline script marks it data-wallet-connect in wallet mode); once a wallet
  // is connected a link to the pit stands there instead
  useFooterAction(wallet.address !== null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-wallet-connect]") : null;
      if (el) openPicker(el);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [openPicker]);
  const afterConnect = useCallback((): HTMLElement | null => {
    // the footer's button gave way to its link before the modal closed: the focus stays in the closing section.
    // (When the modal closes first, it focuses the button and the swap carries the focus to the link.)
    const link = opener.current?.hasAttribute("data-wallet-connect") ? footerAction() : null;
    return link ?? shown(document.querySelector<HTMLElement>(".nav__actions .account__toggle")) ?? document.querySelector<HTMLElement>(".wallet-strip");
  }, []);

  const chip = `Wallet · ${round.roundParam ? `Round ${round.roundParam} · Private ER` : "devnet"}`;
  const panel = hasWalletPanel(wallet) ? <WalletPanel w={wallet} onConnect={openPicker} /> : undefined;
  return (
    <>
      <Strip w={wallet} />
      <Desk r={round} tape={<Tape r={round} />} panel={panel} chip={chip} />
      {record && recordReady ? createPortal(<Record table={round.table} />, record) : null}
      {navHost
        ? createPortal(<AccountControl address={wallet.address} balance={wallet.balance} onConnect={openPicker} onDisconnect={wallet.disconnect} />, navHost)
        : null}
      {picking && (
        <WalletModal
          wallets={wallet.wallets}
          onSelect={wallet.connect}
          onClose={() => setPicking(false)}
          opener={opener.current}
          fallbackFocus={afterConnect}
        />
      )}
    </>
  );
}
