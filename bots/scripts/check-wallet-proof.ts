import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { REPO_ROOT } from "@hidden-hand/client/node";
import { checkWalletProof } from "../src/wallet-proof";

const file = resolve(REPO_ROOT, "docs/proof/wallet-round.md");
if (!existsSync(file)) {
  console.log("WALLET-PROOF: FAIL (docs/proof/wallet-round.md missing)");
} else {
  const r = checkWalletProof(readFileSync(file, "utf8"));
  console.log(r.ok ? "WALLET-PROOF: PASS" : `WALLET-PROOF: FAIL (missing: ${r.missing.join(", ")})`);
}
