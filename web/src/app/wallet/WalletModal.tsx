import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface WalletChoice {
  name: string;
  icon: string;
}

export const MODAL_TITLE = "Connect a wallet on Solana to continue";
export const DETECTED = "Detected";
export const NO_WALLET = "No Solana wallet found in this browser. Install one, switch it to devnet, then reload this page.";

/** The official sites, in the order the empty state lists them. */
export const INSTALL_LINKS: readonly { name: string; href: string }[] = [
  { name: "Phantom", href: "https://phantom.com/" },
  { name: "Solflare", href: "https://solflare.com/" },
  { name: "Backpack", href: "https://backpack.app/" },
];

/** Tested on devnet (docs/gates/wallet-manual-test.md): one short line a wallet. */
export const COMPAT_LINES: readonly { wallet: string; text: string }[] = [
  { wallet: "Solflare", text: "connect, funding, join and sign-in work; Rollup trades are blocked by the wallet." },
  { wallet: "OKX", text: "blocked at the first popup." },
  { wallet: "Phantom", text: "not tested yet." },
];

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface WalletModalProps {
  wallets: WalletChoice[];
  /** Runs the wallet's connect popup; resolves null when it connected, else the words to show. */
  onSelect(name: string): Promise<string | null>;
  onClose(): void;
  /** The control that opened the modal: the focus returns to it. */
  opener: HTMLElement | null;
  /** Where the focus goes when the opener left the page (a connect replaces it). */
  fallbackFocus?: () => HTMLElement | null;
}

/**
 * The wallet picker: a modal dialog over the page (role="dialog", aria-modal), the page behind it inert,
 * the focus held inside, Escape, the close button and a click on the dim all close it.
 */
export function WalletModal({ wallets, onSelect, onClose, opener, fallbackFocus }: WalletModalProps) {
  const overlay = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  const downOnDim = useRef(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();

  // open: the page behind goes inert and stops scrolling, the focus moves in; close: all of it comes back
  useEffect(() => {
    alive.current = true;
    const host = overlay.current;
    const behind = Array.from(document.body.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el !== host && el.tagName !== "SCRIPT" && !el.hasAttribute("inert"),
    );
    behind.forEach((el) => el.setAttribute("inert", ""));
    document.documentElement.classList.add("wallet-modal-open");
    const first = panel.current?.querySelector<HTMLElement>("[data-autofocus]") ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      const box = panel.current;
      if (!box) return;
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation(); // the nav's own Escape (it closes the phone sheet) waits for the next press
        closeRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE));
      const head = items[0];
      const tail = items[items.length - 1];
      if (!head || !tail) {
        e.preventDefault();
        return;
      }
      const at = document.activeElement;
      const inside = at instanceof Node && box.contains(at);
      if (e.shiftKey && (at === head || !inside)) {
        e.preventDefault();
        tail.focus();
      } else if (!e.shiftKey && (at === tail || !inside)) {
        e.preventDefault();
        head.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);

    return () => {
      alive.current = false;
      document.removeEventListener("keydown", onKey, true);
      behind.forEach((el) => el.removeAttribute("inert"));
      document.documentElement.classList.remove("wallet-modal-open");
      const back = opener && opener.isConnected ? opener : (fallbackFocus?.() ?? null);
      back?.focus();
    };
    // opened once per mount: the opener and the fallback are read as they were when it opened
  }, []);

  const choose = async (name: string) => {
    if (pending !== null) return;
    setPending(name);
    setError(null);
    const err = await onSelect(name);
    if (!alive.current) return;
    setPending(null);
    if (err === null) closeRef.current();
    else setError(err);
  };

  const status = pending !== null ? `Approve the connection in ${pending}.` : (error ?? "");

  return createPortal(
    <div
      className="wallet-modal"
      ref={overlay}
      onMouseDown={(e) => {
        downOnDim.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && downOnDim.current) onClose();
        downOnDim.current = false;
      }}
    >
      <div className="wallet-modal__panel" ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="wallet-modal__head">
          <h2 className="wallet-modal__title" id={titleId}>{MODAL_TITLE}</h2>
          <button type="button" className="wallet-modal__close" aria-label="Close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>
        {wallets.length > 0 ? (
          <ul className="wallet-modal__list" aria-label="Wallets in this browser">
            {wallets.map((w, i) => (
              <li key={w.name}>
                <button
                  type="button"
                  className="btn btn--secondary wallet-option"
                  data-autofocus={i === 0 ? "" : undefined}
                  aria-disabled={pending !== null ? "true" : undefined}
                  onClick={() => void choose(w.name)}
                >
                  {w.icon ? <img className="wallet-option__icon" src={w.icon} alt="" width={28} height={28} /> : null}
                  <span className="wallet-option__name">{w.name}</span>
                  <span className="wallet-option__tag">{DETECTED}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <>
            <p className="wallet-modal__text">{NO_WALLET}</p>
            <ul className="wallet-modal__list" aria-label="Install a wallet">
              {INSTALL_LINKS.map((l, i) => (
                <li key={l.name}>
                  <a className="btn btn--secondary wallet-option" href={l.href} target="_blank" rel="noopener" data-autofocus={i === 0 ? "" : undefined}>
                    <span className="wallet-option__name">{`Get ${l.name}`}</span>
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="wallet-modal__status" role="status" aria-live="polite" data-error={error !== null && pending === null ? "true" : undefined}>{status}</p>
        <div className="wallet-modal__facts">
          <p className="wallet-modal__label">Tested on devnet</p>
          <ul>
            {COMPAT_LINES.map((c) => (
              <li key={c.wallet}><span className="wallet-modal__wallet">{c.wallet}</span>{`: ${c.text}`}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>,
    document.body,
  );
}
