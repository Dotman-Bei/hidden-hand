import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { copyText } from "./clipboard";

export const CONNECT_LABEL = "Connect wallet";
export const shortAddress = (a: string): string => `${a.slice(0, 4)}…${a.slice(-4)}`;
const sol2 = (lamports: number): string => (lamports / 1e9).toFixed(2);

export interface AccountControlProps {
  address: string | null;
  balance: number | null; // lamports on devnet
  onConnect(opener: HTMLElement): void;
  onDisconnect(): void;
  copy?: (text: string) => Promise<boolean>;
}

/**
 * The nav's wallet control: "Connect wallet" until a wallet connects, then the short address and the devnet
 * balance, opening a two-item menu (Copy address, Disconnect) that works by pointer and keyboard.
 */
export function AccountControl({ address, balance, onConnect, onDisconnect, copy = copyText }: AccountControlProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const connectBtn = useRef<HTMLButtonElement>(null);
  const refocus = useRef(false);
  const menuId = useId();

  // a disconnect from the menu hands the focus to the Connect wallet button that takes its place
  useEffect(() => {
    if (address !== null) return;
    setOpen(false);
    if (refocus.current) {
      refocus.current = false;
      connectBtn.current?.focus();
    }
  }, [address]);

  // the menu opens on its first item
  useEffect(() => {
    if (open) wrap.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [open]);

  // a press outside closes it
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target instanceof Node) || !wrap.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(id);
  }, [copied]);

  if (address === null) {
    return (
      <button ref={connectBtn} type="button" className="btn btn--primary" onClick={(e) => onConnect(e.currentTarget)}>
        {CONNECT_LABEL}
      </button>
    );
  }

  const closeToToggle = () => {
    setOpen(false);
    toggle.current?.focus();
  };

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(wrap.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const at = items.findIndex((x) => x === document.activeElement);
    const go = (i: number) => {
      e.preventDefault();
      items[(i + items.length) % items.length]?.focus();
    };
    switch (e.key) {
      case "Escape":
        e.preventDefault();
        e.stopPropagation(); // the nav's own Escape (it closes the phone sheet) waits for the next press
        closeToToggle();
        break;
      case "ArrowDown":
        go(at + 1);
        break;
      case "ArrowUp":
        go(at - 1);
        break;
      case "Home":
        go(0);
        break;
      case "End":
        go(items.length - 1);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  const onToggleKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      e.stopPropagation();
      closeToToggle();
    }
  };

  const onCopy = async () => {
    if (await copy(address)) setCopied(true);
  };

  return (
    <div className="account" ref={wrap}>
      <button
        ref={toggle}
        type="button"
        className="btn btn--secondary account__toggle"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onToggleKey}
      >
        <span className="account__addr">{shortAddress(address)}</span>
        <span className="account__bal">{balance === null ? "… SOL" : `${sol2(balance)} SOL`}</span>
      </button>
      {open && (
        <div className="account__menu" role="menu" id={menuId} aria-label="Wallet" onKeyDown={onMenuKey}>
          <button type="button" role="menuitem" tabIndex={-1} className="account__item" onClick={() => void onCopy()}>
            {copied ? "Address copied" : "Copy address"}
          </button>
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            className="account__item"
            onClick={() => {
              refocus.current = true;
              setOpen(false);
              onDisconnect();
            }}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
