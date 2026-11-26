// Hidden Hand compute-unit gate. Runs program instructions in LiteSVM with the DEFAULT compute
// limit (no ComputeBudget instruction) and prints one `HH-CU: <ix> <units>` line per instruction.
// Exits non-zero if any instruction errors, misbehaves, or uses >= CU_MAX compute units.
//   node cu-check.mjs <hidden_hand.so> <hidden_hand.json IDL>
// Instruction data and accounts are hand-encoded from the IDL discriminators and state.rs layout
// (Anchor's TS coder overruns its 1000-byte buffer on the 2.5 KB Table).
import fs from "node:fs";
import { LiteSVM } from "litesvm";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

const CU_MAX = 100000;
const VRF_PROGRAM_ID = new PublicKey("Vrf1RNUjXmQGjmQrQLvJHs9SNkvDJEsRVFPkfSQUwGz");
const TABLE_LEN = 8 + 32 + 1 + 1 + 2 + 8 + 1 + 109 * 4 + 4 + 8 + 8 + 32 + 8 + 2 + 1 + 8 * 4 + 1 + 4 + 15 * 128;
const HAND_LEN = 32 + 32 + 1 + 2 + 1;
const PHASE = { Open: 0, Dealing: 1, Trading: 2 };
const MODE_TEE = 0;
const DURATION_SECS = 90;
const FAR_FUTURE_TS = 4102444800n;

const [soPath, idlPath] = process.argv.slice(2);
if (!soPath || !idlPath) {
  console.log("HH-CU: FAIL (usage: node cu-check.mjs <program.so> <idl.json>)");
  process.exit(1);
}
const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
const PID = new PublicKey(idl.address);
const ixDisc = (name) => {
  const ix = idl.instructions.find((i) => i.name === name);
  if (!ix) throw new Error(`instruction ${name} missing from the IDL`);
  return Buffer.from(ix.discriminator);
};
const accDisc = (name) => {
  const acc = idl.accounts.find((a) => a.name === name);
  if (!acc) throw new Error(`account ${name} missing from the IDL`);
  return Buffer.from(acc.discriminator);
};

const svm = new LiteSVM().withSigverify(false);
svm.addProgramFromFile(PID, soPath);
const payer = Keypair.generate();
svm.airdrop(payer.publicKey, BigInt(10 * LAMPORTS_PER_SOL));

const u64le = (v) => {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(BigInt(v));
  return b;
};
const tablePda = (roundId) => PublicKey.findProgramAddressSync([Buffer.from("table"), u64le(roundId)], PID)[0];
const handPda = (table, owner) =>
  PublicKey.findProgramAddressSync([Buffer.from("hand"), table.toBuffer(), owner.toBuffer()], PID)[0];
const [vrfIdentity] = PublicKey.findProgramAddressSync([Buffer.from("identity"), PID.toBuffer()], VRF_PROGRAM_ID);
const meta = (pubkey, isSigner, isWritable) => ({ pubkey, isSigner, isWritable });

let failed = false;
const fail = (label, why) => {
  console.log(`HH-CU: FAIL ${label} (${why})`);
  failed = true;
};

// Send one instruction alone in a transaction (default 200k CU limit) and report its CU.
const run = (label, ix, signers) => {
  const msg = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: svm.latestBlockhash(),
    instructions: [ix],
  }).compileToV0Message();
  const tx = new VersionedTransaction(msg);
  tx.sign([payer, ...signers]);
  const res = svm.sendTransaction(tx);
  svm.expireBlockhash();
  const isErr = typeof res.err === "function";
  const m = isErr ? res.meta() : res;
  const units = Number(m.computeUnitsConsumed());
  console.log(`HH-CU: ${label} ${units}`);
  if (isErr) {
    const tail = m.logs().slice(-4).join(" | ");
    fail(label, `transaction error ${String(res.err())}: ${tail}`);
    return false;
  }
  if (units >= CU_MAX) fail(label, `${units} >= ${CU_MAX}`);
  return true;
};

