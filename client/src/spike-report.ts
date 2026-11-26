export type CheckId = "a" | "b" | "c" | "f";
export interface CheckResult { id: CheckId; pass: boolean; detail: string }

const ORDER: CheckId[] = ["a", "b", "c", "f"];
const TITLES: Record<CheckId, string> = {
  a: "TEE auth-token read of a permissioned account (owner reads, stranger cannot)",
  b: "VRF request + callback served inside the TEE ER (DEFAULT_EPHEMERAL_QUEUE)",
  c: "reveal of private state at settlement (reveal_hands flips every hand public)",
  f: "informational: VRF request + callback on devnet-as (the fallback path)",
};

export function formatSpikeResult(at: Date, programId: string, results: CheckResult[]): string {
  const byId = new Map(results.map((r) => [r.id, r]));
  const lines = ["# Spike result", "", `- run: ${at.toISOString()}`, `- program: ${programId}`, ""];
  for (const id of ORDER) {
    const r = byId.get(id) ?? { id, pass: false, detail: "not run" };
    const detail = r.detail.replace(/\s+/g, " ").trim().slice(0, 400);
    lines.push(`(${id}) ${r.pass ? "PASS" : "FAIL"} — ${TITLES[id]}: ${detail}`);
  }
  const eligible = ["a", "b", "c"].every((id) => byId.get(id as CheckId)?.pass === true);
  lines.push("", `TEE path eligible: ${eligible ? "yes — keep manifest.json" : "no — switch to manifest-fallback.json"}`, "");
  return lines.join("\n");
}
