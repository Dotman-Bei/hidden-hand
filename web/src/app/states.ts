export interface UiViewLike { phase: "open" | "dealing" | "trading" | "revealed" | "settled"; seatCount: number; endTs: number }
export interface UiInput { roundParam: string | null; loading: boolean; error: string | null; view: UiViewLike | null; nowMs: number }
export type UiState =
  | { kind: "no-round" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "waiting-for-seats" }
  | { kind: "waiting-for-deal" }
  | { kind: "trading"; secondsLeft: number }
  | { kind: "bell" }
  | { kind: "revealed" }
  | { kind: "settled" };

export function deriveUiState(i: UiInput): UiState {
  if (i.roundParam === null) return { kind: "no-round" };
  if (i.error !== null) return { kind: "error", message: i.error };
  if (i.loading || i.view === null) return { kind: "loading" };
  const v = i.view;
  switch (v.phase) {
    case "open":
      return v.seatCount < 4 ? { kind: "waiting-for-seats" } : { kind: "waiting-for-deal" };
    case "dealing":
      return { kind: "waiting-for-deal" };
    case "trading": {
      const left = Math.ceil(v.endTs - i.nowMs / 1000);
      return left > 0 ? { kind: "trading", secondsLeft: left } : { kind: "bell" };
    }
    case "revealed":
      return { kind: "revealed" };
    case "settled":
      return { kind: "settled" };
  }
}
