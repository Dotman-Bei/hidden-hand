import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { baseConnection } from "../src/conn";
import { loadBurner } from "../src/node";

const i = process.argv.indexOf("--min");
const minSol = i >= 0 ? Number(process.argv[i + 1]) : 0;
const burner = loadBurner();
const lamports = await baseConnection().getBalance(burner.publicKey, "confirmed");
console.log(`BURNER ${burner.publicKey.toBase58()} ${(lamports / LAMPORTS_PER_SOL).toFixed(3)} SOL`);
console.log(lamports >= minSol * LAMPORTS_PER_SOL ? "BURNER-BALANCE: PASS" : `BURNER-BALANCE: FAIL (below ${minSol} SOL)`);
