import { useEffect, useState } from "react";
import type { PublicKey } from "@solana/web3.js";
import { ENTRY_LAMPORTS, PROGRAM_ID, baseConnection, explorerAddress, explorerTx } from "@hidden-hand/client";

interface SigRow { signature: string; blockTime: number | null; failed: boolean }

const short = (s: string): string => `${s.slice(0, 6)}…${s.slice(-6)}`;
const when = (t: number | null): string =>
  t === null ? "pending" : new Date(t * 1000).toISOString().slice(11, 19) + " UTC";

const KINDS: { name: string; line: string }[] = [
  { name: "Delegate", line: "The table moves to the Rollup." },
  { name: "Commit", line: "The Rollup writes its state to Solana." },
  { name: "Undelegate", line: "The table returns to Solana." },
  { name: "Claim", line: "The vault pays the winner." },
];

export function Record({ table }: { table: PublicKey | null }) {
  const [rows, setRows] = useState<SigRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const address = table ? table.toBase58() : null;

  useEffect(() => {
    if (!table) return;
    let stop = false;
    const base = baseConnection();
    const load = async () => {
      try {
        const list = await base.getSignaturesForAddress(table, { limit: 20 }, "confirmed");
        if (stop) return;
        setRows(list.map((x) => ({ signature: x.signature, blockTime: x.blockTime ?? null, failed: x.err !== null })));
        setFailed(false);
      } catch {
        if (!stop) setFailed(true);
      }
    };
    void load();
    const id = window.setInterval(load, 10_000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [table]);

  const program = PROGRAM_ID.toBase58();
  return (
    <>
      <div className="span-5 record__facts">
        <ul className="rows">
          <li><span className="rows__name">Program</span><a className="rows__value link" href={explorerAddress(program)} target="_blank" rel="noreferrer">{short(program)}</a></li>
          <li>
            <span className="rows__name">Table</span>
            {address ? (
              <a className="rows__value link" href={explorerAddress(address)} target="_blank" rel="noreferrer">{short(address)}</a>
            ) : (
              <span className="rows__value">Opens with a round</span>
            )}
          </li>
          <li><span className="rows__name">Network</span><span className="rows__value">Solana devnet</span></li>
          <li><span className="rows__name">Entry</span><span className="rows__value">{`${(ENTRY_LAMPORTS / 1e9).toFixed(2)} SOL a seat`}</span></li>
        </ul>
        <p className="chain">
          <span className="ic-tile ic-tile--32"><img className="ic ic-24" data-icon="si:solana" src="/icons/solana.svg" alt="" width="27" height="24" loading="lazy" /></span>
          <span>Solana devnet</span>
        </p>
      </div>
      <div className="frame frame--fill span-6 start-7 record__sigs">
        <p className="desk__label">Base-layer transactions</p>
        {rows !== null && rows.length > 0 ? (
          <ol className="record__list">
            {rows.map((x) => (
              <li key={x.signature}>
                <a className="link" href={explorerTx(x.signature)} target="_blank" rel="noreferrer">{short(x.signature)}</a>
                <span>{x.failed ? "failed" : when(x.blockTime)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <>
            <p className="record__note">
              {failed
                ? "Solana did not answer. The list loads again in a few seconds."
                : table
                  ? "No base-layer transactions yet. They list here as they land."
                  : "Four transactions land on Solana each round. Their signatures list here once a round is open."}
            </p>
            <ul className="record__list">
              {KINDS.map((k) => (
                <li key={k.name}><span className="record__kind">{k.name}</span><span>{k.line}</span></li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
