import { parseArgs, runDemoRound } from "../src/runner";

runDemoRound(parseArgs(process.argv.slice(2)))
  .then((d) => console.log(`DEMO-ROUND: DONE hidden sum ${d.result.hiddenSum}, close ${(d.result.closeC / 100).toFixed(2)}`))
  .catch((e) => {
    console.error(`DEMO-ROUND: FAIL ${e instanceof Error ? e.message : String(e)}`);
    process.exitCode = 1;
  });
