// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { URL as NodeURL, fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { playMode } from "../src/app/wallet/route";

const DEMO = "pnpm --filter @hidden-hand/bots demo-round -- --demo";
const html = readFileSync(fileURLToPath(new NodeURL("../app/index.html", import.meta.url)), "utf8");

/** Loads the page's markup at a URL and runs its inline mode scripts, as the parser does before the app hydrates. */
function boot(url: string): Document {
  window.history.replaceState(null, "", url);
  const parsed = new DOMParser().parseFromString(html, "text/html");
  document.body.innerHTML = parsed.body.innerHTML;
  const scripts = Array.from(document.querySelectorAll<HTMLScriptElement>("script[data-hh-mode]"));
  expect(scripts.length).toBe(3);
  for (const s of scripts) new Function(s.textContent ?? "")();
  return document;
}

const nav = (d: Document) => d.querySelector<HTMLElement>(".nav__actions .btn") as HTMLElement;
const foot = (d: Document) => d.querySelector<HTMLElement>("#contact .closing__cta .btn") as HTMLElement;

describe("the inline mode scripts", () => {
  it("wallet mode (the default URL): Connect wallet in the nav and the footer, no data-copy, the footer's wallet heading", () => {
    expect(playMode("")).toBe("wallet");
    const d = boot("/app/");
    for (const b of [nav(d), foot(d)]) {
      expect(b.textContent).toBe("Connect wallet");
      expect(b.hasAttribute("data-copy")).toBe(false);
      expect(b.classList.contains("copy")).toBe(false);
      expect(b.hasAttribute("data-wallet-connect")).toBe(true);
      expect(b.className).toContain("btn--primary");
    }
    expect(d.getElementById("close-h")?.textContent).toBe("Play a round with your wallet");
    expect(d.querySelector("#close-h + p")?.textContent).toBe("Connect a devnet wallet and take a seat; three bots take the rest.");
    expect((d.getElementById("lead-wallet") as HTMLElement).hidden).toBe(false);
    expect((d.getElementById("lead-express") as HTMLElement).hidden).toBe(true);
    // the Express desk's own copy button (static, in the hero) keeps its command
    expect(d.querySelector("#app-root [data-copy]")?.getAttribute("data-copy")).toBe(DEMO);
  });

  for (const url of ["/app/?mode=express", "/app/?round=1764230000000"]) {
    it(`express mode (${url}): the nav and the footer keep Copy the demo command and its data-copy`, () => {
      expect(playMode(url.slice(url.indexOf("?")))).toBe("express");
      const d = boot(url);
      for (const b of [nav(d), foot(d)]) {
        expect(b.textContent).toBe("Copy the demo command");
        expect(b.getAttribute("data-copy")).toBe(DEMO);
        expect(b.classList.contains("copy")).toBe(true);
        expect(b.hasAttribute("data-wallet-connect")).toBe(false);
      }
      expect(d.getElementById("close-h")?.textContent).toBe("Start a round of your own");
      expect(d.querySelector("#close-h + p")?.textContent).toBe("One command opens a devnet round and seats the bots.");
      expect((d.getElementById("lead-wallet") as HTMLElement).hidden).toBe(true);
      expect((d.getElementById("lead-express") as HTMLElement).hidden).toBe(false);
    });
  }
});
