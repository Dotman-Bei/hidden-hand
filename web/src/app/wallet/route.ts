/** Wallet mode is the default; the runner's /app/?round=<id> link and ?mode=express keep Express mode. */
export function playMode(search: string): "wallet" | "express" {
  const p = new URLSearchParams(search);
  return p.get("round") !== null || p.get("mode") === "express" ? "express" : "wallet";
}
