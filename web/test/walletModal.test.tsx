// @vitest-environment jsdom
import { Keypair } from "@solana/web3.js";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { getWallets } from "@wallet-standard/app";
import type { Wallet } from "@wallet-standard/base";
import { useRef, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { connectStandard, mockStandardWallet } from "@hidden-hand/client";
import { CONNECT_CLOSED, connectErrorText } from "../src/app/wallet/connectError";
import { useDetectedWallets } from "../src/app/wallet/useDetectedWallets";
import { COMPAT_LINES, INSTALL_LINKS, MODAL_TITLE, NO_WALLET, WalletModal } from "../src/app/wallet/WalletModal";

const unregister: (() => void)[] = [];
const add = (w: Wallet): Wallet => {
  unregister.push(getWallets().register(w));
  return w;
};

/** A mock wallet whose connect popup is a spy: it resolves, or rejects the way a wallet's Cancel does. */
function spyWallet(name: string, reject: () => boolean = () => false) {
  const w = mockStandardWallet(Keypair.generate(), { name });
  const features = w.features as unknown as { "standard:connect": { version: string; connect: () => Promise<{ accounts: readonly unknown[] }> } };
  const real = features["standard:connect"].connect;
  const connect = vi.fn(async () => {
    if (reject()) throw new Error("User rejected the request.");
    return real();
  });
  features["standard:connect"] = { version: "1.0.0", connect };
  return { wallet: w, connect };
}

/** The page's wiring in small: a Connect wallet button, live Wallet Standard discovery and the wallet's own connect popup. */
function Harness({ onConnected }: { onConnected?: (name: string) => void }) {
  const found = useDetectedWallets();
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  return (
    <>
      <header><button type="button" onClick={(e) => { opener.current = e.currentTarget; setOpen(true); }}>Connect wallet</button></header>
      <main><a href="#x">Elsewhere</a></main>
      {open && (
        <WalletModal
          wallets={found.map((w) => ({ name: w.name, icon: w.icon }))}
          opener={opener.current}
          onClose={() => setOpen(false)}
          onSelect={async (name) => {
            const w = found.find((x) => x.name === name);
            if (!w) return "gone";
            try {
              await connectStandard(w);
              onConnected?.(name);
              return null;
            } catch (e) {
              return connectErrorText(e);
            }
          }}
        />
      )}
    </>
  );
}

const openModal = () => {
  fireEvent.click(screen.getByRole("button", { name: "Connect wallet" }));
  return screen.getByRole("dialog", { name: MODAL_TITLE });
};

afterEach(() => {
  cleanup();
  while (unregister.length) unregister.pop()?.();
});

describe("the connect modal", () => {
  it("opens from the button and closes by the X, Escape and the dim, the focus back on the opener each time", () => {
    add(mockStandardWallet(Keypair.generate(), { name: "Mock Wallet" }));
    render(<Harness />);
    const opener = screen.getByRole("button", { name: "Connect wallet" });

    let dialog = openModal();
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(document.getElementById(dialog.getAttribute("aria-labelledby") ?? "")?.textContent).toBe(MODAL_TITLE);
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(document.querySelector("header")?.closest("[inert]")).not.toBeNull(); // the page behind the modal
    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
    expect(document.querySelector("header")?.closest("[inert]")).toBeNull();

    dialog = openModal();
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);

    dialog = openModal();
    const dim = dialog.parentElement as HTMLElement;
    fireEvent.mouseDown(dialog);
    fireEvent.click(dialog); // a press inside the window never closes it
    expect(screen.queryByRole("dialog")).not.toBeNull();
    fireEvent.mouseDown(dim);
    fireEvent.click(dim);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it("holds the focus inside while open", () => {
    add(mockStandardWallet(Keypair.generate(), { name: "Mock Wallet" }));
    render(<Harness />);
    const dialog = openModal();
    const close = within(dialog).getByRole("button", { name: "Close" });
    const wallet = within(dialog).getByRole("button", { name: /Mock Wallet/ });
    expect(document.activeElement).toBe(wallet); // the first wallet takes the focus
    fireEvent.keyDown(wallet, { key: "Tab" }); // the last control: Tab wraps to the first
    expect(document.activeElement).toBe(close);
    fireEvent.keyDown(close, { key: "Tab", shiftKey: true }); // and back
    expect(document.activeElement).toBe(wallet);
  });

  it("lists every detected Solana wallet with its icon, name and a Detected tag, live; a wallet that cannot sign is not listed", () => {
    add(mockStandardWallet(Keypair.generate(), { name: "Mock Wallet" }));
    const plain = mockStandardWallet(Keypair.generate(), { name: "No Signer" });
    delete (plain.features as Record<string, unknown>)["solana:signMessage"];
    add(plain);
    render(<Harness />);
    const dialog = openModal();
    const list = within(dialog).getByRole("list", { name: "Wallets in this browser" });
    let rows = within(list).getAllByRole("button");
    expect(rows.map((r) => r.textContent)).toEqual(["Mock WalletDetected"]);
    expect(rows[0]?.querySelector("img")?.getAttribute("src")).toMatch(/^data:image\/svg\+xml/);

    act(() => {
      add(mockStandardWallet(Keypair.generate(), { name: "Second Wallet" }));
    });
    rows = within(list).getAllByRole("button");
    expect(rows.map((r) => r.textContent)).toEqual(["Mock WalletDetected", "Second WalletDetected"]);
    expect(within(dialog).queryByText(NO_WALLET)).toBeNull();
  });

  it("with no wallet shows the install links: Phantom, Solflare, Backpack, each in a new tab", () => {
    render(<Harness />);
    const dialog = openModal();
    expect(within(dialog).getByText(NO_WALLET)).toBeTruthy();
    expect(within(dialog).queryByRole("list", { name: "Wallets in this browser" })).toBeNull();
    const links = within(within(dialog).getByRole("list", { name: "Install a wallet" })).getAllByRole("link");
    expect(links.map((a) => a.textContent)).toEqual(["Get Phantom (opens in a new tab)", "Get Solflare (opens in a new tab)", "Get Backpack (opens in a new tab)"]);
    expect(links.map((a) => a.getAttribute("href"))).toEqual(INSTALL_LINKS.map((l) => l.href));
    expect(INSTALL_LINKS.map((l) => l.name)).toEqual(["Phantom", "Solflare", "Backpack"]);
    for (const a of links) {
      expect(a.getAttribute("target")).toBe("_blank");
      expect(a.getAttribute("rel")).toBe("noopener");
    }
  });

  it("carries the tested compatibility, one line a wallet", () => {
    render(<Harness />);
    const dialog = openModal();
    const text = dialog.querySelector(".wallet-modal__facts")?.textContent ?? "";
    expect(text).toContain("Solflare: connect, funding, join and sign-in work; Rollup trades are blocked by the wallet.");
    expect(text).toContain("OKX: blocked at the first popup.");
    expect(text).toContain("Phantom: not tested yet.");
    expect(COMPAT_LINES).toHaveLength(3);
  });

  it("selecting a wallet runs its connect popup; success closes the modal", async () => {
    const { wallet, connect } = spyWallet("Mock Wallet");
    add(wallet);
    const connected = vi.fn();
    render(<Harness onConnected={connected} />);
    const dialog = openModal();
    await act(async () => {
      fireEvent.click(within(dialog).getByRole("button", { name: /Mock Wallet/ }));
    });
    expect(connect).toHaveBeenCalledTimes(1);
    expect(connected).toHaveBeenCalledWith("Mock Wallet");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("a rejected popup shows its words in the modal's live region and the list stays usable", async () => {
    let refuse = true;
    const { wallet, connect } = spyWallet("Mock Wallet", () => refuse);
    add(wallet);
    render(<Harness />);
    const dialog = openModal();
    const row = within(dialog).getByRole("button", { name: /Mock Wallet/ });
    await act(async () => {
      fireEvent.click(row);
    });
    expect(connect).toHaveBeenCalledTimes(1);
    const status = within(dialog).getByRole("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.textContent).toBe(CONNECT_CLOSED);
    expect(screen.getByRole("dialog")).toBe(dialog);
    expect(row.hasAttribute("disabled")).toBe(false);
    expect(row.getAttribute("aria-disabled")).toBeNull();

    refuse = false;
    await act(async () => {
      fireEvent.click(row);
    });
    expect(connect).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
