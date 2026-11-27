import { describe, expect, it } from "vitest";
import { DEFAULT_DEAL_MODE, resolveDealMode } from "../src/config";

describe("deal mode config", () => {
  it("defaults to the Private ER (tee)", () => {
    expect(resolveDealMode(undefined)).toBe("tee");
    if (process.env.HH_DEAL_MODE === undefined) expect(DEFAULT_DEAL_MODE).toBe("tee");
  });

  it("HH_DEAL_MODE switches it to commit-reveal (or back to tee)", () => {
    expect(resolveDealMode("commit-reveal")).toBe("commit-reveal");
    expect(resolveDealMode(" commit-reveal ")).toBe("commit-reveal");
    expect(resolveDealMode("tee")).toBe("tee");
  });

  it("an invalid value falls back to tee without throwing", () => {
    expect(resolveDealMode("")).toBe("tee");
    expect(resolveDealMode("vrf")).toBe("tee");
    expect(resolveDealMode("COMMIT_REVEAL")).toBe("tee");
  });
});
