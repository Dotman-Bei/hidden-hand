import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { REPO_ROOT } from "@hidden-hand/client/node";
import { checkProof } from "../src/proof";

const file = resolve(REPO_ROOT, "docs/proof/devnet-round.md");
if (!existsSync(file)) {
  console.log("PROOF: FAIL (docs/proof/devnet-round.md missing)");
} else {
  const r = checkProof(readFileSync(file, "utf8"));
  console.log(r.ok ? "PROOF: PASS" : `PROOF: FAIL (missing: ${r.missing.join(", ")})`);
}
