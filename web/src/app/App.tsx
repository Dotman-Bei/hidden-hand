import { Suspense, lazy, useEffect } from "react";
import { Desk } from "./Desk";
import { Tape } from "./Tape";
import type { RoundApi } from "./useRound";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}

/** One delegated handler for every [data-copy] button on the page: the desk's, the nav's and the footer's. */
function useCopyButtons(): void {
  useEffect(() => {
    const timers = new WeakMap<Element, number>();
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-copy]");
      if (!el) return;
      void copyText(el.dataset.copy ?? "").then((ok) => {
        if (!ok) return;
        el.setAttribute("data-copied", "true");
        window.clearTimeout(timers.get(el));
        timers.set(el, window.setTimeout(() => el.removeAttribute("data-copied"), 1800));
      });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
}

const IDLE: RoundApi = {
  roundParam: null, mode: "tee", ui: { kind: "no-round" }, view: null, nowMs: 0, seatKey: "", balance: null, mySeat: null, myHand: null,
  erRpc: "", sent: [], acting: null, actionError: null, table: null, join: async () => {}, trade: async () => {}, retry: () => {},
};
const LiveApp = lazy(() => import("./useRound").then((m) => ({ default: m.LiveApp })));
const idle = <Desk r={IDLE} tape={<Tape r={IDLE} />} />;

export function App() {
  useCopyButtons();
  const named = new URLSearchParams(window.location.search).get("round") !== null;
  if (!named) return idle;
  return (
    <Suspense fallback={idle}>
      <LiveApp />
    </Suspense>
  );
}
