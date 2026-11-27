import { useState } from "react";
import type { WalletApi } from "./useWalletRound";
import { WALLET_COMPAT } from "./walletStates";

const EXPRESS_HREF = "/app/?mode=express";
const sol3 = (lamports: number): string => (lamports / 1e9).toFixed(3);

function Step({ title, text }: { title: string; text?: string }) {
  return (
    <>
      <p className="desk-panel__title">{title}</p>
      {text && <p className="desk-panel__text">{text}</p>}
    </>
  );
}

function Connect({ w }: { w: WalletApi }) {
  const [asked, setAsked] = useState(false);
  const first = w.wallets[0];
  const onConnect = () => {
    if (first) void w.connect(first.name);
    else setAsked(true);
  };
  return (
    <div className="wallet-connect">
      <div className="wallet-connect__text">
        <p className="desk-panel__title">Play with your wallet</p>
        <p className="desk-panel__text">Connect any Solana wallet (for example Phantom, Solflare, Backpack, OKX or MetaMask) on devnet. You hold one seat; three bots hold the others.</p>
      </div>
      <div className="wallet-connect__act">
      {w.wallets.length > 0 && (
        <ul className="wallet-list" aria-label="Wallets in this browser">
          {w.wallets.map((x) => (
            <li key={x.name}>
              <button type="button" className="btn btn--secondary wallet-list__btn" onClick={() => void w.connect(x.name)}>
                <img src={x.icon} alt="" width={20} height={20} />
                {`Connect ${x.name}`}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="btn-row">
        <button type="button" className="btn btn--primary" onClick={onConnect}>Connect a wallet</button>
        <a className="btn btn--secondary" href={EXPRESS_HREF}>Express mode (no wallet)</a>
      </div>
      {asked && w.wallets.length === 0 && (
        <p className="desk-note" role="alert">No Solana wallet found in this browser. Install any Solana wallet (for example Phantom, Solflare, Backpack, OKX or MetaMask), switch it to devnet, and reload.</p>
      )}
      <p className="desk-note">The price only finds the hidden sum when every seat trades its hand. A random or idle human breaks the reveal, so follow the hint.</p>
      </div>
    </div>
  );
}

function Ready({ w, need }: { w: WalletApi; need: number }) {
  const [sweeping, setSweeping] = useState(false);
  const onSweep = () => {
    setSweeping(true);
    void w.sweepLeftover().finally(() => setSweeping(false));
  };
  return (
    <>
      <p className="desk-panel__title">{`Ready: ${sol3(need)} SOL for one round`}</p>
      <p className="desk-panel__text">
        You will sign, in order: one transfer that funds the house and three bots, your seat on Solana, one message that unlocks your sealed hand on the Private ER, then one popup per trade.
      </p>
      <div className="btn-row">
        <button type="button" className="btn btn--primary" onClick={() => void w.start()}>Open a table</button>
        {w.leftover && (
          <button type="button" className="btn btn--secondary" disabled={sweeping} onClick={onSweep}>Sweep leftover SOL</button>
        )}
      </div>
      <p className="desk-note">{WALLET_COMPAT}</p>
    </>
  );
}

/** One panel per non-trading wallet state, shown in the desk's panel slot; trading, bell and settled use the desk's own. */
export function WalletPanel({ w }: { w: WalletApi }) {
  const ui = w.ui;
  switch (ui.kind) {
    case "connect":
      return <Connect w={w} />;
    case "checking":
      return <Step title="Reading your devnet balance…" />;
    case "insufficient":
      return (
        <>
          <p className="desk-panel__title">Not enough devnet SOL</p>
          <p className="desk-panel__text">
            {`One round needs ${sol3(ui.needLamports)} SOL: your seat (0.01 entry plus rent) and the house and three bots, whose leftover is swept back to you. This wallet holds ${sol3(ui.haveLamports)} SOL.`}
          </p>
          <a className="btn btn--primary" href="https://faucet.solana.com" target="_blank" rel="noopener">Get devnet SOL</a>
          <p className="desk-note">This page checks again every 5 seconds.</p>
        </>
      );
    case "ready":
      return <Ready w={w} need={ui.needLamports} />;
    case "funding":
      return <Step title="Approve the transfer in your wallet (popup 1)." text="It funds the house and three bots for this round." />;
    case "opening":
      return <Step title="Opening a table on Solana devnet…" />;
    case "joining":
      return <Step title="Approve your seat in your wallet (popup 2): 0.01 SOL entry plus the hand account's rent." />;
    case "signing-in":
      return <Step title="Sign the message in your wallet (popup 3)." text="It proves to the Private ER that the sealed hand is yours; no transaction, no fee." />;
    case "dealing":
      return <Step title="Seating the bots, moving the table to the Private ER and dealing with VRF." text="About 30 seconds." />;
    case "claim":
      return <Step title="Paying the pot to the winning seat on Solana…" />;
    case "sweeping":
      return <Step title="Sweeping the house and bot keys back to your wallet…" />;
    case "error":
      return (
        <>
          <p className="desk-panel__title">The round stopped</p>
          <p className="desk-panel__text" role="alert">{ui.message}</p>
          <div className="btn-row">
            <button type="button" className="btn btn--primary" onClick={w.retry}>Try again</button>
            <a className="btn btn--secondary" href={EXPRESS_HREF}>Express mode (no wallet)</a>
          </div>
          <p className="desk-note">{WALLET_COMPAT}</p>
        </>
      );
    case "trading":
    case "bell":
    case "settled":
      return null;
  }
}

/** True when the wallet state has its own panel (every state but trading, bell and settled). */
export function hasWalletPanel(w: WalletApi): boolean {
  return w.ui.kind !== "trading" && w.ui.kind !== "bell" && w.ui.kind !== "settled";
}