// Table / Hand account bytes, laid out exactly as state.rs (Borsh, after the 8-byte discriminator).
const encodeTable = ({ roundId, phase, owners, hands }) => {
  const b = Buffer.alloc(8 + TABLE_LEN);
  let o = 0;
  const raw = (buf) => {
    buf.copy(b, o);
    o += buf.length;
  };
  const u8 = (v) => {
    b.writeUInt8(v, o);
    o += 1;
  };
  const u16 = (v) => {
    b.writeUInt16LE(v, o);
    o += 2;
  };
  const u32 = (v) => {
    b.writeUInt32LE(v, o);
    o += 4;
  };
  const i64 = (v) => {
    b.writeBigInt64LE(BigInt(v), o);
    o += 8;
  };
  const skip = (n) => {
    o += n;
  };
  raw(accDisc("Table"));
  i64(roundId); // round_id (u64, small)
  raw(payer.publicKey.toBuffer()); // authority
  u8(MODE_TEE); // mode
  u8(phase); // phase
  u16(DURATION_SECS); // duration_secs
  i64(0); // entry_lamports
  u8(4); // seat_count
  for (let i = 0; i < 4; i++) {
    raw(owners[i].toBuffer()); // seat.owner
    raw(hands[i].toBuffer()); // seat.hand
    i64(0); // seat.cash_c
    u32(0); // seat.pos
    skip(32); // seat.commitment
    u8(0); // seat.revealed
  }
  u32(6400); // price_c
  i64(0); // start_ts
  i64(FAR_FUTURE_TS); // end_ts
  skip(32); // seed
  skip(8); // cards
  u16(0); // hidden_sum
  u8(255); // winner
  skip(32); // pnl_c
  u8(0); // paid
  u32(0); // trade_count
  skip(15 * 128); // trades
  if (o !== b.length) throw new Error(`Table encoding is ${o} bytes, expected ${b.length}`);
  return b;
};
const encodeHand = (table, owner, seat) => {
  const b = Buffer.alloc(8 + HAND_LEN);
  accDisc("Hand").copy(b, 0);
  table.toBuffer().copy(b, 8);
  owner.toBuffer().copy(b, 40);
  b.writeUInt8(seat, 72);
  return b;
};
const putAccount = (pubkey, data) =>
  svm.setAccount(pubkey, { lamports: LAMPORTS_PER_SOL / 10, data, owner: PID, executable: false });
// LiteSVM returns account data as a plain Uint8Array; wrap it for Buffer reads.
const accountData = (pubkey) => {
  const acc = svm.getAccount(pubkey);
  return acc ? Buffer.from(acc.data) : null;
};

// 1. open_table (TEE) through the real instruction and the system program.
{
  const roundId = 1n;
  const table = tablePda(roundId);
  const data = Buffer.alloc(8 + 8 + 1 + 2 + 8);
  ixDisc("open_table").copy(data, 0);
  data.writeBigUInt64LE(roundId, 8);
  data.writeUInt8(MODE_TEE, 16);
  data.writeUInt16LE(DURATION_SECS, 17);
  data.writeBigUInt64LE(0n, 19);
  const ix = new TransactionInstruction({
    programId: PID,
    data,
    keys: [meta(table, false, true), meta(payer.publicKey, true, true), meta(SystemProgram.programId, false, false)],
  });
  if (run("open_table", ix, [])) {
    const acc = accountData(table);
    if (!acc || acc.length !== 8 + TABLE_LEN) fail("open_table", "table account missing or wrong size");
  }
}

// 2. callback_deal: a full Dealing table and four hands, signed by the scoped VRF identity PDA
//    (sigverify is off, so the PDA can appear as a signer exactly as the VRF program makes it).
{
  const roundId = 2n;
  const table = tablePda(roundId);
  const owners = [0, 1, 2, 3].map(() => Keypair.generate().publicKey);
  const hands = owners.map((o) => handPda(table, o));
  putAccount(table, encodeTable({ roundId, phase: PHASE.Dealing, owners, hands }));
  owners.forEach((o, i) => putAccount(hands[i], encodeHand(table, o, i)));
  const data = Buffer.alloc(8 + 32);
  ixDisc("callback_deal").copy(data, 0);
  for (let i = 0; i < 32; i++) data[8 + i] = (i * 7) & 0xff;
  const ix = new TransactionInstruction({
    programId: PID,
    data,
    keys: [meta(vrfIdentity, true, false), meta(table, false, true), ...hands.map((h) => meta(h, false, true))],
  });
  if (run("callback_deal", ix, [])) {
    const dealt = hands.every((h) => accountData(h)[8 + 32 + 32 + 1 + 2] === 1);
    const phase = accountData(table)[8 + 8 + 32 + 1];
    if (!dealt || phase !== PHASE.Trading) fail("callback_deal", "hands not dealt or table not Trading");
  }
}

// 3. trade: seat 0 buys 3 lots on a Trading table.
{
  const roundId = 3n;
  const table = tablePda(roundId);
  const traders = [0, 1, 2, 3].map(() => Keypair.generate());
  const owners = traders.map((t) => t.publicKey);
  const hands = owners.map((o) => handPda(table, o));
  putAccount(table, encodeTable({ roundId, phase: PHASE.Trading, owners, hands }));
  svm.airdrop(owners[0], BigInt(LAMPORTS_PER_SOL));
  const data = Buffer.from([...ixDisc("trade"), 0, 3]);
  const ix = new TransactionInstruction({
    programId: PID,
    data,
    keys: [meta(table, false, true), meta(owners[0], true, true)],
  });
  if (run("trade", ix, [traders[0]])) {
    const tradeCount = accountData(table).readUInt32LE(8 + TABLE_LEN - 15 * 128 - 4);
    if (tradeCount !== 1) fail("trade", `trade_count is ${tradeCount}, expected 1`);
  }
}

if (failed) process.exit(1);
console.log(`HH-CU: PASS (every instruction < ${CU_MAX} CU)`);
