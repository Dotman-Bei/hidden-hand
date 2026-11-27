export interface ProofData {
  generatedAt: string; mode: "tee" | "commit-reveal"; programId: string; table: string; roundId: string; validator: string; erRpc: string;
  base: { openTable: string; joins: string[]; delegations: string[]; commitUndelegate: string[]; claimPot: string };
  er: { setup: string[]; requestDeal: string; trades: string[]; reveal: string[]; settle: string };
  result: { hiddenSum: number; closeC: number; winnerSeat: number; winner: string; pnlC: number[]; potLamports: number; cards: number[] };
}

const tx = (s: string) => `https://explorer.solana.com/tx/${s}?cluster=devnet`;
const addr = (a: string) => `https://explorer.solana.com/address/${a}?cluster=devnet`;
const SIG = "[1-9A-HJ-NP-Za-km-z]{64,90}";

export function formatProof(d: ProofData): string {
  const row = (step: string, s: string) => `| ${step} | \`${s}\` | [explorer](${tx(s)}) |`;
  const L: string[] = [
    "# Devnet round proof", "",
    `- generated: ${d.generatedAt}`,
    `- deal mode: ${d.mode}`,
    `- program: ${d.programId} ([explorer](${addr(d.programId)}))`,
    `- table PDA: ${d.table}`,
    `- round id: ${d.roundId}`,
    `- ER: ${d.erRpc} (validator ${d.validator})`, "",
    "## Base layer (Solana devnet)", "",
    "| step | signature | explorer |", "|---|---|---|",
    row("open_table", d.base.openTable),
    ...d.base.joins.map((s, i) => row(`join_table seat ${i}`, s)),
    ...d.base.delegations.map((s, i) => row(i === 0 ? "delegate_pda table" : `delegate_pda hand ${i - 1}`, s)),
    ...d.base.commitUndelegate.map((s) => row("commit/undelegate (validator)", s)),
    row("claim_pot", d.base.claimPot), "",
    "## Ephemeral Rollup", "",
    "ER signatures are read through the ER RPC above (the TEE needs an auth token; none is stored here).", "",
    "| step | signature |", "|---|---|",
    ...d.er.setup.map((s) => `| permissions / setup | \`${s}\` |`),
    `| request_deal (VRF) | \`${d.er.requestDeal}\` |`,
    `| trades | ${d.er.trades.length} trades; first \`${d.er.trades[0] ?? "none"}\` |`,
    ...d.er.reveal.map((s) => `| reveal | \`${s}\` |`),
    `| settle_round | \`${d.er.settle}\` |`, "",
    "## Result", "",
    `- hidden sum: ${d.result.hiddenSum}`,
    `- close: ${(d.result.closeC / 100).toFixed(2)} (|close − sum| = ${Math.abs(d.result.closeC / 100 - d.result.hiddenSum).toFixed(2)})`,
    `- cards: ${d.result.cards.join(", ")}`,
    `- winner: seat ${d.result.winnerSeat} (${d.result.winner}), pot ${(d.result.potLamports / 1e9).toFixed(3)} SOL`,
    `- P&L (points): ${d.result.pnlC.map((p) => (p / 100).toFixed(2)).join(", ")}`, "",
    `Explorer link for the submission form (a base-layer delegation of our program): ${tx(d.base.delegations[0] ?? "")}`, "",
  ];
  return L.join("\n");
}

export function checkProof(text: string): { ok: boolean; missing: string[] } {
  const need: [string, RegExp][] = [
    ["program id", /^- program: [1-9A-HJ-NP-Za-km-z]{32,44} /m],
    ["base delegate_pda table signature", new RegExp(`^\\| delegate_pda table \\| \`${SIG}\``, "m")],
    ["base commit/undelegate signature", new RegExp(`^\\| commit/undelegate \\(validator\\) \\| \`${SIG}\``, "m")],
    ["base claim_pot signature", new RegExp(`^\\| claim_pot \\| \`${SIG}\``, "m")],
    ["request_deal signature", new RegExp(`^\\| request_deal \\(VRF\\) \\| \`${SIG}\``, "m")],
    ["hidden sum", /^- hidden sum: \d+$/m],
    ["winner", /^- winner: seat [0-3] /m],
  ];
  const missing = need.filter(([, re]) => !re.test(text)).map(([name]) => name);
  return { ok: missing.length === 0, missing };
}
