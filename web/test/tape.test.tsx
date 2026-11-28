// @vitest-environment jsdom
import type { TableView, TradeView } from "@hidden-hand/client";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Tape } from "../src/app/Tape";
import type { RoundApi } from "../src/app/useRound";

const trade = (index: number, seat: number, secs: number): TradeView => ({ index, seat, side: "buy", qty: 1, priceAfterC: 6500, ts: 1000 + secs });

afterEach(cleanup);

describe("the tape", () => {
  it("numbers your own trades like everyone else's: #N · time, still linked to the Rollup", () => {
    // seat 1 is this browser's; it sent the newest of its two trades (index 10) and holds that signature
    const view = { startTs: 1000, trades: [trade(8, 0, 12), trade(9, 2, 30), trade(10, 0, 36)] } as unknown as TableView;
    const r = { view, mySeat: 0, sent: [{ sig: "SIG1", side: "buy", qty: 1 }], erRpc: "https://er.example" } as unknown as RoundApi;
    render(<Tape r={r} />);
    const rows = screen.getAllByRole("listitem");
    expect(rows.map((li) => li.querySelector(".desk__tape-time")?.textContent)).toEqual(["#11 · 0:36", "#10 · 0:30", "#9 · 0:12"]);
    const own = screen.getByRole("link", { name: "Seat 1 bought 1 at 65.00" });
    expect(own.getAttribute("href")).toContain("/tx/SIG1");
    expect(rows[0]?.contains(own)).toBe(true);
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });
});
