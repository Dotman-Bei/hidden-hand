// @vitest-environment jsdom
// Wallet mode's own wiring on the page's real markup: WalletApp, a Wallet Standard mock wallet, no network.
import { readFileSync } from "node:fs";
import { URL as NodeURL, fileURLToPath } from "node:url";
import { Keypair } from "@solana/web3.js";
import { act, cleanup, fireEvent, render, renderHook, screen, within } from "@testing-library/react";
import { getWallets } from "@wallet-standard/app";
import { useLayoutEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockStandardWallet } from "@hidden-hand/client";
import { useFooterAction } from "../src/app/wallet/useFooterAction";
import { WalletApp } from "../src/app/wallet/WalletApp";
import { MODAL_TITLE } from "../src/app/wallet/WalletModal";

vi.mock("@hidden-hand/client", async (original) => ({
  ...(await original<typeof import("@hidden-hand/client")>()),
  baseConnection: () => ({ getBalance: async () => 1_234_000_000 }),
}));
vi.mock("@hidden-hand/bots/house", async (original) => ({
  ...(await original<typeof import("@hidden-hand/bots/house")>()),
  liveHouseIo: () => ({ rent: () => Promise.reject(new Error("offline")) }),
}));

const html = readFileSync(fileURLToPath(new NodeURL("../app/index.html", import.meta.url)), "utf8");
const kp = Keypair.generate();
const address = kp.publicKey.toBase58();
const short = `${address.slice(0, 4)}…${address.slice(-4)}`;
let unregister: () => void = () => {};

/** The page's markup, its inline mode scripts run, and the app mounted in #app-root as main.tsx mounts it. */
function boot() {
  window.history.replaceState(null, "", "/app/");
  document.body.innerHTML = new DOMParser().parseFromString(html, "text/html").body.innerHTML;
  for (const s of Array.from(document.querySelectorAll("script[data-hh-mode]"))) new Function(s.textContent ?? "")();
  const root = document.getElementById("app-root") as HTMLElement;
  root.replaceChildren();
  render(<WalletApp />, { container: root });
}

const footer = () => document.querySelector<HTMLElement>("#contact .closing__cta .btn") as HTMLElement;
const inFooter = () => document.querySelectorAll("#contact .closing__cta .btn");
const heading = () => document.getElementById("close-h")?.textContent;
const lead = () => document.querySelector("#close-h + p")?.textContent;
const HEADING = "Play a round with your wallet";
const LEAD_OFF = "Connect a devnet wallet and take a seat; three bots take the rest.";
const LEAD_ON = "Your wallet is connected. Take your seat; three bots take the rest.";

async function pick() {
  const dialog = screen.getByRole("dialog", { name: MODAL_TITLE });
  await act(async () => {
    fireEvent.click(within(dialog).getByRole("button", { name: /Mock Wallet/ }));
  });
}

async function disconnectFromNav() {
  const nav = document.querySelector<HTMLElement>(".nav__actions") as HTMLElement;
  fireEvent.click(within(nav).getByRole("button", { expanded: false }));
  await act(async () => {
    fireEvent.click(within(nav).getByRole("menuitem", { name: "Disconnect" }));
  });
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  unregister = getWallets().register(mockStandardWallet(kp, { name: "Mock Wallet" }));
});

afterEach(() => {
  cleanup();
  unregister();
  document.body.innerHTML = "";
  sessionStorage.clear();
  vi.unstubAllGlobals();
});

describe("the wallet strip", () => {
  it("shows the name, the address, the balance and the popup count, with no Disconnect of its own", async () => {
    boot();
    fireEvent.click(footer());
    await pick();
    const strip = screen.getByRole("region", { name: "Your wallet" });
    expect(within(strip).getByText("Mock Wallet")).toBeTruthy();
    expect(within(strip).getByText(short)).toBeTruthy();
    expect(within(strip).getByText("1.23 SOL")).toBeTruthy();
    expect(within(strip).getByText("Popups signed: 0")).toBeTruthy();
    expect(within(strip).queryByRole("button")).toBeNull();
    expect(strip.textContent).not.toContain("Disconnect");

    // the one Disconnect left is the nav account menu's, and it still takes the strip down
    await disconnectFromNav();
    expect(screen.queryByRole("region", { name: "Your wallet" })).toBeNull();
    expect(screen.queryByText("Disconnect")).toBeNull();
  });
});

