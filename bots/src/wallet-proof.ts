import { type ProofData, checkProof, formatProof } from "./proof";

export interface WalletProofExtra {
  wallet: string;
  popups: { fund: number; join: number; signIn: number; trades: number; total: number };
  walletTrades: string[];
  delayedSign: { delayMs: number; landed: boolean; error: string | null };
  budgetLamports: number;
  spentLamports: number;
  sweptLamports: number;
}

const sol = (l: number) => (l / 1e9).toFixed(4);

export function formatWalletProof(d: ProofData, x: WalletProofExtra): string {
  const body = formatProof({ ...d, er: { ...d.er, trades: [...d.er.trades, ...x.walletTrades] } }).replace(/^# Devnet round proof/, "# Devnet wallet-mode round proof");
  const L = [
    "## Wallet mode", "",
    `- wallet (seat owner, signed through the Wallet Standard mock): ${x.wallet}`,
    `- wallet popups: ${x.popups.total} (fund ${x.popups.fund}, join ${x.popups.join}, sign-in ${x.popups.signIn}, trades ${x.popups.trades})`,
    `- wallet trades on the ER: ${x.walletTrades.length}; first \`${x.walletTrades[0] ?? "none"}\``,
    `- delayed signature (${x.delayedSign.delayMs} ms before signing): ${x.delayedSign.landed ? "landed" : `failed: ${x.delayedSign.error ?? "unknown"}`}`,
    `- budget asked: ${sol(x.budgetLamports)} SOL; spent net of the sweep: ${sol(x.spentLamports)} SOL; swept back: ${sol(x.sweptLamports)} SOL`, "",
  ];
  return `${body}\n${L.join("\n")}`;
}

const SIG = "[1-9A-HJ-NP-Za-km-z]{64,90}";
export function checkWalletProof(text: string): { ok: boolean; missing: string[] } {
  const need: [string, RegExp][] = [
    ["wallet section", /^## Wallet mode$/m],
    ["wallet popups", /^- wallet popups: \d+ \(fund 1, join 1, sign-in 1, trades [1-9]\d*\)$/m],
    ["wallet trades", new RegExp(`^- wallet trades on the ER: [1-9]\\d*; first \`${SIG}\`$`, "m")],
    ["delayed signature", /^- delayed signature \(\d+ ms before signing\): (landed|failed: .+)$/m],
  ];
  const missing = [...checkProof(text).missing, ...need.filter(([, re]) => !re.test(text)).map(([n]) => n)];
  return { ok: missing.length === 0, missing };
}
