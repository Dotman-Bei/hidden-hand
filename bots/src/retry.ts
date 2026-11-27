/**
 * After a program upgrade the ER can keep executing the old program for a few minutes: request_deal then fails with
 * the old build's ModeNotSupported (6006) or an unknown-instruction error. Those (and only those) are worth waiting on.
 */
export const STALE_PROGRAM_TOTAL_MS = 6 * 60_000;
const BACKOFF_MS = [5_000, 10_000, 20_000];
const BACKOFF_CAP_MS = 30_000;

const STALE_PATTERNS: RegExp[] = [
  /ModeNotSupported/,
  /"Custom":\s*6006\b/,
  /custom program error: 0x1776\b/i,
  /Error Number: 6006\b/,
  /InstructionFallbackNotFound/,
  /Fallback functions are not supported/,
  /"Custom":\s*101\b/,
  /custom program error: 0x65\b/i,
  /Error Number: 101\b/,
];

function errorText(e: unknown): string {
  if (!(e instanceof Error)) return String(e);
  const logs = (e as { logs?: unknown }).logs;
  return Array.isArray(logs) ? `${e.message}\n${logs.join("\n")}` : e.message;
}

const short = (e: unknown) => (e instanceof Error ? e.message : String(e)).replace(/\s+/g, " ").slice(0, 160);

/** True for the program's ModeNotSupported (6006) or an unknown-instruction / InstructionFallbackNotFound (101) error. */
export function isStaleProgramError(e: unknown): boolean {
  const t = errorText(e);
  return STALE_PATTERNS.some((p) => p.test(t));
}

/** Wait before retry `attempt` (1-based): 5 s, 10 s, 20 s, then 30 s. */
export function staleBackoffMs(attempt: number): number {
  return BACKOFF_MS[attempt - 1] ?? BACKOFF_CAP_MS;
}

export interface RetryDeps {
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  log?: (m: string) => void;
  totalMs?: number;
}

/** Run `fn`; while it fails with a stale-program error, back off and retry for up to `totalMs` (~6 min). */
export async function retryStaleProgram<T>(fn: () => Promise<T>, deps: RetryDeps = {}): Promise<T> {
  const now = deps.now ?? Date.now;
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const log = deps.log ?? ((m: string) => console.log(m));
  const totalMs = deps.totalMs ?? STALE_PROGRAM_TOTAL_MS;
  const t0 = now();
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (!isStaleProgramError(e)) throw e;
      const elapsed = now() - t0;
      const wait = staleBackoffMs(attempt);
      if (elapsed + wait > totalMs) {
        throw new Error(
          `ER still runs the old program after ${Math.round(elapsed / 1000)}s (${attempt} attempts); ` +
            `request_deal keeps failing with: ${short(e)}`,
        );
      }
      log(`ER has not refreshed the program yet (attempt ${attempt}, ${Math.round(elapsed / 1000)}s elapsed): ${short(e)}`);
      await sleep(wait);
    }
  }
}
