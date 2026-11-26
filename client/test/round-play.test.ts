import { describe, expect, it } from "vitest";
import { sideCode } from "../src/round-play";

describe("round play", () => {
  it("encodes sides the way the program reads them", () => {
    expect(sideCode("buy")).toBe(0);
    expect(sideCode("sell")).toBe(1);
  });
});
