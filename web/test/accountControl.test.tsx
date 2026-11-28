// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountControl, shortAddress } from "../src/app/wallet/AccountControl";

const ADDRESS = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

function Nav({ copy }: { copy: (t: string) => Promise<boolean> }) {
  const [address, setAddress] = useState<string | null>(null);
  const [opened, setOpened] = useState(0);
  return (
    <div className="nav__actions">
      <AccountControl
        address={address}
        balance={address ? 1_234_000_000 : null}
        onConnect={() => {
          setOpened((n) => n + 1);
          setAddress(ADDRESS); // the modal's connect, in small
        }}
        onDisconnect={() => setAddress(null)}
        copy={copy}
      />
      <output data-testid="opened">{opened}</output>
    </div>
  );
}

afterEach(cleanup);

describe("the nav's wallet control", () => {
  it("reads Connect wallet until a wallet connects, then the short address and the devnet balance", () => {
    render(<Nav copy={async () => true} />);
    const connect = screen.getByRole("button", { name: "Connect wallet" });
    expect(connect.className).toContain("btn--primary");
    expect(connect.hasAttribute("data-copy")).toBe(false);
    fireEvent.click(connect);
    expect(screen.getByTestId("opened").textContent).toBe("1");
    const toggle = screen.getByRole("button", { name: /^7xKX…gAsU\s*1\.23 SOL$/ });
    expect(shortAddress(ADDRESS)).toBe("7xKX…gAsU");
    expect(toggle.getAttribute("aria-haspopup")).toBe("menu");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("opens a menu of Copy address and Disconnect, works by keyboard and closes on Escape", async () => {
    const copy = vi.fn(async () => true);
    render(<Nav copy={copy} />);
    fireEvent.click(screen.getByRole("button", { name: "Connect wallet" }));
    const toggle = screen.getByRole("button", { expanded: false });

    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    const menu = screen.getByRole("menu");
    expect(toggle.getAttribute("aria-controls")).toBe(menu.id);
    const items = screen.getAllByRole("menuitem");
    expect(items.map((i) => i.textContent)).toEqual(["Copy address", "Disconnect"]);
    expect(document.activeElement).toBe(items[0]);
    fireEvent.keyDown(items[0] as HTMLElement, { key: "ArrowDown" });
    expect(document.activeElement).toBe(items[1]);
    fireEvent.keyDown(items[1] as HTMLElement, { key: "ArrowDown" });
    expect(document.activeElement).toBe(items[0]);
    fireEvent.keyDown(items[0] as HTMLElement, { key: "End" });
    expect(document.activeElement).toBe(items[1]);

    const esc = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    const reachedDocument = vi.fn();
    document.addEventListener("keydown", reachedDocument);
    act(() => {
      (items[1] as HTMLElement).dispatchEvent(esc);
    });
    document.removeEventListener("keydown", reachedDocument);
    expect(reachedDocument).not.toHaveBeenCalled(); // the nav's own Escape (the phone sheet) is left alone
    expect(screen.queryByRole("menu")).toBeNull();
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(toggle);

    fireEvent.keyDown(toggle, { key: "ArrowDown" }); // the keyboard opens it too
    expect(screen.getByRole("menu")).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole("menuitem", { name: "Copy address" }));
    });
    expect(copy).toHaveBeenCalledWith(ADDRESS);
    expect(screen.getByRole("menuitem", { name: "Address copied" })).toBeTruthy();

    fireEvent.mouseDown(document.body); // a press outside closes it
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("Disconnect turns it back into Connect wallet, with the focus on it", () => {
    render(<Nav copy={async () => true} />);
    fireEvent.click(screen.getByRole("button", { name: "Connect wallet" }));
    fireEvent.click(screen.getByRole("button", { expanded: false }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Disconnect" }));
    const connect = screen.getByRole("button", { name: "Connect wallet" });
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(connect);
  });
});
