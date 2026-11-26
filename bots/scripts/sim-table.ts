import { type FourthSeat, summarize } from "../src/sim";

const rows: [string, number, FourthSeat][] = [
  ["demo 75 s, 4 bots", 75_000, "bot"],
  ["live 90 s, 4 bots", 90_000, "bot"],
  ["75 s, seat 4 = slow hint-follower", 75_000, "slow-follower"],
  ["75 s, seat 4 = random trader", 75_000, "random"],
  ["75 s, seat 4 = idle human", 75_000, "idle"],
];
console.log("| case | deals | close within 4 | median abs err | p90 abs err | median, do nothing | median trades |");
console.log("|---|---|---|---|---|---|---|");
for (const [name, ms, fourth] of rows) {
  const s = summarize(1, 2000, ms, fourth);
  console.log(`| ${name} | ${s.deals} | ${(s.within4 * 100).toFixed(1)}% | ${s.medianAbsErr.toFixed(2)} | ${s.p90AbsErr.toFixed(2)} | ${s.medianDoNothing.toFixed(1)} | ${s.medianTrades} |`);
}
