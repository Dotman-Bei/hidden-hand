export type CheckId = "a" | "b" | "c" | "f";
export interface CheckResult { id: CheckId; pass: boolean; detail: string }

const ORDER: CheckId[] = ["a", "b", "c", "f"];
const TITLES: Record<CheckId, string> = {
  a: "TEE auth-token read of a permissioned account (owner reads, stranger cannot)",
  b: "VRF request + callback served inside the TEE ER (DEFAULT_EPHEMERAL_QUEUE)",
  c: "reveal of private state at settlement (reveal_hands flips every hand public)",
  f: "informational: VRF request + callback on devnet-as (the fallback path)",
};

/** `extra` lines (validator versions, compute units) are informational and always come after every check line. */
export function formatSpikeResult(at: Date, programId: string, results: CheckResult[], extra: string[] = []): string {
  const byId = new Map(results.map((r) => [r.id, r]));
  const lines = ["# Spike result", "", `- run: ${at.toISOString()}`, `- program: ${programId}`, ""];
  for (const id of ORDER) {
    const r = byId.get(id) ?? { id, pass: false, detail: "not run" };
    const detail = r.detail.replace(/\s+/g, " ").trim().slice(0, 400);
    lines.push(`(${id}) ${r.pass ? "PASS" : "FAIL"} — ${TITLES[id]}: ${detail}`);
  }
  const eligible = ["a", "b", "c"].every((id) => byId.get(id as CheckId)?.pass === true);
  lines.push("", `TEE path eligible: ${eligible ? "yes — keep manifest.json" : "no — switch to manifest-fallback.json"}`, "");
  if (extra.length > 0) lines.push("## Informational", "", ...extra, "");
  return lines.join("\n");
}

export const CU_WARN = 100_000;

export interface CuEntry { label: string; units: number | null; detail?: string }
export interface Invocation { name: string | null; consumed: number; limit: number }
export interface TxMetaLike { computeUnitsConsumed?: number; logMessages?: string[] | null }

const INVOKE = /^Program (\S+) invoke \[\d+\]$/;
const DONE = /^Program (\S+) (success|failed)/;
const CONSUMED = /^Program (\S+) consumed (\d+) of (\d+) compute units$/;
const IX_NAME = /^Program log: Instruction: (\S+)$/;

/** Every invocation of `programId` in a tx's logs (any CPI depth), with its Anchor instruction name and `consumed N of M`. */
export function programInvocations(logs: string[], programId: string): Invocation[] {
  const stack: { program: string; name: string | null }[] = [];
  const out: Invocation[] = [];
  for (const line of logs) {
    let m = INVOKE.exec(line);
    if (m) {
      stack.push({ program: m[1], name: null });
      continue;
    }
    m = IX_NAME.exec(line);
    if (m) {
      const top = stack[stack.length - 1];
      if (top && top.name === null) top.name = m[1];
      continue;
    }
    m = CONSUMED.exec(line);
    if (m) {
      if (m[1] === programId) out.push({ name: stack[stack.length - 1]?.name ?? null, consumed: Number(m[2]), limit: Number(m[3]) });
      continue;
    }
    m = DONE.exec(line);
    if (m && stack.length > 0 && stack[stack.length - 1].program === m[1]) stack.pop();
  }
  return out;
}

/** One CU entry per program instruction in the tx (or one tx-total entry when the program is not in it). */
export function cuEntriesForTx(label: string, meta: TxMetaLike | null, programId: string): CuEntry[] {
  if (!meta) return [{ label, units: null, detail: "transaction not found" }];
  const total = meta.computeUnitsConsumed ?? null;
  const inv = programInvocations(meta.logMessages ?? [], programId);
  if (inv.length === 0) return [{ label, units: total, detail: "tx total" }];
  return inv.map((i) => ({
    label: i.name ? `${label} ${i.name}` : label,
    units: i.consumed,
    detail: `of ${i.limit}; tx total ${total ?? "unknown"}`,
  }));
}

export function formatCuLines(entries: CuEntry[]): string[] {
  return entries.map((e) => {
    const units = e.units === null ? "unknown" : String(e.units);
    const over = e.units !== null && e.units >= CU_WARN ? ` OVER ${CU_WARN}` : "";
    const detail = e.detail ? ` (${e.detail})` : "";
    return `- cu ${e.label}: ${units}${over}${detail}`;
  });
}

/** `- validator <name>: <solana-core> / <every other version field>` or `unavailable (<error>)`. */
export function formatVersionLine(name: string, version: unknown): string {
  if (version instanceof Error || version === null || typeof version !== "object") {
    const why = version instanceof Error ? version.message : String(version);
    return `- validator ${name}: unavailable (${why.replace(/\s+/g, " ").slice(0, 200)})`;
  }
  const v = version as Record<string, unknown>;
  const core = v["solana-core"] === undefined ? "unknown" : String(v["solana-core"]);
  const rest = Object.keys(v)
    .filter((k) => k !== "solana-core")
    .map((k) => `${k}=${typeof v[k] === "object" ? JSON.stringify(v[k]) : String(v[k])}`);
  return `- validator ${name}: ${core}${rest.length > 0 ? ` / ${rest.join(", ")}` : ""}`;
}