describe("the closing section's lead", () => {
  it("asks to connect until a wallet connects, then says it is connected, and back; the heading stays", async () => {
    boot();
    expect(heading()).toBe(HEADING);
    expect(lead()).toBe(LEAD_OFF);

    fireEvent.click(footer());
    await pick();
    expect(lead()).toBe(LEAD_ON);
    expect(footer().textContent).toBe("Open the pit");
    expect(heading()).toBe(HEADING);

    await disconnectFromNav();
    expect(lead()).toBe(LEAD_OFF);
    expect(footer().textContent).toBe("Connect wallet");
    expect(heading()).toBe(HEADING);
  });

  it("changes in the same commit as the button, before paint", () => {
    document.body.innerHTML = `<footer id="contact"><div class="closing__cta"><h2 id="close-h">${HEADING}</h2><p>${LEAD_OFF}</p><button class="btn btn--primary" data-wallet-connect>Connect wallet</button></div></footer>`;
    const seen: [string | null | undefined, string | null | undefined][] = [];
    // a sibling layout effect runs after the hook's own and before the browser can paint
    const { rerender } = renderHook(
      ({ connected }) => {
        useFooterAction(connected);
        useLayoutEffect(() => {
          seen.push([lead(), footer().textContent]);
        }, [connected]);
      },
      { initialProps: { connected: false } },
    );
    rerender({ connected: true });
    rerender({ connected: false });
    expect(seen).toEqual([[LEAD_OFF, "Connect wallet"], [LEAD_ON, "Open the pit"], [LEAD_OFF, "Connect wallet"]]);
  });

  it("is left alone in Express mode's markup, which has no wallet button", () => {
    const express = "One command opens a devnet round and seats the bots.";
    document.body.innerHTML = `<footer id="contact"><div class="closing__cta"><h2 id="close-h">Start a round of your own</h2><p>${express}</p><button class="btn btn--primary copy">Copy the demo command</button></div></footer>`;
    renderHook(() => useFooterAction(true));
    expect(lead()).toBe(express);
    expect(footer().textContent).toBe("Copy the demo command");
  });
});

describe("the closing section's button in wallet mode", () => {
  it("is Connect wallet until a wallet connects, then a link to the pit with the focus, and back again", async () => {
    boot();
    const button = footer();
    expect(button.tagName).toBe("BUTTON");
    expect(button.textContent).toBe("Connect wallet");

    button.focus();
    fireEvent.click(button);
    await pick();
    expect(screen.queryByRole("dialog")).toBeNull();
    const link = footer();
    expect(inFooter()).toHaveLength(1);
    expect(link.tagName).toBe("A");
    expect(link.textContent).toBe("Open the pit");
    expect(link.getAttribute("href")).toBe("#top"); // the same place as the footer's Live pit link
    expect(document.querySelector('#contact .footer__col a[href="#top"]')?.textContent).toBe("Live pit");
    expect(document.getElementById("top")?.tagName).toBe("MAIN");
    expect(link.className).toBe("btn btn--primary");
    expect(link.hasAttribute("data-wallet-connect")).toBe(false);
    expect(document.activeElement).toBe(link); // not <body>, though the button the modal was opened from left the page

    fireEvent.click(link);
    expect(screen.queryByRole("dialog")).toBeNull();

    await disconnectFromNav();
    expect(inFooter()).toHaveLength(1);
    expect(footer()).toBe(button);
    expect(button.textContent).toBe("Connect wallet");

    fireEvent.click(button);
    expect(screen.getByRole("dialog", { name: MODAL_TITLE })).toBeTruthy();
    await pick();
    expect(footer().textContent).toBe("Open the pit");
    expect(document.activeElement).toBe(footer());
    expect(inFooter()).toHaveLength(1);
  });

  it("carries the focus to the link when the button holds it as the swap happens, and back", () => {
    document.body.innerHTML = '<footer id="contact"><div class="closing__cta"><button class="btn btn--primary" data-wallet-connect>Connect wallet</button></div></footer>';
    const { rerender } = renderHook(({ connected }) => useFooterAction(connected), { initialProps: { connected: false } });
    const button = footer();
    button.focus();
    rerender({ connected: true });
    expect(footer().textContent).toBe("Open the pit");
    expect(document.activeElement).toBe(footer());
    rerender({ connected: false });
    expect(footer()).toBe(button);
    expect(document.activeElement).toBe(button);
  });

  it("also changes when the wallet was connected from the nav, and takes no focus then", async () => {
    boot();
    const nav = document.querySelector<HTMLElement>(".nav__actions") as HTMLElement;
    fireEvent.click(within(nav).getByRole("button", { name: "Connect wallet" }));
    await pick();
    expect(within(nav).getByRole("button", { name: new RegExp(`^${short}`) })).toBeTruthy();
    expect(footer().textContent).toBe("Open the pit");
    expect(document.activeElement).not.toBe(footer());
    expect(document.activeElement).not.toBe(document.body);
  });
});
