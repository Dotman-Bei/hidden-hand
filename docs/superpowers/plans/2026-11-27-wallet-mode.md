# Wallet Mode Implementation Plan

**Goal:** Make `/app/` a live, self-serve pit played with a real Wallet Standard wallet on devnet, with the house and three bots run by in-tab keys, while Express mode (`?round=` / `?mode=express`) keeps today's code path.
**Architecture:** A wallet signer layer in `@hidden-hand/client` (`WalletSigner`, a Wallet Standard adapter, a mock wallet, signer-built base and TEE transactions, a TEE auth token signed with signMessage). A browser-safe round orchestrator in `@hidden-hand/bots/house` that reaches the chain only through a `HouseIo` interface, so unit tests use a fake chain and the Node integration script runs the same code against devnet. A React wallet desk that reuses `Desk` with a panel override. `bots/src/runner.ts`, `web/src/app/useRound.ts` and `web/src/app/burner.ts` are not touched.
**Tech Stack:** TypeScript ~5.8.3 strict, pnpm 10.33.0 workspaces, Node ≥ 22, `@solana/web3.js` ^1.99.0, `@coral-xyz/anchor` 0.32.1, `@magicblock-labs/ephemeral-rollups-sdk` 0.18.0, `@wallet-standard/app` 1.1.1, `@wallet-standard/base` 1.1.1, `@wallet-standard/features` 1.1.1, `@solana/wallet-standard-features` 1.5.0, tweetnacl ^1.0.3, vitest ^3.2.4, tsx ^4.20.3, React 18.3.1, Vite ^6.3.5, design-taste-frontend 2.5.1 (UI tasks), Vercel CLI `vercel@67.0.0` via npx (deploy gates).
**Source spec:** docs/superpowers/specs/2026-11-27-wallet-mode-amendment.md

Conventions for every task here: the branch is `wallet-mode` (never `main`); there are no program changes (the deployed program `HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb` is frozen); every key is kept in memory or sessionStorage only and is never logged or printed; Express mode stays byte-identical (`bots/src/runner.ts`, `web/src/app/useRound.ts`, `web/src/app/burner.ts` never change). Commands run in PowerShell from the repo root.

---

### Task 22: Client wallet signer layer (WalletSigner, Wallet Standard adapter, mock wallet, signer-sent txs, TEE token by signMessage)

**Files:**
- Create: `client/src/wallet/signer.ts`
- Create: `client/src/wallet/standard.ts`
- Create: `client/src/wallet/mock.ts`
- Create: `client/src/wallet/actions.ts`
- Create: `client/src/wallet/index.ts`
- Modify: `client/src/index.ts`
- Modify: `client/package.json`
- Modify: `pnpm-lock.yaml`
- Test: `client/test/wallet.test.ts`

**Depends on:** Task 2, Task 5
**Effort:** xhigh
**Model tier:** top
**Provides:** `@hidden-hand/client: interface WalletSigner { readonly publicKey: PublicKey; signTransaction(tx: Transaction): Promise<Transaction>; signMessage(message: Uint8Array): Promise<Uint8Array> }, keypairSigner(kp: Keypair): WalletSigner, countingSigner(s: WalletSigner, onPopup: (kind: "transaction" | "message") => void): WalletSigner`, `@hidden-hand/client: sendWithSigner(connection: Connection, ixs: TransactionInstruction[], signer: WalletSigner, extraSigners?: Keypair[]): Promise<string>, readonlyProgram(connection: Connection, publicKey: PublicKey): Program<HiddenHand>, teeConnectionForSigner(signer: WalletSigner, getToken?: AuthTokenFn): Promise<{ connection: Connection; expiresAt: number }>`, `@hidden-hand/client: SOLANA_DEVNET_CHAIN, isSolanaSigningWallet(w: Wallet): boolean, connectStandard(w: Wallet): Promise<WalletAccount>, standardSigner(w: Wallet, account: WalletAccount, chain?: IdentifierString): WalletSigner, mockStandardWallet(kp: Keypair, o?: MockWalletOptions): Wallet`, `@hidden-hand/client: joinTableWith(base: Connection, signer: WalletSigner, table: PublicKey): Promise<string>, tradeWith(er: Connection, signer: WalletSigner, table: PublicKey, side: Side, qty: number): Promise<string>, readHandAs(er: Connection, table: PublicKey, owner: PublicKey, timeoutMs?: number): Promise<[number, number] | null>, fundingIxs(from: PublicKey, targets: { to: PublicKey; lamports: number }[]): TransactionInstruction[], sweepTo(base: Connection, from: Keypair, to: PublicKey): Promise<{ sig: string | null; lamports: number }>, sweepLamports(balance: number): number, isBlockhashExpired(e: unknown): boolean, isUserRejection(e: unknown): boolean`
**Requires:** `@hidden-hand/client: tablePda(roundId: BN), handPda(table, owner), vaultPda(table)`, `@hidden-hand/client: baseConnection(), teeConnection(identity), publicErConnection(rpc), makeProgram(connection, keypair): Program<HiddenHand>, sendIxs(connection, ixs, payer, extraSigners?): Promise<string>`, `@hidden-hand/client: sendTrade(er, trader, table, side, qty): Promise<string>, settleRound(er, payer, view: TableView): Promise<string>, claimPot(base, payer, view: TableView): Promise<string>, findCommitSignatures(base, table, known: string[]): Promise<string[]>`

Context you need (already in the repo, read before you write): `client/src/tx.ts` (`sendIxs` = build, `feePayer`, blockhash from the same connection, `sendAndConfirmTransaction(..., { skipPreflight: true, commitment: "confirmed" })`; this is the path proven on the TEE), `client/src/conn.ts` (`teeConnection(identity: Keypair)` = `getAuthToken(TEE_RPC, identity.publicKey, signMessage)` then `${TEE_RPC}?token=…` plus the ws URL), `client/src/round-play.ts` (`sideCode(side: Side): number`), `client/src/deal/tee.ts` (`decodeHand(coder, data)`, `READABLE_TIMEOUT_MS = 20_000`, `READABLE_EVERY_MS = 400`), `client/src/deal/readable.ts` (`isReadable`, `pollReadable`), `client/src/pda.ts` (`handPda(table, owner)`, `vaultPda(table)`). The program: `join_table(commitment: [u8; 32])`, accounts `table, hand (init, payer = player), vault, player (Signer), system_program`; `trade(side: u8, qty: u8)`, accounts `table, trader (Signer)`. The TEE deal uses an all-zero commitment.

- [ ] **Step 1: Add the Wallet Standard dependencies (exact versions)**
      Run: `pnpm --filter @hidden-hand/client add @wallet-standard/base@1.1.1 @wallet-standard/features@1.1.1 @solana/wallet-standard-features@1.5.0`
      Expected: `client/package.json` lists the three under `dependencies`; `pnpm-lock.yaml` updated.

- [ ] **Step 2: Write the failing test** `client/test/wallet.test.ts`
      ```ts
      import { describe, expect, it } from "vitest";
      import { type Connection, Keypair, type PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
      import nacl from "tweetnacl";
      import {
        PROGRAM_ID, TEE_RPC, connectStandard, countingSigner, fundingIxs, isBlockhashExpired, isSolanaSigningWallet, isUserRejection,
        keypairSigner, mockStandardWallet, readonlyProgram, sendWithSigner, standardSigner, sweepLamports, teeConnectionForSigner, tradeWith,
      } from "../src/index";

      function stubConnection(err: unknown = null) {
        const sent: Uint8Array[] = [];
        const blockhash = Keypair.generate().publicKey.toBase58();
        const conn = {
          rpcEndpoint: "http://stub.invalid",
          getAccountInfo: async () => null,
          getLatestBlockhash: async () => ({ blockhash, lastValidBlockHeight: 1000 }),
          sendRawTransaction: async (raw: Uint8Array) => {
            sent.push(raw);
            return "STUBSIG";
          },
          confirmTransaction: async () => ({ context: { slot: 1 }, value: { err } }),
        } as unknown as Connection;
        return { conn, sent, blockhash };
      }

      describe("wallet signer layer", () => {
        it("keypairSigner signs messages verifiably", async () => {
          const kp = Keypair.generate();
          const m = new TextEncoder().encode("hello");
          const sig = await keypairSigner(kp).signMessage(m);
          expect(nacl.sign.detached.verify(m, sig, kp.publicKey.toBytes())).toBe(true);
        });

        it("the mock is a Solana-signing Wallet Standard wallet that connects to its keypair", async () => {
          const kp = Keypair.generate();
          const w = mockStandardWallet(kp);
          expect(isSolanaSigningWallet(w)).toBe(true);
          const account = await connectStandard(w);
          expect(account.address).toBe(kp.publicKey.toBase58());
        });

        it("standardSigner signs a transaction the keypair really signed, through solana:signTransaction", async () => {
          const kp = Keypair.generate();
          const w = mockStandardWallet(kp);
          const signer = standardSigner(w, await connectStandard(w));
          expect(signer.publicKey.equals(kp.publicKey)).toBe(true);
          const tx = new Transaction().add(SystemProgram.transfer({ fromPubkey: kp.publicKey, toPubkey: Keypair.generate().publicKey, lamports: 1 }));
          tx.feePayer = kp.publicKey;
          tx.recentBlockhash = Keypair.generate().publicKey.toBase58();
          const signed = await signer.signTransaction(tx);
          expect(signed.verifySignatures()).toBe(true);
          expect(signed.feePayer?.equals(kp.publicKey)).toBe(true);
        });

        it("standardSigner signs messages through solana:signMessage", async () => {
          const kp = Keypair.generate();
          const w = mockStandardWallet(kp);
          const signer = standardSigner(w, await connectStandard(w));
          const m = new TextEncoder().encode("challenge");
          expect(nacl.sign.detached.verify(m, await signer.signMessage(m), kp.publicKey.toBytes())).toBe(true);
        });

        it("standardSigner refuses a wallet without Solana signing features", async () => {
          const kp = Keypair.generate();
          const w = mockStandardWallet(kp);
          const bare = { ...w, features: { "standard:connect": w.features["standard:connect"] } };
          expect(isSolanaSigningWallet(bare)).toBe(false);
          expect(() => standardSigner(bare, w.accounts[0])).toThrow(/cannot sign/);
        });

        it("sendWithSigner: the wallet pays, the blockhash comes from the given connection, one popup, every signature valid", async () => {
          const kp = Keypair.generate();
          const extra = Keypair.generate();
          const { conn, sent, blockhash } = stubConnection();
          const popups: string[] = [];
          const w = mockStandardWallet(kp);
          const signer = countingSigner(standardSigner(w, await connectStandard(w)), (k) => popups.push(k));
          const a = SystemProgram.transfer({ fromPubkey: kp.publicKey, toPubkey: extra.publicKey, lamports: 1 });
          const b = SystemProgram.transfer({ fromPubkey: extra.publicKey, toPubkey: kp.publicKey, lamports: 1 });
          expect(await sendWithSigner(conn, [a, b], signer, [extra])).toBe("STUBSIG");
          expect(popups).toEqual(["transaction"]);
          const tx = Transaction.from(sent[0]);
          expect(tx.feePayer?.equals(kp.publicKey)).toBe(true);
          expect(tx.recentBlockhash).toBe(blockhash);
          expect(tx.signatures).toHaveLength(2);
          expect(tx.verifySignatures()).toBe(true);
        });

        it("sendWithSigner throws when the confirmation carries an error", async () => {
          const kp = Keypair.generate();
          const { conn } = stubConnection({ InstructionError: [0, "Custom"] });
          const ix = SystemProgram.transfer({ fromPubkey: kp.publicKey, toPubkey: Keypair.generate().publicKey, lamports: 1 });
          await expect(sendWithSigner(conn, [ix], keypairSigner(kp))).rejects.toThrow(/failed/);
        });

        it("a rejected popup throws and sends nothing", async () => {
          const kp = Keypair.generate();
          const { conn, sent } = stubConnection();
          const w = mockStandardWallet(kp, { reject: () => true });
          const signer = standardSigner(w, await connectStandard(w));
          const ix = SystemProgram.transfer({ fromPubkey: kp.publicKey, toPubkey: Keypair.generate().publicKey, lamports: 1 });
          const err = await sendWithSigner(conn, [ix], signer).catch((e: unknown) => e);
          expect(isUserRejection(err)).toBe(true);
          expect(sent).toHaveLength(0);
        });

        it("teeConnectionForSigner signs the challenge once with signMessage and puts the token on the TEE URL", async () => {
          const kp = Keypair.generate();
          const popups: string[] = [];
          const w = mockStandardWallet(kp);
          const signer = countingSigner(standardSigner(w, await connectStandard(w)), (k) => popups.push(k));
          const challenge = new TextEncoder().encode("hidden-hand-test-challenge");
          const fake = async (rpc: string, pk: PublicKey, sign: (m: Uint8Array) => Promise<Uint8Array>) => {
            expect(rpc).toBe(TEE_RPC);
            expect(pk.equals(kp.publicKey)).toBe(true);
            const sig = await sign(challenge);
            expect(nacl.sign.detached.verify(challenge, sig, kp.publicKey.toBytes())).toBe(true);
            return { token: "tok123", expiresAt: 1_900_000_000 };
          };
          const { connection, expiresAt } = await teeConnectionForSigner(signer, fake);
          expect(connection.rpcEndpoint).toBe(`${TEE_RPC}?token=tok123`);
          expect(expiresAt).toBe(1_900_000_000);
          expect(popups).toEqual(["message"]);
        });

        it("tradeWith sends one program trade ix with the wallet as signing trader", async () => {
          const kp = Keypair.generate();
          const { conn, sent } = stubConnection();
          const table = Keypair.generate().publicKey;
          await tradeWith(conn, keypairSigner(kp), table, "sell", 3);
          const tx = Transaction.from(sent[0]);
          expect(tx.instructions).toHaveLength(1);
          const ix = tx.instructions[0];
          expect(ix.programId.equals(PROGRAM_ID)).toBe(true);
          expect(ix.keys.some((k) => k.pubkey.equals(kp.publicKey) && k.isSigner)).toBe(true);
          expect(ix.keys.some((k) => k.pubkey.equals(table) && k.isWritable)).toBe(true);
          const expected = readonlyProgram(conn, kp.publicKey).coder.instruction.encode("trade", { side: 1, qty: 3 });
          expect(Buffer.from(ix.data).equals(Buffer.from(expected))).toBe(true);
        });

        it("fundingIxs skips zero amounts; sweepLamports leaves exactly the fee", () => {
          const from = Keypair.generate().publicKey;
          const ixs = fundingIxs(from, [{ to: Keypair.generate().publicKey, lamports: 5 }, { to: Keypair.generate().publicKey, lamports: 0 }]);
          expect(ixs).toHaveLength(1);
          expect(sweepLamports(1_000_000)).toBe(995_000);
          expect(sweepLamports(4_000)).toBe(0);
        });

        it("recognises expired-blockhash and user-rejection errors", () => {
          expect(isBlockhashExpired(new Error("Transaction simulation failed: Blockhash not found"))).toBe(true);
          expect(isBlockhashExpired(new Error("block height exceeded"))).toBe(true);
          expect(isBlockhashExpired(new Error("custom program error: 0x1770"))).toBe(false);
          expect(isUserRejection(new Error("User rejected the request."))).toBe(true);
          expect(isUserRejection(new Error("Blockhash not found"))).toBe(false);
        });
      });
      ```

- [ ] **Step 3: Run to confirm it fails**
      Run: `pnpm --filter @hidden-hand/client exec vitest run test/wallet.test.ts`
      Expected: FAIL: `connectStandard` (and the other wallet exports) are not exported from `../src/index`.

- [ ] **Step 4: Implement `client/src/wallet/signer.ts`**
      ```ts
      import { AnchorProvider, Program } from "@coral-xyz/anchor";
      import { getAuthToken } from "@magicblock-labs/ephemeral-rollups-sdk";
      import { Connection, type Keypair, type PublicKey, Transaction, type TransactionInstruction } from "@solana/web3.js";
      import nacl from "tweetnacl";
      import { TEE_RPC } from "../config";
      import type { HiddenHand } from "../idl/hidden_hand";
      import idl from "../idl/hidden_hand.json";

      /** The one shape the app signs with: a real wallet (Wallet Standard), the mock, or a local keypair. */
      export interface WalletSigner {
        readonly publicKey: PublicKey;
        signTransaction(tx: Transaction): Promise<Transaction>;
        signMessage(message: Uint8Array): Promise<Uint8Array>;
      }

      export function keypairSigner(kp: Keypair): WalletSigner {
        return {
          publicKey: kp.publicKey,
          signTransaction: async (tx) => {
            tx.partialSign(kp);
            return tx;
          },
          signMessage: async (m) => nacl.sign.detached(m, kp.secretKey),
        };
      }

      /** Calls onPopup before every signature the wrapped signer is asked for (the UI's popup counter). */
      export function countingSigner(s: WalletSigner, onPopup: (kind: "transaction" | "message") => void): WalletSigner {
        return {
          publicKey: s.publicKey,
          signTransaction: (tx) => {
            onPopup("transaction");
            return s.signTransaction(tx);
          },
          signMessage: (m) => {
            onPopup("message");
            return s.signMessage(m);
          },
        };
      }

      type ProviderWallet = ConstructorParameters<typeof AnchorProvider>[1];

      /** A Program that only builds instructions and reads accounts; it never signs. */
      export function readonlyProgram(connection: Connection, publicKey: PublicKey): Program<HiddenHand> {
        const refuse = () => Promise.reject(new Error("readonlyProgram never signs"));
        const wallet = { publicKey, signTransaction: refuse, signAllTransactions: refuse } as unknown as ProviderWallet;
        return new Program<HiddenHand>(idl as unknown as HiddenHand, new AnchorProvider(connection, wallet, { commitment: "confirmed" }));
      }

      /**
       * Build, sign with the wallet (one popup), then with any local keys, and send on `connection` (base or the TEE).
       * Mirrors sendIxs: the blockhash comes from the same connection right before the popup, skipPreflight, confirm by signature.
       */
      export async function sendWithSigner(
        connection: Connection,
        ixs: TransactionInstruction[],
        signer: WalletSigner,
        extraSigners: Keypair[] = [],
      ): Promise<string> {
        const tx = new Transaction().add(...ixs);
        tx.feePayer = signer.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
        const signed = await signer.signTransaction(tx);
        for (const k of extraSigners) signed.partialSign(k);
        const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: true });
        const res = await connection.confirmTransaction(sig, "confirmed");
        if (res.value.err) throw new Error(`transaction ${sig} failed: ${JSON.stringify(res.value.err)}`);
        return sig;
      }

      export type AuthTokenFn = (
        rpcUrl: string,
        publicKey: PublicKey,
        signMessage: (message: Uint8Array) => Promise<Uint8Array>,
      ) => Promise<{ token: string; expiresAt: number }>;

      /** A TEE connection that reads and writes as the signer: one signMessage popup for the auth token. */
      export async function teeConnectionForSigner(
        signer: WalletSigner,
        getToken: AuthTokenFn = getAuthToken,
      ): Promise<{ connection: Connection; expiresAt: number }> {
        const auth = await getToken(TEE_RPC, signer.publicKey, (m) => signer.signMessage(m));
        const url = `${TEE_RPC}?token=${auth.token}`;
        const ws = `${TEE_RPC.replace(/^http/, "ws")}?token=${auth.token}`;
        return { connection: new Connection(url, { commitment: "confirmed", wsEndpoint: ws }), expiresAt: auth.expiresAt };
      }
      ```
      If `getAuthToken`'s declared type is not assignable to `AuthTokenFn` under strict TS, keep the `AuthTokenFn` type and wrap it: `getToken: AuthTokenFn = (rpc, pk, sign) => getAuthToken(rpc, pk, sign)`; never `any`.

- [ ] **Step 5: Implement `client/src/wallet/standard.ts`**
      ```ts
      import { SolanaSignMessage, type SolanaSignMessageFeature, SolanaSignTransaction, type SolanaSignTransactionFeature } from "@solana/wallet-standard-features";
      import type { IdentifierString, Wallet, WalletAccount } from "@wallet-standard/base";
      import { StandardConnect, type StandardConnectFeature } from "@wallet-standard/features";
      import { PublicKey, Transaction } from "@solana/web3.js";
      import type { WalletSigner } from "./signer";

      export const SOLANA_DEVNET_CHAIN: IdentifierString = "solana:devnet";

      /** True when the wallet can connect, sign Solana transactions and sign messages: what wallet mode needs. */
      export function isSolanaSigningWallet(w: Wallet): boolean {
        return StandardConnect in w.features && SolanaSignTransaction in w.features && SolanaSignMessage in w.features;
      }

      /** standard:connect (the wallet's connect popup); the first account it returns. */
      export async function connectStandard(w: Wallet): Promise<WalletAccount> {
        const f = (w.features as unknown as StandardConnectFeature)[StandardConnect];
        const { accounts } = await f.connect();
        const account = accounts[0] ?? w.accounts[0];
        if (!account) throw new Error(`${w.name} returned no account`);
        return account;
      }

      /** A WalletSigner over a Wallet Standard wallet: signTransaction / signMessage popups, never signAndSend. */
      export function standardSigner(w: Wallet, account: WalletAccount, chain: IdentifierString = SOLANA_DEVNET_CHAIN): WalletSigner {
        if (!isSolanaSigningWallet(w)) throw new Error(`${w.name} cannot sign Solana transactions and messages`);
        const st = (w.features as unknown as SolanaSignTransactionFeature)[SolanaSignTransaction];
        const sm = (w.features as unknown as SolanaSignMessageFeature)[SolanaSignMessage];
        return {
          publicKey: new PublicKey(Uint8Array.from(account.publicKey)),
          async signTransaction(tx) {
            const transaction = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
            const [out] = await st.signTransaction({ account, transaction, chain });
            if (!out) throw new Error(`${w.name} returned no signed transaction`);
            return Transaction.from(out.signedTransaction);
          },
          async signMessage(message) {
            const [out] = await sm.signMessage({ account, message });
            if (!out) throw new Error(`${w.name} returned no signature`);
            return Uint8Array.from(out.signature);
          },
        };
      }
      ```

- [ ] **Step 6: Implement `client/src/wallet/mock.ts`**
      ```ts
      import type { Wallet, WalletAccount } from "@wallet-standard/base";
      import { type Keypair, Transaction } from "@solana/web3.js";
      import nacl from "tweetnacl";

      export interface MockWalletOptions {
        name?: string;
        /** Called before each signature request (the popup a real wallet would show). */
        onSign?: (kind: "transaction" | "message") => void;
        /** Return true to reject that request the way a wallet does when the user clicks Cancel. */
        reject?: (kind: "transaction" | "message") => boolean;
      }

      const ICON = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiLz4=" as const;

      /** A Wallet Standard wallet backed by a local keypair: the tests' and the integration script's stand-in for Phantom. */
      export function mockStandardWallet(kp: Keypair, o: MockWalletOptions = {}): Wallet {
        const account: WalletAccount = {
          address: kp.publicKey.toBase58(),
          publicKey: kp.publicKey.toBytes(),
          chains: ["solana:devnet"],
          features: ["solana:signTransaction", "solana:signMessage"],
        };
        const gate = (kind: "transaction" | "message") => {
          o.onSign?.(kind);
          if (o.reject?.(kind)) throw new Error("User rejected the request.");
        };
        return {
          version: "1.0.0",
          name: o.name ?? "Mock Wallet",
          icon: ICON,
          chains: ["solana:devnet"],
          accounts: [account],
          features: {
            "standard:connect": { version: "1.0.0", connect: async () => ({ accounts: [account] }) },
            "standard:events": { version: "1.0.0", on: () => () => undefined },
            "solana:signTransaction": {
              version: "1.0.0",
              supportedTransactionVersions: ["legacy"],
              signTransaction: async (...inputs: { transaction: Uint8Array }[]) =>
                inputs.map((i) => {
                  gate("transaction");
                  const tx = Transaction.from(i.transaction);
                  tx.partialSign(kp);
                  return { signedTransaction: tx.serialize({ requireAllSignatures: false, verifySignatures: false }) };
                }),
            },
            "solana:signMessage": {
              version: "1.0.0",
              signMessage: async (...inputs: { message: Uint8Array }[]) =>
                inputs.map((i) => {
                  gate("message");
                  return { signedMessage: i.message, signature: nacl.sign.detached(i.message, kp.secretKey) };
                }),
            },
          },
        };
      }
      ```

- [ ] **Step 7: Implement `client/src/wallet/actions.ts`**
      ```ts
      import { type Commitment, type Connection, type Keypair, type PublicKey, SystemProgram, type TransactionInstruction } from "@solana/web3.js";
      import { decodeHand, READABLE_EVERY_MS, READABLE_TIMEOUT_MS } from "../deal/tee";
      import { isReadable, pollReadable } from "../deal/readable";
      import type { Side } from "../engine";
      import { handPda, vaultPda } from "../pda";
      import { sideCode } from "../round-play";
      import { sendIxs } from "../tx";
      import { readonlyProgram, sendWithSigner, type WalletSigner } from "./signer";

      export const SIGNATURE_FEE_LAMPORTS = 5000;

      /** Base layer: the wallet takes a seat (one popup). TEE deal: the commitment is 32 zero bytes. The wallet pays entry + hand rent. */
      export async function joinTableWith(base: Connection, signer: WalletSigner, table: PublicKey): Promise<string> {
        const ix = await readonlyProgram(base, signer.publicKey)
          .methods.joinTable(Array.from(new Uint8Array(32)))
          .accountsPartial({ table, hand: handPda(table, signer.publicKey), vault: vaultPda(table), player: signer.publicKey })
          .instruction();
        return sendWithSigner(base, [ix], signer);
      }

      /** ER (the wallet's own TEE connection): one trade, one popup, zero fee. */
      export async function tradeWith(er: Connection, signer: WalletSigner, table: PublicKey, side: Side, qty: number): Promise<string> {
        const ix = await readonlyProgram(er, signer.publicKey)
          .methods.trade(sideCode(side), qty)
          .accountsPartial({ table, trader: signer.publicKey })
          .instruction();
        return sendWithSigner(er, [ix], signer);
      }

      /** The owner's dealt cards, read through a TEE connection authorized as the owner; null on timeout. */
      export async function readHandAs(er: Connection, table: PublicKey, owner: PublicKey, timeoutMs = READABLE_TIMEOUT_MS): Promise<[number, number] | null> {
        const program = readonlyProgram(er, owner);
        const address = handPda(table, owner);
        const got: { cards?: [number, number] } = {};
        const readAt = async (c: Commitment) => {
          const info = await er.getAccountInfo(address, c);
          if (!isReadable(info)) return null;
          const hand = decodeHand(program.coder, info.data);
          if (!hand.dealt) return null;
          got.cards = [hand.cards[0], hand.cards[1]];
          return info;
        };
        await pollReadable(async () => (await readAt("confirmed").catch(() => null)) ?? (await readAt("processed")), timeoutMs, READABLE_EVERY_MS);
        return got.cards ?? null;
      }

      export function fundingIxs(from: PublicKey, targets: { to: PublicKey; lamports: number }[]): TransactionInstruction[] {
        return targets.filter((t) => t.lamports > 0).map((t) => SystemProgram.transfer({ fromPubkey: from, toPubkey: t.to, lamports: t.lamports }));
      }

      export function sweepLamports(balance: number): number {
        return Math.max(0, balance - SIGNATURE_FEE_LAMPORTS);
      }

      /** Base layer: send everything but the fee from an in-tab key back to `to`. */
      export async function sweepTo(base: Connection, from: Keypair, to: PublicKey): Promise<{ sig: string | null; lamports: number }> {
        const lamports = sweepLamports(await base.getBalance(from.publicKey, "confirmed"));
        if (lamports === 0) return { sig: null, lamports: 0 };
        const sig = await sendIxs(base, [SystemProgram.transfer({ fromPubkey: from.publicKey, toPubkey: to, lamports })], from);
        return { sig, lamports };
      }

      const text = (e: unknown): string => (e instanceof Error ? e.message : String(e));
      export function isBlockhashExpired(e: unknown): boolean {
        return /blockhash not found|BlockhashNotFound|block height exceeded|TransactionExpired/i.test(text(e));
      }
      export function isUserRejection(e: unknown): boolean {
        return /user rejected|rejected the request|request rejected|user denied|\b4001\b/i.test(text(e));
      }
      ```

- [ ] **Step 8: Export** `client/src/wallet/index.ts`
      ```ts
      export * from "./signer";
      export * from "./standard";
      export * from "./mock";
      export * from "./actions";
      ```
      and append to `client/src/index.ts` the line `export * from "./wallet/index";`.

- [ ] **Step 9: Run to confirm it passes (THE GATE)**
      Run: `pnpm --filter @hidden-hand/client verify`
      Expected: PASS: `tsc` prints nothing, vitest reports every test file passed (including `test/wallet.test.ts`), and the last line is `SMOKE: OK`.

- [ ] **Step 10: Commit (kernel-performed — no agent runs this)**
      Message: `feat(client): wallet signer layer (Wallet Standard adapter, mock wallet, signer-sent base and TEE txs)`

---

### Task 23: Browser-safe wallet round orchestration (house + 3 in-tab bots, HouseIo, sweep)

**Files:**
- Create: `bots/src/house-round.ts`
- Create: `bots/src/house-io.ts`
- Create: `bots/src/house.ts`
- Modify: `bots/package.json`
- Modify: `bots/scripts/smoke.ts`
- Test: `bots/test/house-round.test.ts`

**Depends on:** Task 22, Task 2, Task 5, Task 6, Task 7
**Effort:** high
**Model tier:** top
**Provides:** `@hidden-hand/bots/house: runWalletRound(io: HouseIo, wallet: WalletSigner, vault: KeyVault, o?: WalletRoundOptions): Promise<WalletRoundResult>`, `@hidden-hand/bots/house: type WalletPhase = "funding" | "opening" | "joining" | "signing-in" | "seating-bots" | "delegating" | "dealing" | "trading" | "bell" | "settling" | "claiming" | "sweeping" | "done" | "error"; interface WalletRoundEvent { phase; table?; roundId?; walletEr?; view?; error?; swept? }; interface WalletRoundResult { proof: ProofData; walletPopups: number; sweptLamports: number; budget: WalletRoundBudget; table: PublicKey; roundId: string }`, `@hidden-hand/bots/house: interface HouseIo (all chain calls), liveHouseIo(log?: (m: string) => void): HouseIo`, `@hidden-hand/bots/house: walletRoundBudget(r: RoundRent): WalletRoundBudget, InsufficientFundsError { needLamports; haveLamports }, RoundAbortedError, interface KeyVault { load(): HouseKeys | null; save(keys: HouseKeys): void; clear(): void }, memoryVault(): KeyVault, serializeKeys(k: HouseKeys): string, parseKeys(text: string): HouseKeys | null, sweepAll(io: HouseIo, keys: HouseKeys, to: PublicKey): Promise<{ lamports: number; ok: boolean }>`
**Requires:** `@hidden-hand/client: interface WalletSigner { readonly publicKey: PublicKey; signTransaction(tx: Transaction): Promise<Transaction>; signMessage(message: Uint8Array): Promise<Uint8Array> }, keypairSigner(kp: Keypair): WalletSigner, countingSigner(s: WalletSigner, onPopup: (kind: "transaction" | "message") => void): WalletSigner`, `@hidden-hand/client: sendWithSigner(connection: Connection, ixs: TransactionInstruction[], signer: WalletSigner, extraSigners?: Keypair[]): Promise<string>, readonlyProgram(connection: Connection, publicKey: PublicKey): Program<HiddenHand>, teeConnectionForSigner(signer: WalletSigner, getToken?: AuthTokenFn): Promise<{ connection: Connection; expiresAt: number }>`, `@hidden-hand/client: joinTableWith(base: Connection, signer: WalletSigner, table: PublicKey): Promise<string>, tradeWith(er: Connection, signer: WalletSigner, table: PublicKey, side: Side, qty: number): Promise<string>, readHandAs(er: Connection, table: PublicKey, owner: PublicKey, timeoutMs?: number): Promise<[number, number] | null>, fundingIxs(from: PublicKey, targets: { to: PublicKey; lamports: number }[]): TransactionInstruction[], sweepTo(base: Connection, from: Keypair, to: PublicKey): Promise<{ sig: string | null; lamports: number }>, sweepLamports(balance: number): number, isBlockhashExpired(e: unknown): boolean, isUserRejection(e: unknown): boolean`, `@hidden-hand/bots: mulberry32(seed): () => number, interface BotPersona {intervalMinMs, intervalMaxMs, rampMs, wobbleProb, maxLot}, interface BotMemory {wobble}, botTarget(ownSum, tMs, persona, mem): number, decide(ownSum, pos, tMs, persona, mem, rng): Order | null, personaFor(seat, rng): BotPersona, DEMO_SEED = 20261127`, `@hidden-hand/bots: formatProof(data: ProofData): string, checkProof(text: string): { ok: boolean; missing: string[] }`, `@hidden-hand/client: round-base (openTable, joinTable, delegatePdas, requestDeal, fetchTable, decodeTable, waitForPhase, waitUntilOnEr, waitForOwner, fundAccounts, type TableView, type PhaseName, type SeatView, type TradeView)`, `@hidden-hand/client: baseConnection(), teeConnection(identity), publicErConnection(rpc), makeProgram(connection, keypair): Program<HiddenHand>, sendIxs(connection, ixs, payer, extraSigners?): Promise<string>`, `@hidden-hand/client: interface DealAdapter { mode; erRpc; validator; commitmentFor(table, owner): Uint8Array; erConnection(identity: Keypair): Promise<Connection>; afterDelegate(ctx: DealContext): Promise<string[]>; readOwnHand(ctx: DealContext, owner: Keypair): Promise<[number, number] | null>; reveal(ctx: DealContext, seatKeys: Keypair[]): Promise<string[]> }`, `@hidden-hand/client: sendTrade(er, trader, table, side, qty): Promise<string>, settleRound(er, payer, view: TableView): Promise<string>, claimPot(base, payer, view: TableView): Promise<string>, findCommitSignatures(base, table, known: string[]): Promise<string[]>`

Context: this is a port of `bots/src/runner.ts` (read it; do NOT modify it) into a browser-safe module: no `node:*`, no `process`, no `loadBurner`. Differences from the runner: the wallet holds seat 0 and pays its own seat; the house (`authority` / `payer`) and the three bots are `Keypair.generate()` keys funded by one wallet transfer; wallet mode is TEE only (`TeeDealAdapter`); every chain call goes through `HouseIo`; the sweep always runs. Client API you call (signatures as in `client/src`): `openTable(base: Program, authority: Keypair, roundId: BN, mode: DealMode, durationSecs: number, entryLamports: number): Promise<string>`, `joinTable(base: Program, payer: Keypair, player: Keypair, table: PublicKey, commitment: Uint8Array): Promise<string>`, `delegatePdas(base: Program, payer: Keypair, roundId: BN, table: PublicKey, owners: PublicKey[], validator: PublicKey): Promise<string[]>`, `requestDeal(er: Program, payer: Keypair, table: PublicKey, clientSeed: number): Promise<string>`, `fetchTable(program, table): Promise<TableView | null>`, `waitForOwner(base: Connection, account: PublicKey, owner: PublicKey, timeoutMs: number): Promise<void>`, `sendTrade(er, trader, table, side, qty)`, `settleRound(er, payer, view)`, `claimPot(base, payer, view)`, `findCommitSignatures(base, table, known)`, `TeeDealAdapter` (`commitmentFor()`, `validator`, `erConnection(identity: Keypair)`, `afterDelegate(ctx)`, `readOwnHand(ctx, owner)`, `reveal(ctx)`), `retryStaleProgram(fn, { log })` from `bots/src/retry.ts`. `TableView` fields: `address, roundId, authority, mode, phase, durationSecs, entryLamports, seatCount, seats: { owner, hand, cashC, pos, revealed }[], priceC, startTs, endTs, cards, hiddenSum, winner, pnlC, paid, tradeCount, trades`.

- [ ] **Step 1: Write the failing test** `bots/test/house-round.test.ts`
      ```ts
      import { describe, expect, it } from "vitest";
      import type BN from "bn.js";
      import { type Connection, Keypair, type PublicKey } from "@solana/web3.js";
      import { ENTRY_LAMPORTS, handPda, keypairSigner, tablePda, type TableView } from "@hidden-hand/client";
      import {
        type HouseIo, InsufficientFundsError, type WalletPhase, memoryVault, newHouseKeys, parseKeys, runWalletRound, serializeKeys, walletRoundBudget,
      } from "../src/house-round";

      const RENT = { tableRent: 5_000_000, handRent: 1_500_000 };

      function fakeIo(o: { balance?: number; failAt?: string } = {}) {
        const calls: string[] = [];
        const funded: number[] = [];
        let t = 1_800_000_000_000;
        let v: TableView | null = null;
        const owners: PublicKey[] = [];
        const step = (name: string) => {
          calls.push(name);
          if (o.failAt === name) throw new Error(`boom at ${name}`);
        };
        const view = (): TableView => {
          if (!v) throw new Error("no table");
          return { ...v, seats: v.seats.map((s) => ({ ...s })) };
        };
        const io: HouseIo = {
          rent: async () => RENT,
          balance: async () => o.balance ?? 1_000_000_000,
          fund: async (_w, targets) => {
            step("fund");
            funded.push(...targets.map((x) => x.lamports));
            return "sig-fund";
          },
          openTable: async (house, roundId: BN, secs) => {
            step("open");
            v = {
              address: tablePda(roundId), roundId, authority: house.publicKey, mode: "tee", phase: "open", durationSecs: secs,
              entryLamports: ENTRY_LAMPORTS, seatCount: 0, seats: [], priceC: 6400, startTs: 0, endTs: 0, cards: [], hiddenSum: 0,
              winner: null, pnlC: [0, 0, 0, 0], paid: false, tradeCount: 0, trades: [],
            };
            return "sig-open";
          },
          joinWallet: async (wallet, table) => {
            step("joinWallet");
            owners.push(wallet.publicKey);
            v = { ...view(), seatCount: owners.length, seats: owners.map((ow) => ({ owner: ow, hand: handPda(table, ow), cashC: 0, pos: 0, revealed: false })) };
            return "sig-join-wallet";
          },
          signIn: async () => {
            step("signIn");
            return { rpcEndpoint: "tee-as-wallet" } as unknown as Connection;
          },
          joinBot: async (_h, bot, table) => {
            step("joinBot");
            owners.push(bot.publicKey);
            v = { ...view(), seatCount: owners.length, seats: owners.map((ow) => ({ owner: ow, hand: handPda(table, ow), cashC: 0, pos: 0, revealed: false })) };
            return `sig-join-${owners.length}`;
          },
          baseTable: async () => view(),
          delegate: async () => {
            step("delegate");
            return ["sig-del-table", "sig-del-0", "sig-del-1", "sig-del-2", "sig-del-3"];
          },
          afterDelegate: async () => {
            step("afterDelegate");
            return ["sig-perm"];
          },
          requestDeal: async () => {
            step("requestDeal");
            const start = Math.floor(t / 1000);
            v = { ...view(), phase: "trading", startTs: start, endTs: start + view().durationSecs };
            return "sig-deal";
          },
          erTable: async () => view(),
          readBotHand: async () => [14, 15],
          botTrade: async () => {
            calls.push("botTrade");
            return `sig-trade-${calls.length}`;
          },
          reveal: async () => {
            step("reveal");
            v = { ...view(), phase: "revealed", cards: [1, 2, 3, 4, 5, 6, 7, 8], hiddenSum: 36 };
            return ["sig-reveal"];
          },
          settle: async () => {
            step("settle");
            v = { ...view(), phase: "settled", winner: 0, pnlC: [100, -50, -25, -25] };
            return "sig-settle";
          },
          waitForOwner: async () => {
            step("waitForOwner");
          },
          claim: async () => {
            step("claim");
            return "sig-claim";
          },
          commitSignatures: async () => ["sig-commit"],
          sweep: async () => {
            calls.push("sweep");
            return { sig: "sig-sweep", lamports: 1_000 };
          },
          now: () => t,
          sleep: async (ms) => {
            t += ms;
          },
        };
        return { io, calls, funded };
      }

      const phasesOf = (events: { phase: WalletPhase }[]) => events.map((e) => e.phase).filter((p, i, a) => i === 0 || a[i - 1] !== p);

      describe("runWalletRound", () => {
        it("plays a full round in order with exactly three wallet popups before trading, then sweeps every in-tab key", async () => {
          const { io, calls, funded } = fakeIo();
          const vault = memoryVault();
          const events: { phase: WalletPhase }[] = [];
          const wallet = keypairSigner(Keypair.generate());
          const r = await runWalletRound(io, wallet, vault, { durationSecs: 90, seed: 7, onEvent: (e) => events.push(e) });
          const main = calls.filter((c) => c !== "botTrade" && c !== "sweep");
          expect(main).toEqual([
            "fund", "open", "joinWallet", "signIn", "joinBot", "joinBot", "joinBot", "delegate", "afterDelegate", "requestDeal",
            "reveal", "settle", "waitForOwner", "claim",
          ]);
          expect(calls.filter((c) => c === "botTrade").length).toBeGreaterThan(5);
          expect(calls.slice(-4)).toEqual(["sweep", "sweep", "sweep", "sweep"]);
          expect(phasesOf(events)).toEqual([
            "funding", "opening", "joining", "signing-in", "seating-bots", "delegating", "dealing", "trading", "bell", "settling", "claiming", "sweeping", "done",
          ]);
          const b = walletRoundBudget(RENT);
          expect(funded).toEqual([b.house, b.bot, b.bot, b.bot]);
          expect(r.walletPopups).toBe(3);
          expect(r.sweptLamports).toBe(4_000);
          expect(r.proof.mode).toBe("tee");
          expect(r.proof.base.joins).toHaveLength(4);
          expect(r.proof.result.winnerSeat).toBe(0);
          expect(r.proof.result.winner).toBe(wallet.publicKey.toBase58());
          expect(vault.load()).toBeNull();
        });

        it("refuses to start, before any popup, when the wallet holds less than the budget", async () => {
          const { io, calls } = fakeIo({ balance: 1_000 });
          const err = await runWalletRound(io, keypairSigner(Keypair.generate()), memoryVault()).catch((e: unknown) => e);
          expect(err).toBeInstanceOf(InsufficientFundsError);
          expect((err as InsufficientFundsError).needLamports).toBe(walletRoundBudget(RENT).total);
          expect(calls).toEqual([]);
        });

        it("still sweeps all four in-tab keys when the round fails after funding, then reports the error", async () => {
          const { io, calls } = fakeIo({ failAt: "joinWallet" });
          const vault = memoryVault();
          const events: { phase: WalletPhase; error?: string }[] = [];
          await expect(
            runWalletRound(io, keypairSigner(Keypair.generate()), vault, { onEvent: (e) => events.push(e) }),
          ).rejects.toThrow(/boom at joinWallet/);
          expect(calls.filter((c) => c === "sweep")).toHaveLength(4);
          expect(events[events.length - 1].phase).toBe("error");
          expect(events[events.length - 1].error).toMatch(/boom at joinWallet/);
          expect(vault.load()).toBeNull();
        });

        it("budget: total = house + 3 bots + the wallet's own seat", () => {
          const b = walletRoundBudget(RENT);
          expect(b.bot).toBe(ENTRY_LAMPORTS + RENT.handRent + 2_000_000);
          expect(b.house).toBe(RENT.tableRent + 5 * 4_000_000 + 5_000_000);
          expect(b.wallet).toBe(ENTRY_LAMPORTS + RENT.handRent + 2_000_000);
          expect(b.total).toBe(b.house + 3 * b.bot + b.wallet);
        });

        it("keys survive a serialize / parse round trip and junk parses to null", () => {
          const k = newHouseKeys();
          const back = parseKeys(serializeKeys(k));
          expect(back?.house.publicKey.equals(k.house.publicKey)).toBe(true);
          expect(back?.bots.map((b) => b.publicKey.toBase58())).toEqual(k.bots.map((b) => b.publicKey.toBase58()));
          expect(parseKeys("not json")).toBeNull();
          expect(parseKeys(JSON.stringify({ house: [1], bots: [] }))).toBeNull();
        });
      });
      ```

- [ ] **Step 2: Run to confirm it fails**
      Run: `pnpm --filter @hidden-hand/bots exec vitest run test/house-round.test.ts`
      Expected: FAIL: cannot resolve `../src/house-round`.

- [ ] **Step 3: Implement `bots/src/house-round.ts`**
      ```ts
      import BN from "bn.js";
      import { type Connection, Keypair, type PublicKey } from "@solana/web3.js";
      import {
        type DealContext, ENTRY_LAMPORTS, PROGRAM_ID, type Side, TEE_RPC, TEE_VALIDATOR, type TableView, type WalletSigner, tablePda,
      } from "@hidden-hand/client";
      import { type BotMemory, decide, mulberry32, personaFor } from "./policy";
      import type { ProofData } from "./proof";

      export type WalletPhase =
        | "funding" | "opening" | "joining" | "signing-in" | "seating-bots" | "delegating" | "dealing"
        | "trading" | "bell" | "settling" | "claiming" | "sweeping" | "done" | "error";

      export interface HouseKeys { house: Keypair; bots: Keypair[] }
      export interface KeyVault { load(): HouseKeys | null; save(keys: HouseKeys): void; clear(): void }
      export interface RoundRent { tableRent: number; handRent: number }
      export interface WalletRoundBudget { house: number; bot: number; wallet: number; total: number }
      export interface SweepResult { sig: string | null; lamports: number }

      /** Every chain call the wallet round makes. liveHouseIo() is the devnet one; tests pass a fake. */
      export interface HouseIo {
        rent(): Promise<RoundRent>;
        balance(who: PublicKey): Promise<number>;
        fund(wallet: WalletSigner, targets: { to: PublicKey; lamports: number }[]): Promise<string>;
        openTable(house: Keypair, roundId: BN, durationSecs: number): Promise<string>;
        joinWallet(wallet: WalletSigner, table: PublicKey): Promise<string>;
        signIn(wallet: WalletSigner): Promise<Connection>;
        joinBot(house: Keypair, bot: Keypair, table: PublicKey): Promise<string>;
        baseTable(table: PublicKey): Promise<TableView | null>;
        delegate(house: Keypair, roundId: BN, table: PublicKey, owners: PublicKey[]): Promise<string[]>;
        afterDelegate(ctx: DealContext): Promise<string[]>;
        requestDeal(house: Keypair, table: PublicKey, clientSeed: number): Promise<string>;
        erTable(house: Keypair, table: PublicKey): Promise<TableView | null>;
        readBotHand(ctx: DealContext, bot: Keypair): Promise<[number, number] | null>;
        botTrade(bot: Keypair, table: PublicKey, side: Side, qty: number): Promise<string>;
        reveal(ctx: DealContext): Promise<string[]>;
        settle(house: Keypair, view: TableView): Promise<string>;
        waitForOwner(table: PublicKey, owner: PublicKey, timeoutMs: number): Promise<void>;
        claim(house: Keypair, view: TableView): Promise<string>;
        commitSignatures(table: PublicKey, known: string[]): Promise<string[]>;
        sweep(from: Keypair, to: PublicKey): Promise<SweepResult>;
        now(): number;
        sleep(ms: number): Promise<void>;
      }

      export interface WalletRoundEvent {
        phase: WalletPhase;
        table?: PublicKey;
        roundId?: string;
        /** The wallet's own TEE connection (from the sign-in popup): the UI trades and reads its hand through it. */
        walletEr?: Connection;
        view?: TableView;
        error?: string;
        swept?: number;
      }
      export interface WalletRoundOptions { durationSecs?: number; seed?: number; signal?: AbortSignal; onEvent?: (e: WalletRoundEvent) => void }
      export interface WalletRoundResult { proof: ProofData; walletPopups: number; sweptLamports: number; budget: WalletRoundBudget; table: PublicKey; roundId: string }

      export const WALLET_ROUND_SECS = 90;
      export const DELEGATION_ALLOWANCE_LAMPORTS = 4_000_000;
      export const SEAT_FEE_ALLOWANCE_LAMPORTS = 2_000_000;
      export const HOUSE_FEE_ALLOWANCE_LAMPORTS = 5_000_000;

      export class InsufficientFundsError extends Error {
        constructor(readonly needLamports: number, readonly haveLamports: number) {
          super(`The wallet holds ${(haveLamports / 1e9).toFixed(3)} devnet SOL; one round needs ${(needLamports / 1e9).toFixed(3)}.`);
          this.name = "InsufficientFundsError";
        }
      }
      export class RoundAbortedError extends Error {
        constructor() {
          super("The round was stopped.");
          this.name = "RoundAbortedError";
        }
      }

      export function walletRoundBudget(r: RoundRent): WalletRoundBudget {
        const bot = ENTRY_LAMPORTS + r.handRent + SEAT_FEE_ALLOWANCE_LAMPORTS;
        const house = r.tableRent + 5 * DELEGATION_ALLOWANCE_LAMPORTS + HOUSE_FEE_ALLOWANCE_LAMPORTS;
        const wallet = ENTRY_LAMPORTS + r.handRent + SEAT_FEE_ALLOWANCE_LAMPORTS;
        return { house, bot, wallet, total: house + 3 * bot + wallet };
      }

      export function newHouseKeys(): HouseKeys {
        return { house: Keypair.generate(), bots: [Keypair.generate(), Keypair.generate(), Keypair.generate()] };
      }
      export function memoryVault(): KeyVault {
        let held: HouseKeys | null = null;
        return { load: () => held, save: (k) => void (held = k), clear: () => void (held = null) };
      }
      export function serializeKeys(k: HouseKeys): string {
        return JSON.stringify({ house: Array.from(k.house.secretKey), bots: k.bots.map((b) => Array.from(b.secretKey)) });
      }
      export function parseKeys(text: string): HouseKeys | null {
        try {
          const o = JSON.parse(text) as { house?: unknown; bots?: unknown };
          const ok = (a: unknown): a is number[] => Array.isArray(a) && a.length === 64 && a.every((n) => Number.isInteger(n) && n >= 0 && n <= 255);
          if (!ok(o.house) || !Array.isArray(o.bots) || o.bots.length !== 3 || !o.bots.every(ok)) return null;
          return { house: Keypair.fromSecretKey(Uint8Array.from(o.house)), bots: (o.bots as number[][]).map((b) => Keypair.fromSecretKey(Uint8Array.from(b))) };
        } catch {
          return null;
        }
      }

      /** Bots first, then the house, back to `to`. Never throws; ok = every sweep went through. */
      export async function sweepAll(io: HouseIo, keys: HouseKeys, to: PublicKey): Promise<{ lamports: number; ok: boolean }> {
        let lamports = 0;
        let ok = true;
        for (const k of [...keys.bots, keys.house]) {
          try {
            lamports += (await io.sweep(k, to)).lamports;
          } catch {
            ok = false;
          }
        }
        return { lamports, ok };
      }

      const message = (e: unknown): string => (e instanceof Error ? e.message : String(e));

      async function waitPhase(io: HouseIo, read: () => Promise<TableView | null>, phase: TableView["phase"], timeoutMs: number): Promise<TableView> {
        const deadline = io.now() + timeoutMs;
        let last: TableView | null = null;
        while (io.now() < deadline) {
          last = await read().catch(() => null);
          if (last && last.phase === phase) return last;
          await io.sleep(500);
        }
        throw new Error(`The table did not reach ${phase} in ${Math.round(timeoutMs / 1000)} s (last: ${last ? last.phase : "unreadable"}).`);
      }

      /** The runner's bot loop (bots/src/runner.ts), driven through HouseIo and its clock. Returns the bots' ER trade signatures. */
      async function botLoop(
        io: HouseIo, ctx: DealContext, bots: Keypair[], start: TableView, rng: () => number,
        onView: (v: TableView) => void, signal: AbortSignal | undefined,
      ): Promise<string[]> {
        const seats = ctx.seatOwners
          .map((ow, seat) => ({ seat, key: bots.find((b) => b.publicKey.equals(ow)) ?? null }))
          .filter((x): x is { seat: number; key: Keypair } => x.key !== null);
        const own = await Promise.all(
          seats.map(async (b) => {
            const h = await io.readBotHand(ctx, b.key);
            if (!h) throw new Error(`Seat ${b.seat + 1} cannot read its own hand.`);
            return h[0] + h[1];
          }),
        );
        const personas = seats.map((b) => personaFor(b.seat, rng));
        const mems: BotMemory[] = seats.map(() => ({ wobble: 0 }));
        const startMs = start.startTs * 1000;
        const endMs = start.endTs * 1000;
        const next = personas.map((p) => io.now() + Math.floor(rng() * p.intervalMaxMs));
        const trades: string[] = [];
        let view = start;
        let lastRefresh = 0;
        while (io.now() < endMs - 1500) {
          if (signal?.aborted) throw new RoundAbortedError();
          let i = 0;
          for (let k = 1; k < next.length; k++) if (next[k] < next[i]) i = k;
          const wait = next[i] - io.now();
          if (wait > 0) await io.sleep(wait);
          if (io.now() >= endMs - 1500) break;
          if (io.now() - lastRefresh > 800) {
            view = (await io.erTable(ctx.payer, ctx.table).catch(() => null)) ?? view;
            lastRefresh = io.now();
            onView(view);
          }
          const seat = seats[i].seat;
          const order = decide(own[i], view.seats[seat].pos, io.now() - startMs, personas[i], mems[i], rng);
          if (order) {
            try {
              trades.push(await io.botTrade(seats[i].key, ctx.table, order.side, order.qty));
              view.seats[seat].pos += order.side === "buy" ? order.qty : -order.qty;
            } catch {
              // a skipped bot trade is not fatal (same as the runner)
            }
          }
          const p = personas[i];
          next[i] = io.now() + Math.floor(p.intervalMinMs + rng() * (p.intervalMaxMs - p.intervalMinMs));
        }
        return trades;
      }

      /**
       * One wallet-mode round. Wallet popups, in order: fund (one tx, four transfers), join (seat 1), sign-in (signMessage for
       * the TEE token). Trades are the UI's (tradeWith on event.walletEr). The house and the bots do everything else, and every
       * in-tab key is swept back to the wallet at the end, on error, and on abort.
       */
      export async function runWalletRound(io: HouseIo, wallet: WalletSigner, vault: KeyVault, o: WalletRoundOptions = {}): Promise<WalletRoundResult> {
        const emit = (e: WalletRoundEvent) => o.onEvent?.(e);
        const check = () => {
          if (o.signal?.aborted) throw new RoundAbortedError();
        };
        const durationSecs = o.durationSecs ?? WALLET_ROUND_SECS;
        const rng = mulberry32(o.seed ?? io.now() >>> 0);
        const budget = walletRoundBudget(await io.rent());
        const have = await io.balance(wallet.publicKey);
        if (have < budget.total) throw new InsufficientFundsError(budget.total, have);
        const keys = newHouseKeys();
        vault.save(keys); // before the funding popup, so a reload after funding can still sweep
        const { house, bots } = keys;
        let popups = 0;
        try {
          emit({ phase: "funding" });
          await io.fund(wallet, [{ to: house.publicKey, lamports: budget.house }, ...bots.map((b) => ({ to: b.publicKey, lamports: budget.bot }))]);
          popups++;
          check();
          const roundId = new BN(io.now());
          const id = roundId.toString();
          const table = tablePda(roundId);
          emit({ phase: "opening", table, roundId: id });
          const openSig = await io.openTable(house, roundId, durationSecs);
          check();
          emit({ phase: "joining", table, roundId: id });
          const joins = [await io.joinWallet(wallet, table)];
          popups++;
          check();
          emit({ phase: "signing-in", table, roundId: id });
          const walletEr = await io.signIn(wallet);
          popups++;
          check();
          emit({ phase: "seating-bots", table, roundId: id, walletEr });
          for (const b of bots) joins.push(await io.joinBot(house, b, table));
          const seated = await io.baseTable(table);
          if (!seated || seated.seatCount !== 4) throw new Error("The table did not fill four seats.");
          const owners = seated.seats.map((s) => s.owner);
          const ctx: DealContext = { roundId, table, seatOwners: owners, payer: house, seatKeys: bots };
          check();
          emit({ phase: "delegating", table, roundId: id, walletEr, view: seated });
          const delegations = await io.delegate(house, roundId, table, owners);
          const setup = await io.afterDelegate(ctx);
          check();
          emit({ phase: "dealing", table, roundId: id, walletEr });
          const dealSig = await io.requestDeal(house, table, Math.floor(rng() * 256));
          let view = await waitPhase(io, () => io.erTable(house, table), "trading", 45_000);
          emit({ phase: "trading", table, roundId: id, walletEr, view });
          const trades = await botLoop(io, ctx, bots, view, rng, (v) => emit({ phase: "trading", table, roundId: id, walletEr, view: v }), o.signal);
          const bellAt = view.endTs * 1000 + 1000;
          if (io.now() < bellAt) await io.sleep(bellAt - io.now());
          emit({ phase: "bell", table, roundId: id, walletEr });
          const reveal = await io.reveal(ctx);
          view = await waitPhase(io, () => io.erTable(house, table), "revealed", 60_000);
          emit({ phase: "settling", table, roundId: id, walletEr, view });
          const settleSig = await io.settle(house, view);
          await io.waitForOwner(table, PROGRAM_ID, 120_000);
          const settled = await waitPhase(io, () => io.baseTable(table), "settled", 30_000);
          emit({ phase: "claiming", table, roundId: id, walletEr, view: settled });
          const claimSig = await io.claim(house, settled);
          const commitUndelegate = await io.commitSignatures(table, [openSig, ...joins, ...delegations, claimSig]);
          emit({ phase: "sweeping", table, roundId: id, walletEr, view: settled });
          const swept = await sweepAll(io, keys, wallet.publicKey);
          if (swept.ok) vault.clear();
          const winnerSeat = settled.winner ?? 0;
          const proof: ProofData = {
            generatedAt: new Date(io.now()).toISOString(), mode: "tee", programId: PROGRAM_ID.toBase58(), table: table.toBase58(),
            roundId: id, validator: TEE_VALIDATOR.toBase58(), erRpc: TEE_RPC,
            base: { openTable: openSig, joins, delegations, commitUndelegate, claimPot: claimSig },
            er: { setup, requestDeal: dealSig, trades, reveal, settle: settleSig },
            result: {
              hiddenSum: settled.hiddenSum, closeC: settled.priceC, winnerSeat, winner: settled.seats[winnerSeat].owner.toBase58(),
              pnlC: settled.pnlC, potLamports: ENTRY_LAMPORTS * 4, cards: settled.cards,
            },
          };
          emit({ phase: "done", table, roundId: id, walletEr, view: settled, swept: swept.lamports });
          return { proof, walletPopups: popups, sweptLamports: swept.lamports, budget, table, roundId: id };
        } catch (e) {
          emit({ phase: "sweeping" });
          const swept = await sweepAll(io, keys, wallet.publicKey);
          if (swept.ok) vault.clear();
          emit({ phase: "error", error: message(e), swept: swept.lamports });
          throw e;
        }
      }
      ```

- [ ] **Step 4: Implement `bots/src/house-io.ts`** (the devnet HouseIo; browser-safe: no `node:*`)
      ```ts
      import type BN from "bn.js";
      import { Keypair, type PublicKey } from "@solana/web3.js";
      import {
        ENTRY_LAMPORTS, TeeDealAdapter, baseConnection, claimPot, delegatePdas, fetchTable, findCommitSignatures, fundingIxs, joinTable,
        joinTableWith, makeProgram, openTable, requestDeal, sendTrade, sendWithSigner, settleRound, sweepTo, teeConnectionForSigner, waitForOwner,
      } from "@hidden-hand/client";
      import type { HouseIo } from "./house-round";
      import { retryStaleProgram } from "./retry";

      export function liveHouseIo(log: (m: string) => void = () => undefined): HouseIo {
        const base = baseConnection();
        const adapter = new TeeDealAdapter();
        const reader = makeProgram(base, Keypair.generate()); // reads and rent sizes only; never signs or funds
        const onBase = (kp: Keypair) => makeProgram(base, kp);
        const onEr = async (kp: Keypair) => makeProgram(await adapter.erConnection(kp), kp);
        return {
          rent: async () => ({
            tableRent: await base.getMinimumBalanceForRentExemption(reader.account.table.size),
            handRent: await base.getMinimumBalanceForRentExemption(reader.account.hand.size),
          }),
          balance: (who: PublicKey) => base.getBalance(who, "confirmed"),
          fund: (wallet, targets) => sendWithSigner(base, fundingIxs(wallet.publicKey, targets), wallet),
          openTable: (house, roundId: BN, secs) => openTable(onBase(house), house, roundId, "tee", secs, ENTRY_LAMPORTS),
          joinWallet: (wallet, table) => joinTableWith(base, wallet, table),
          signIn: async (wallet) => (await teeConnectionForSigner(wallet)).connection,
          joinBot: (house, bot, table) => joinTable(onBase(house), house, bot, table, adapter.commitmentFor()),
          baseTable: (table) => fetchTable(reader, table),
          delegate: (house, roundId, table, owners) => delegatePdas(onBase(house), house, roundId, table, owners, adapter.validator),
          afterDelegate: (ctx) => adapter.afterDelegate(ctx),
          requestDeal: async (house, table, seed) => {
            const er = await onEr(house);
            return retryStaleProgram(() => requestDeal(er, house, table, seed), { log });
          },
          erTable: async (house, table) => fetchTable(await onEr(house), table),
          readBotHand: (ctx, bot) => adapter.readOwnHand(ctx, bot),
          botTrade: async (bot, table, side, qty) => sendTrade(await onEr(bot), bot, table, side, qty),
          reveal: (ctx) => adapter.reveal(ctx),
          settle: async (house, view) => settleRound(await onEr(house), house, view),
          waitForOwner: (table, owner, ms) => waitForOwner(base, table, owner, ms),
          claim: (house, view) => claimPot(onBase(house), house, view),
          commitSignatures: (table, known) => findCommitSignatures(base, table, known),
          sweep: (from, to) => sweepTo(base, from, to),
          now: () => Date.now(),
          sleep: (ms) => new Promise<void>((r) => setTimeout(r, ms)),
        };
      }
      ```
      If `TeeDealAdapter`, `joinTable`, `openTable`, `delegatePdas`, `requestDeal`, `waitForOwner` or `fetchTable` are not re-exported from `@hidden-hand/client`'s root, they are (see `client/src/index.ts`: `round-base`, `round-play`, `deal/index`); do not add exports to the client package in this task.

- [ ] **Step 5: Public entry** `bots/src/house.ts`, plus the package export and the smoke import
      ```ts
      export * from "./house-round";
      export * from "./house-io";
      ```
      In `bots/package.json` `exports`, add `"./house": "./src/house.ts"` (keep `.`, `./policy`, `./sim` as they are; do NOT add the house modules to `bots/src/index.ts`, so the landing bundle that imports `@hidden-hand/bots` does not pull the Solana client). Append `import "../src/house";` to `bots/scripts/smoke.ts` above its `console.log`.

- [ ] **Step 6: Run to confirm it passes (THE GATE)**
      Run: `pnpm --filter @hidden-hand/bots verify`
      Expected: PASS: `tsc` prints nothing, vitest reports every test file passed (including `test/house-round.test.ts`), and the last line is `SMOKE: OK`.

- [ ] **Step 7: Commit (kernel-performed — no agent runs this)**
      Message: `feat(bots): browser-safe wallet round (in-tab house and bots, HouseIo, sweep)`

---

### Task 24: Node integration script for a wallet round (mock Wallet Standard wallet signing for real) + wallet proof format

**Files:**
- Create: `bots/src/wallet-proof.ts`
- Create: `bots/scripts/wallet-round.ts`
- Create: `bots/scripts/check-wallet-proof.ts`
- Modify: `bots/package.json`
- Test: `bots/test/wallet-proof.test.ts`

**Depends on:** Task 23, Task 22, Task 7
**Effort:** medium
**Provides:** `pnpm --filter @hidden-hand/bots wallet-round -- [--dry] [--proof] [--duration <secs>] [--sign-delay-ms <ms>] -> runs one devnet wallet-mode round with the .env burner as a mock Wallet Standard wallet; writes docs/proof/wallet-round.md with --proof; last line "WALLET-ROUND: DONE …" (or "WALLET-ROUND: DRY OK" with --dry)`, `pnpm --filter @hidden-hand/bots check-wallet-proof -> last line "WALLET-PROOF: PASS"`, `@hidden-hand/bots/wallet-proof: formatWalletProof(d: ProofData, x: WalletProofExtra): string, checkWalletProof(text: string): { ok: boolean; missing: string[] }`
**Requires:** `@hidden-hand/bots/house: runWalletRound(io: HouseIo, wallet: WalletSigner, vault: KeyVault, o?: WalletRoundOptions): Promise<WalletRoundResult>`, `@hidden-hand/bots/house: interface HouseIo (all chain calls), liveHouseIo(log?: (m: string) => void): HouseIo`, `@hidden-hand/bots/house: walletRoundBudget(r: RoundRent): WalletRoundBudget, InsufficientFundsError { needLamports; haveLamports }, RoundAbortedError, interface KeyVault { load(): HouseKeys | null; save(keys: HouseKeys): void; clear(): void }, memoryVault(): KeyVault, serializeKeys(k: HouseKeys): string, parseKeys(text: string): HouseKeys | null, sweepAll(io: HouseIo, keys: HouseKeys, to: PublicKey): Promise<{ lamports: number; ok: boolean }>`, `@hidden-hand/bots: formatProof(data: ProofData): string, checkProof(text: string): { ok: boolean; missing: string[] }`, `@hidden-hand/client: interface WalletSigner { readonly publicKey: PublicKey; signTransaction(tx: Transaction): Promise<Transaction>; signMessage(message: Uint8Array): Promise<Uint8Array> }, keypairSigner(kp: Keypair): WalletSigner, countingSigner(s: WalletSigner, onPopup: (kind: "transaction" | "message") => void): WalletSigner`, `@hidden-hand/client: SOLANA_DEVNET_CHAIN, isSolanaSigningWallet(w: Wallet): boolean, connectStandard(w: Wallet): Promise<WalletAccount>, standardSigner(w: Wallet, account: WalletAccount, chain?: IdentifierString): WalletSigner, mockStandardWallet(kp: Keypair, o?: MockWalletOptions): Wallet`, `@hidden-hand/client: joinTableWith(base: Connection, signer: WalletSigner, table: PublicKey): Promise<string>, tradeWith(er: Connection, signer: WalletSigner, table: PublicKey, side: Side, qty: number): Promise<string>, readHandAs(er: Connection, table: PublicKey, owner: PublicKey, timeoutMs?: number): Promise<[number, number] | null>, fundingIxs(from: PublicKey, targets: { to: PublicKey; lamports: number }[]): TransactionInstruction[], sweepTo(base: Connection, from: Keypair, to: PublicKey): Promise<{ sig: string | null; lamports: number }>, sweepLamports(balance: number): number, isBlockhashExpired(e: unknown): boolean, isUserRejection(e: unknown): boolean`

This task writes and unit-tests the script; it never runs the live round and never reads the burner (that is `gates:25`, a human gate). The client functions the script uses (signatures from `client/src/wallet`): `mockStandardWallet(kp: Keypair, o?: { onSign?; reject? }): Wallet`, `connectStandard(w): Promise<WalletAccount>`, `standardSigner(w, account): WalletSigner`, `countingSigner(s, onPopup)`, `tradeWith(er, signer, table, side, qty): Promise<string>`, `readHandAs(er, table, owner, timeoutMs?)`, `isBlockhashExpired(e)`; `handEdge(cards: [number, number]): number` from `@hidden-hand/client/engine`; `loadBurner(): Keypair`, `REPO_ROOT` from `@hidden-hand/client/node`.

- [ ] **Step 1: Write the failing test** `bots/test/wallet-proof.test.ts`
      ```ts
      import { describe, expect, it } from "vitest";
      import type { ProofData } from "../src/proof";
      import { checkWalletProof, formatWalletProof, type WalletProofExtra } from "../src/wallet-proof";

      const S = (c: string) => c.repeat(88);
      const data: ProofData = {
        generatedAt: "2026-11-27T10:00:00.000Z", mode: "tee", programId: "HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb", table: "11111111111111111111111111111111",
        roundId: "1", validator: "MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo", erRpc: "https://devnet-tee.magicblock.app",
        base: { openTable: S("2"), joins: [S("3")], delegations: [S("4")], commitUndelegate: [S("5")], claimPot: S("6") },
        er: { setup: [S("7")], requestDeal: S("8"), trades: [S("9")], reveal: [S("A")], settle: S("B") },
        result: { hiddenSum: 60, closeC: 6100, winnerSeat: 0, winner: "11111111111111111111111111111111", pnlC: [1, 2, 3, 4], potLamports: 40_000_000, cards: [1, 2, 3, 4, 5, 6, 7, 8] },
      };
      const extra: WalletProofExtra = {
        wallet: "11111111111111111111111111111111", popups: { fund: 1, join: 1, signIn: 1, trades: 3, total: 6 }, walletTrades: [S("C"), S("D"), S("E")],
        delayedSign: { delayMs: 8000, landed: true, error: null }, budgetLamports: 110_000_000, spentLamports: 30_000_000, sweptLamports: 70_000_000,
      };

      describe("wallet proof", () => {
        it("formats a proof that checks", () => {
          const text = formatWalletProof(data, extra);
          expect(text.startsWith("# Devnet wallet-mode round proof")).toBe(true);
          expect(checkWalletProof(text)).toEqual({ ok: true, missing: [] });
        });
        it("records a failed delayed signature honestly and still checks", () => {
          const text = formatWalletProof(data, { ...extra, delayedSign: { delayMs: 8000, landed: false, error: "Blockhash not found" } });
          expect(text).toContain("- delayed signature (8000 ms before signing): failed: Blockhash not found");
          expect(checkWalletProof(text).ok).toBe(true);
        });
        it("fails without wallet trades", () => {
          const r = checkWalletProof(formatWalletProof(data, { ...extra, walletTrades: [], popups: { ...extra.popups, trades: 0, total: 3 } }));
          expect(r.ok).toBe(false);
          expect(r.missing).toContain("wallet trades");
        });
      });
      ```

- [ ] **Step 2: Run to confirm it fails**
      Run: `pnpm --filter @hidden-hand/bots exec vitest run test/wallet-proof.test.ts`
      Expected: FAIL: cannot resolve `../src/wallet-proof`.

- [ ] **Step 3: Implement `bots/src/wallet-proof.ts`**
      ```ts
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
      ```

- [ ] **Step 4: Implement `bots/scripts/wallet-round.ts`**
      ```ts
      import { mkdirSync, writeFileSync } from "node:fs";
      import { resolve } from "node:path";
      import type { Connection, PublicKey } from "@solana/web3.js";
      import {
        type Side, type WalletSigner, baseConnection, connectStandard, countingSigner, isBlockhashExpired, mockStandardWallet, readHandAs, standardSigner, tradeWith,
      } from "@hidden-hand/client";
      import { handEdge } from "@hidden-hand/client/engine";
      import { REPO_ROOT, loadBurner } from "@hidden-hand/client/node";
      import { liveHouseIo, memoryVault, runWalletRound, walletRoundBudget, type WalletRoundEvent } from "../src/house";
      import { DEMO_SEED } from "../src/policy";
      import { checkWalletProof, formatWalletProof, type WalletProofExtra } from "../src/wallet-proof";

      const argv = process.argv.slice(2);
      const has = (f: string) => argv.includes(f);
      const val = (f: string) => {
        const i = argv.indexOf(f);
        return i >= 0 ? argv[i + 1] : undefined;
      };
      const log = (m: string) => console.log(`[wallet-round ${new Date().toISOString()}] ${m}`);
      const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
      const short = (e: unknown) => (e instanceof Error ? e.message : String(e)).replace(/\s+/g, " ").slice(0, 160);

      async function dry(): Promise<void> {
        const b = walletRoundBudget({ tableRent: 10_000_000, handRent: 1_500_000 });
        log(`dry: budget house ${b.house}, bot ${b.bot} x3, wallet ${b.wallet}, total ${b.total} lamports (sample rents)`);
        log("dry: popups fund -> join -> sign-in -> trades; house: open, bot joins, delegate x5, permissions, deal, reveal, settle, claim, sweep");
        console.log("WALLET-ROUND: DRY OK");
      }

      /** A human who follows the hint: hold handEdge(hand) contracts, lots of at most 5, one popup per trade. */
      async function human(er: Connection, signer: WalletSigner, slow: WalletSigner, table: PublicKey, endMs: number, x: WalletProofExtra, delayMs: number): Promise<void> {
        const hand = await readHandAs(er, table, signer.publicKey, 30_000);
        if (!hand) throw new Error("the wallet could not read its own hand through its TEE connection");
        const hint = handEdge(hand);
        // a zero hint still exercises the delayed signature: go long 1, then back to flat below
        const target = hint === 0 ? 1 : hint;
        log(`wallet hand ${hand[0]} + ${hand[1]}: hint ${hint > 0 ? "+" : ""}${hint} contracts`);
        let pos = 0;
        let first = true;
        while (Date.now() < endMs - 4000 && pos !== target) {
          const side: Side = target > pos ? "buy" : "sell";
          const qty = Math.min(5, Math.abs(target - pos));
          try {
            const sig = await tradeWith(er, first ? slow : signer, table, side, qty);
            if (first) x.delayedSign = { delayMs, landed: true, error: null };
            x.walletTrades.push(sig);
            pos += side === "buy" ? qty : -qty;
          } catch (e) {
            if (!first) throw e;
            x.delayedSign = { delayMs, landed: false, error: short(e) };
            log(`delayed signature failed (${isBlockhashExpired(e) ? "blockhash expired" : "other"}): ${short(e)}`);
          }
          first = false;
          await sleep(2500);
        }
        if (hint === 0 && pos !== 0 && Date.now() < endMs - 4000) {
          x.walletTrades.push(await tradeWith(er, signer, table, pos > 0 ? "sell" : "buy", Math.abs(pos)));
        }
      }

      async function live(): Promise<void> {
        const delayMs = Number(val("--sign-delay-ms") ?? 8000);
        const burner = loadBurner();
        const base = baseConnection();
        const popups = { fund: 0, join: 0, signIn: 0, trades: 0, total: 0 };
        let stage: "fund" | "join" | "signIn" | "trades" = "fund";
        const wallet = mockStandardWallet(burner, { name: "Mock Wallet (burner)" });
        const raw = standardSigner(wallet, await connectStandard(wallet));
        const signer = countingSigner(raw, () => {
          popups[stage] += 1;
          popups.total += 1;
        });
        const slow: WalletSigner = {
          publicKey: signer.publicKey,
          signMessage: (m) => signer.signMessage(m),
          signTransaction: async (tx) => {
            await sleep(delayMs);
            return signer.signTransaction(tx);
          },
        };
        const x: WalletProofExtra = {
          wallet: signer.publicKey.toBase58(), popups, walletTrades: [], delayedSign: { delayMs, landed: false, error: "not attempted" },
          budgetLamports: 0, spentLamports: 0, sweptLamports: 0,
        };
        const before = await base.getBalance(signer.publicKey, "confirmed");
        const run: { human: Promise<void> | null } = { human: null };
        const onEvent = (e: WalletRoundEvent) => {
          if (e.phase === "funding") stage = "fund";
          if (e.phase === "joining") stage = "join";
          if (e.phase === "signing-in") stage = "signIn";
          if (e.phase === "trading" && run.human === null && e.walletEr && e.table && e.view) {
            stage = "trades";
            run.human = human(e.walletEr, signer, slow, e.table, e.view.endTs * 1000, x, delayMs);
          }
          if (e.phase !== "trading") log(`phase ${e.phase}${e.error ? `: ${e.error}` : ""}`);
        };
        const r = await runWalletRound(liveHouseIo(log), signer, memoryVault(), { durationSecs: Number(val("--duration") ?? 90), seed: DEMO_SEED, onEvent });
        if (run.human) await run.human;
        const after = await base.getBalance(signer.publicKey, "confirmed");
        x.budgetLamports = r.budget.total;
        x.sweptLamports = r.sweptLamports;
        x.spentLamports = before - after;
        const text = formatWalletProof(r.proof, x);
        const check = checkWalletProof(text);
        if (has("--proof")) {
          mkdirSync(resolve(REPO_ROOT, "docs/proof"), { recursive: true });
          writeFileSync(resolve(REPO_ROOT, "docs/proof/wallet-round.md"), text, "utf8");
          log("wrote docs/proof/wallet-round.md");
        }
        if (!check.ok) throw new Error(`proof incomplete: ${check.missing.join(", ")}`);
        console.log(
          `WALLET-ROUND: DONE table ${r.proof.table}, hidden sum ${r.proof.result.hiddenSum}, close ${(r.proof.result.closeC / 100).toFixed(2)}, ` +
            `popups ${popups.total}, delayed sign ${x.delayedSign.landed ? "landed" : "failed"}, spent ${(x.spentLamports / 1e9).toFixed(4)} SOL`,
        );
      }

      (has("--dry") ? dry() : live()).catch((e) => {
        console.error(`WALLET-ROUND: FAIL ${short(e)}`);
        process.exitCode = 1;
      });
      ```
      The burner's secret key never leaves `loadBurner()` / the mock wallet; nothing prints it.

- [ ] **Step 5: Implement `bots/scripts/check-wallet-proof.ts`**
      ```ts
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
      ```

- [ ] **Step 6: Package scripts and export** in `bots/package.json`: add `"wallet-round": "tsx scripts/wallet-round.ts"` and `"check-wallet-proof": "tsx scripts/check-wallet-proof.ts"` under `scripts`, and `"./wallet-proof": "./src/wallet-proof.ts"` under `exports`.

- [ ] **Step 7: Run to confirm it passes (THE GATE)**
      Run: `pnpm --filter @hidden-hand/bots verify; if ($?) { pnpm --filter @hidden-hand/bots wallet-round -- --dry }`
      Expected: PASS: `tsc` prints nothing, vitest passes every test file (including `test/wallet-proof.test.ts`), `SMOKE: OK`, and the last line is `WALLET-ROUND: DRY OK`.

- [ ] **Step 8: Commit (kernel-performed — no agent runs this)**
      Message: `feat(bots): wallet-round integration script and wallet proof format`

---

### Task 25: Devnet wallet round with proof (HUMAN GATE — signs devnet txs with the burner as the wallet)

**Files:**
- Create: `docs/proof/wallet-round.md`
- Modify: `docs/gates/2026-11-26-gate-ledger.md`

**Depends on:** Task 24
**Effort:** low
**Model tier:** top
**Provides:** `docs/proof/wallet-round.md (a full devnet wallet-mode round: wallet popups, wallet ER trades, the delayed-signature measurement, measured spend)`
**Requires:** `pnpm --filter @hidden-hand/bots wallet-round -- [--dry] [--proof] [--duration <secs>] [--sign-delay-ms <ms>] -> runs one devnet wallet-mode round with the .env burner as a mock Wallet Standard wallet; writes docs/proof/wallet-round.md with --proof; last line "WALLET-ROUND: DONE …" (or "WALLET-ROUND: DRY OK" with --dry)`, `pnpm --filter @hidden-hand/bots check-wallet-proof -> last line "WALLET-PROOF: PASS"`

Run by the gate-concierge only after the user consents in this session ("run the wallet round"). The burner from the git-ignored `.env` plays the wallet; it is never printed.

- [ ] **Step 1: Balance check**
      Run: `pnpm --filter @hidden-hand/client balance -- --min 0.2`
      Expected: last line `BURNER-BALANCE: PASS`. If it fails, top up the burner from faucet.solana.com (devnet) and re-run.
- [ ] **Step 2: The round** (about 3 minutes)
      Run: `pnpm --filter @hidden-hand/bots wallet-round -- --proof`
      Expected: last line starts with `WALLET-ROUND: DONE`. On `WALLET-ROUND: FAIL`, record the line in the ledger and stop; the orchestrator relays it to the user (it decides the GO/NO-GO).
- [ ] **Step 3: Ledger** — append one row to `docs/gates/2026-11-26-gate-ledger.md`: time (UTC), `wallet-round`, the table address, popups, the delayed-signature result (landed / failed + reason) and the measured spend from the proof's `## Wallet mode` section. If the delayed signature failed, say so in the row: Task 26's UI copy ("sign within a few seconds") depends on it.
- [ ] **Step 4: Run to confirm it passes (THE GATE)**
      Run: `pnpm --filter @hidden-hand/bots check-wallet-proof`
      Expected: PASS: last line `WALLET-PROOF: PASS`.
- [ ] **Step 5: Commit (kernel-performed — no agent runs this)**
      Message: `chore(gates): devnet wallet-mode round proof`

---

### Task 26: Web wallet mode at /app/ (connect, precheck, states, popup counter, wallet trades) with Express kept

**Files:**
- Create: `web/src/app/wallet/route.ts`
- Create: `web/src/app/wallet/walletStates.ts`
- Create: `web/src/app/wallet/sessionVault.ts`
- Create: `web/src/app/wallet/discover.ts`
- Create: `web/src/app/wallet/useWalletRound.ts`
- Create: `web/src/app/wallet/WalletPanel.tsx`
- Create: `web/src/app/wallet/WalletApp.tsx`
- Modify: `web/src/app/App.tsx`
- Modify: `web/src/app/Desk.tsx`
- Modify: `web/src/app/app.css`
- Modify: `web/app/index.html`
- Modify: `web/package.json`
- Modify: `pnpm-lock.yaml`
- Test: `web/test/walletStates.test.ts`

**Depends on:** Task 23, Task 22, Task 9
**Effort:** high
**Model tier:** top
**Provides:** `/app/ (no params) — wallet mode: connect a Wallet Standard wallet, precheck, fund, join, sign in, trade with one popup per trade; /app/?round=<id> and /app/?mode=express — Express mode, unchanged`, `@hidden-hand/web: playMode(search: string): "wallet" | "express", deriveWalletUi(i: WalletUiInput): WalletUi`
**Requires:** `@hidden-hand/bots/house: runWalletRound(io: HouseIo, wallet: WalletSigner, vault: KeyVault, o?: WalletRoundOptions): Promise<WalletRoundResult>`, `@hidden-hand/bots/house: type WalletPhase = "funding" | "opening" | "joining" | "signing-in" | "seating-bots" | "delegating" | "dealing" | "trading" | "bell" | "settling" | "claiming" | "sweeping" | "done" | "error"; interface WalletRoundEvent { phase; table?; roundId?; walletEr?; view?; error?; swept? }; interface WalletRoundResult { proof: ProofData; walletPopups: number; sweptLamports: number; budget: WalletRoundBudget; table: PublicKey; roundId: string }`, `@hidden-hand/bots/house: interface HouseIo (all chain calls), liveHouseIo(log?: (m: string) => void): HouseIo`, `@hidden-hand/bots/house: walletRoundBudget(r: RoundRent): WalletRoundBudget, InsufficientFundsError { needLamports; haveLamports }, RoundAbortedError, interface KeyVault { load(): HouseKeys | null; save(keys: HouseKeys): void; clear(): void }, memoryVault(): KeyVault, serializeKeys(k: HouseKeys): string, parseKeys(text: string): HouseKeys | null, sweepAll(io: HouseIo, keys: HouseKeys, to: PublicKey): Promise<{ lamports: number; ok: boolean }>`, `/app/?round=<id>[&mode=tee|commit-reveal] — the live desk (spectate any round; take the free seat; trade with the hand hint)`, `@hidden-hand/web: deriveUiState(input: UiInput): UiState`, `@hidden-hand/client: interface WalletSigner { readonly publicKey: PublicKey; signTransaction(tx: Transaction): Promise<Transaction>; signMessage(message: Uint8Array): Promise<Uint8Array> }, keypairSigner(kp: Keypair): WalletSigner, countingSigner(s: WalletSigner, onPopup: (kind: "transaction" | "message") => void): WalletSigner`, `@hidden-hand/client: sendWithSigner(connection: Connection, ixs: TransactionInstruction[], signer: WalletSigner, extraSigners?: Keypair[]): Promise<string>, readonlyProgram(connection: Connection, publicKey: PublicKey): Program<HiddenHand>, teeConnectionForSigner(signer: WalletSigner, getToken?: AuthTokenFn): Promise<{ connection: Connection; expiresAt: number }>`, `@hidden-hand/client: SOLANA_DEVNET_CHAIN, isSolanaSigningWallet(w: Wallet): boolean, connectStandard(w: Wallet): Promise<WalletAccount>, standardSigner(w: Wallet, account: WalletAccount, chain?: IdentifierString): WalletSigner, mockStandardWallet(kp: Keypair, o?: MockWalletOptions): Wallet`, `@hidden-hand/client: joinTableWith(base: Connection, signer: WalletSigner, table: PublicKey): Promise<string>, tradeWith(er: Connection, signer: WalletSigner, table: PublicKey, side: Side, qty: number): Promise<string>, readHandAs(er: Connection, table: PublicKey, owner: PublicKey, timeoutMs?: number): Promise<[number, number] | null>, fundingIxs(from: PublicKey, targets: { to: PublicKey; lamports: number }[]): TransactionInstruction[], sweepTo(base: Connection, from: Keypair, to: PublicKey): Promise<{ sig: string | null; lamports: number }>, sweepLamports(balance: number): number, isBlockhashExpired(e: unknown): boolean, isUserRejection(e: unknown): boolean`

**Before writing any code, read `~/.claude/skills/design-taste-frontend/SKILL.md` in full**, then its `references/copy.md`, `copy-voice.md`, `system.md`, `layout-v4.md`, `sections.md` (the software `app-frame` recipe), `cards.md`, `motion.md` and `gate.md`. The skill is the only source of truth for every visual decision; no other design library, skill or default may set one; never copy the skill into the repo. Same system as today's `/app/`: `web/src/shared/tokens.css`, the kit from `/assets/*`, radius sharp, buttons tonal; nothing is dealt again. The wallet UI must be built from the existing desk classes (`desk-panel__title`, `desk-panel__text`, `desk-code`, `desk-note`, `btn btn--primary`, `btn btn--secondary`, `btn-row`) plus the minimum new rules in `app.css`.

Client and bots API you call (signatures as built by Tasks 22–23): `getWallets()` from `@wallet-standard/app` (`get(): Wallet[]`, `on("register" | "unregister", cb): () => void`); `isSolanaSigningWallet(w)`, `connectStandard(w)`, `standardSigner(w, account)`, `countingSigner(s, onPopup)`, `tradeWith(er, signer, table, side, qty)`, `readHandAs(er, table, owner, timeoutMs?)`, `isBlockhashExpired(e)`, `isUserRejection(e)`, `baseConnection()`, `fetchTable(program, table)`, `readonlyProgram(connection, publicKey)`, `TEE_RPC` from `@hidden-hand/client`; `further(a, b)` and `type RoundApi` from `web/src/app/useRound.ts` (import only; do not edit that file). `RoundApi` is `{ roundParam; mode; ui: UiState; view; nowMs; seatKey; balance; mySeat; myHand; erRpc; sent; acting: "join" | "trade" | null; actionError; table; join; trade; retry }`.

- [ ] **Step 1: Dependency**
      Run: `pnpm --filter @hidden-hand/web add @wallet-standard/app@1.1.1 @wallet-standard/base@1.1.1`
      Expected: both in `web/package.json` `dependencies`; lockfile updated.

- [ ] **Step 2: Write the failing test** `web/test/walletStates.test.ts`
      ```ts
      import { describe, expect, it } from "vitest";
      import { playMode } from "../src/app/wallet/route";
      import { deriveWalletUi, type WalletUiInput } from "../src/app/wallet/walletStates";

      const base: WalletUiInput = { connected: false, wallets: [], balance: null, needLamports: null, phase: null, endTs: null, nowMs: 1_000_000, error: null };

      describe("playMode", () => {
        it("wallet mode is the default; a round link or ?mode=express is Express", () => {
          expect(playMode("")).toBe("wallet");
          expect(playMode("?foo=1")).toBe("wallet");
          expect(playMode("?round=1764230000000")).toBe("express");
          expect(playMode("?mode=express")).toBe("express");
          expect(playMode("?round=12&mode=tee")).toBe("express");
        });
      });

      describe("deriveWalletUi", () => {
        it("connect, checking, insufficient, ready", () => {
          expect(deriveWalletUi({ ...base, wallets: ["Phantom"] })).toEqual({ kind: "connect", wallets: ["Phantom"] });
          expect(deriveWalletUi({ ...base, connected: true })).toEqual({ kind: "checking" });
          expect(deriveWalletUi({ ...base, connected: true, balance: 5, needLamports: 10 })).toEqual({ kind: "insufficient", needLamports: 10, haveLamports: 5 });
          expect(deriveWalletUi({ ...base, connected: true, balance: 10, needLamports: 10 })).toEqual({ kind: "ready", needLamports: 10, haveLamports: 10 });
        });
        it("maps the round phases", () => {
          const at = (phase: WalletUiInput["phase"], endTs: number | null = null) => deriveWalletUi({ ...base, connected: true, balance: 1, needLamports: 1, phase, endTs }).kind;
          expect(at("funding")).toBe("funding");
          expect(at("opening")).toBe("opening");
          expect(at("joining")).toBe("joining");
          expect(at("signing-in")).toBe("signing-in");
          expect(at("seating-bots")).toBe("dealing");
          expect(at("delegating")).toBe("dealing");
          expect(at("dealing")).toBe("dealing");
          expect(at("trading", 1_030)).toBe("trading");
          expect(at("trading", 999)).toBe("bell");
          expect(at("bell")).toBe("bell");
          expect(at("settling")).toBe("bell");
          expect(at("claiming")).toBe("claim");
          expect(at("sweeping")).toBe("sweeping");
          expect(at("done")).toBe("settled");
        });
        it("trading carries the seconds left", () => {
          expect(deriveWalletUi({ ...base, connected: true, phase: "trading", endTs: 1_030 })).toEqual({ kind: "trading", secondsLeft: 30 });
        });
        it("an error wins and is retryable", () => {
          expect(deriveWalletUi({ ...base, connected: true, phase: "error", error: "boom" })).toEqual({ kind: "error", message: "boom", retryable: true });
        });
      });
      ```

- [ ] **Step 3: Run to confirm it fails**
      Run: `pnpm --filter @hidden-hand/web exec vitest run test/walletStates.test.ts`
      Expected: FAIL: cannot resolve `../src/app/wallet/route`.

- [ ] **Step 4: `web/src/app/wallet/route.ts` and `web/src/app/wallet/walletStates.ts`**
      ```ts
      // route.ts
      /** Wallet mode is the default; the runner's /app/?round=<id> link and ?mode=express keep Express mode. */
      export function playMode(search: string): "wallet" | "express" {
        const p = new URLSearchParams(search);
        return p.get("round") !== null || p.get("mode") === "express" ? "express" : "wallet";
      }
      ```
      ```ts
      // walletStates.ts
      import type { WalletPhase } from "@hidden-hand/bots/house";

      export interface WalletUiInput {
        connected: boolean;
        wallets: string[];
        balance: number | null;
        needLamports: number | null;
        phase: WalletPhase | null;
        endTs: number | null;
        nowMs: number;
        error: string | null;
      }
      export type WalletUi =
        | { kind: "connect"; wallets: string[] }
        | { kind: "checking" }
        | { kind: "insufficient"; needLamports: number; haveLamports: number }
        | { kind: "ready"; needLamports: number; haveLamports: number }
        | { kind: "funding" }
        | { kind: "opening" }
        | { kind: "joining" }
        | { kind: "signing-in" }
        | { kind: "dealing" }
        | { kind: "trading"; secondsLeft: number }
        | { kind: "bell" }
        | { kind: "claim" }
        | { kind: "sweeping" }
        | { kind: "settled" }
        | { kind: "error"; message: string; retryable: boolean };

      export function deriveWalletUi(i: WalletUiInput): WalletUi {
        if (i.error !== null || i.phase === "error") return { kind: "error", message: i.error ?? "The round stopped.", retryable: true };
        if (i.phase === null) {
          if (!i.connected) return { kind: "connect", wallets: i.wallets };
          if (i.balance === null || i.needLamports === null) return { kind: "checking" };
          return i.balance < i.needLamports
            ? { kind: "insufficient", needLamports: i.needLamports, haveLamports: i.balance }
            : { kind: "ready", needLamports: i.needLamports, haveLamports: i.balance };
        }
        switch (i.phase) {
          case "funding":
          case "opening":
          case "joining":
          case "signing-in":
            return { kind: i.phase };
          case "seating-bots":
          case "delegating":
          case "dealing":
            return { kind: "dealing" };
          case "trading": {
            const left = i.endTs === null ? 0 : Math.ceil(i.endTs - i.nowMs / 1000);
            return left > 0 ? { kind: "trading", secondsLeft: left } : { kind: "bell" };
          }
          case "bell":
          case "settling":
            return { kind: "bell" };
          case "claiming":
            return { kind: "claim" };
          case "sweeping":
            return { kind: "sweeping" };
          case "done":
            return { kind: "settled" };
        }
      }
      ```
      Run: `pnpm --filter @hidden-hand/web exec vitest run test/walletStates.test.ts` → Expected: PASS.

- [ ] **Step 5: `web/src/app/wallet/sessionVault.ts` and `web/src/app/wallet/discover.ts`**
      ```ts
      // sessionVault.ts — the in-tab house and bot keys: sessionStorage only (never localStorage), never sent anywhere.
      import { type KeyVault, parseKeys, serializeKeys } from "@hidden-hand/bots/house";

      const KEY = "hh-wallet-round-v1";
      export function sessionVault(): KeyVault {
        return {
          load() {
            try {
              const raw = window.sessionStorage.getItem(KEY);
              return raw ? parseKeys(raw) : null;
            } catch {
              return null;
            }
          },
          save(k) {
            try {
              window.sessionStorage.setItem(KEY, serializeKeys(k));
            } catch {
              // storage blocked: the keys live in memory for this round only
            }
          },
          clear() {
            try {
              window.sessionStorage.removeItem(KEY);
            } catch {
              // nothing stored
            }
          },
        };
      }
      ```
      ```ts
      // discover.ts — Wallet Standard discovery (Phantom, Solflare, Backpack register themselves here).
      import { getWallets } from "@wallet-standard/app";
      import type { Wallet } from "@wallet-standard/base";
      import { isSolanaSigningWallet } from "@hidden-hand/client";

      export function solanaWallets(): Wallet[] {
        return getWallets().get().filter(isSolanaSigningWallet);
      }
      export function onWalletsChanged(cb: () => void): () => void {
        const { on } = getWallets();
        const a = on("register", cb);
        const b = on("unregister", cb);
        return () => {
          a();
          b();
        };
      }
      ```

- [ ] **Step 6: `web/src/app/wallet/useWalletRound.ts`** — the hook. Return `{ round: RoundApi; wallet: WalletApi }` where
      ```ts
      export interface WalletApi {
        ui: WalletUi;
        wallets: { name: string; icon: string }[];
        walletName: string | null;
        address: string | null;
        balance: number | null;        // lamports, base devnet
        needLamports: number | null;   // walletRoundBudget(rent).total
        popups: number;                // every signTransaction / signMessage asked of the wallet this session
        swept: number | null;          // lamports swept back at the end
        leftover: boolean;             // sessionVault() holds keys from an unfinished round
        connect(name: string): Promise<void>;
        disconnect(): void;
        start(): Promise<void>;
        retry(): void;                 // error -> back to ready (re-reads balance); never re-runs a half round
        sweepLeftover(): Promise<void>;
      }
      ```
      Behaviour (each line is required):
      1. Discovery: `solanaWallets()` on mount and on `onWalletsChanged`; `wallets` = `{ name: w.name, icon: w.icon }`.
      2. `connect(name)`: `connectStandard(w)` then `signer = countingSigner(standardSigner(w, account), () => setPopups((n) => n + 1))` kept in a ref; `address = signer.publicKey.toBase58()`; then read `balance` with `baseConnection().getBalance(pk, "confirmed")` and `needLamports = walletRoundBudget(await liveHouseIo().rent()).total`; re-read the balance every 5 s while the UI is `insufficient` or `ready` (so a faucet top-up shows up). `leftover = sessionVault().load() !== null`.
      3. `start()`: `runWalletRound(liveHouseIo(), signer, sessionVault(), { onEvent, signal })` with an `AbortController` aborted on unmount. `onEvent` stores `phase`, `table`, `roundId`, `walletEr` (ref), `view` (merged with `further`) and `swept`. An `InsufficientFundsError` sets `balance`/`needLamports` from the error and returns to `insufficient`, never `error`. Any other rejection sets `error` to a one-line message: `isUserRejection(e)` → "You closed the wallet popup, so the round stopped. Leftover SOL was swept back to your wallet."; otherwise the error message (≤ 200 chars).
      4. Table view poll (700 ms) once `table` is known, exactly like `useRound`'s read loop: the wallet's TEE connection (`readonlyProgram(walletEr, signer.publicKey)`) first, then the base layer; keep the furthest view with `further(prev, next)`.
      5. Own hand: once the phase is `trading` and `walletEr` exists, `readHandAs(walletEr, table, signer.publicKey, 20_000)` in a loop until it returns cards (1 s between tries); store it as `myHand`.
      6. `trade(side, qty)`: `setActing("trade")`, `tradeWith(walletEr, signer, table, side, qty)`, append `{ sig, side, qty }` to `sent`. Errors: `isBlockhashExpired(e)` → actionError "That signature took too long for the Rollup. Sign again a little faster."; `isUserRejection(e)` → "You closed the popup. No trade was sent."; otherwise the message (≤ 200 chars). Expired or rejected trades are not added to `sent`.
      7. `round: RoundApi` = `{ roundParam: roundId, mode: "tee", ui: view ? deriveUiState({ roundParam: roundId, loading: false, error: null, view, nowMs }) : { kind: "loading" }, view, nowMs, seatKey: address ?? "", balance, mySeat: index of the wallet pubkey in view.seats (null if absent), myHand, erRpc: TEE_RPC, sent, acting, actionError, table, join: async () => {}, trade, retry }`, `nowMs` ticking every 500 ms.
      8. `sweepLeftover()`: `sweepAll(liveHouseIo(), keys, signer.publicKey)`; clear the vault when `ok`; update `balance`.
      9. Never log, render or store a secret key; only public keys are rendered.

- [ ] **Step 7: `web/src/app/wallet/WalletPanel.tsx`** — one panel per non-trading `WalletUi` kind, rendered into the desk's panel slot. Copy (exact strings; voice per the skill's `copy.md`, technical-dry):
      - `connect`: title "Play with your wallet"; text "Connect a devnet wallet (Phantom, Solflare or Backpack). You hold one seat; three bots hold the others."; one row per detected wallet (icon + name, a button each); the primary button labelled exactly **"Connect a wallet"** is always rendered (with no wallet detected it reveals the install line "No Solana wallet found in this browser. Install Phantom, Solflare or Backpack, switch it to devnet, and reload."). A secondary link "Express mode (no wallet)" → `/app/?mode=express`. Then the honest note: "The price only finds the hidden sum when every seat trades its hand. A random or idle human breaks the reveal, so follow the hint."
      - `checking`: "Reading your devnet balance…"
      - `insufficient`: title "Not enough devnet SOL"; text "One round needs {need} SOL: your seat (0.01 entry plus rent) and the house and three bots, whose leftover is swept back to you. This wallet holds {have} SOL."; primary link "Get devnet SOL" → `https://faucet.solana.com` (new tab, `rel="noopener"`); note "This page checks again every 5 seconds."
      - `ready`: title "Ready: {need} SOL for one round"; text "You will sign, in order: one transfer that funds the house and three bots, your seat on Solana, one message that unlocks your sealed hand on the Private ER, then one popup per trade."; primary "Open a table" → `start()`. If `leftover`, a secondary "Sweep leftover SOL" → `sweepLeftover()`.
      - `funding`: "Approve the transfer in your wallet (popup 1). It funds the house and three bots for this round."
      - `opening`: "Opening a table on Solana devnet…"
      - `joining`: "Approve your seat in your wallet (popup 2): 0.01 SOL entry plus the hand account's rent."
      - `signing-in`: "Sign the message in your wallet (popup 3). It proves to the Private ER that the sealed hand is yours; no transaction, no fee."
      - `dealing`: "Seating the bots, moving the table to the Private ER and dealing with VRF. About 30 seconds."
      - `claim`: "Paying the pot to the winning seat on Solana…"
      - `sweeping`: "Sweeping the house and bot keys back to your wallet…"
      - `error`: title "The round stopped"; the message (`role="alert"`); primary "Try again" → `retry()`; secondary "Express mode (no wallet)".
      During `trading`, `bell`, and `settled` the desk's own panel shows (pass no `panel`), so the trade controls, the lot buttons 1–5 and the hint "Your hand is worth +N contracts" come from `Desk`.

- [ ] **Step 8: `web/src/app/wallet/WalletApp.tsx`** — renders a wallet strip above the desk, then `<Desk r={round} tape={<Tape r={round} />} panel={panelOrUndefined} chip={chip} />`, then the record portal into `#record-root` exactly as `LiveApp` does (`createPortal(<Record table={round.table} />, record)` after `replaceChildren()` once). The strip shows: the wallet name and the shortened address (first 4 + "…" + last 4), the balance in SOL (2 decimals), **"Popups signed: N"**, the round clock when trading, and a "Disconnect" text button. While the UI is `trading`, the strip also shows the note: "Each trade is one wallet popup, lots of 1 to 5. Your wallet previews it against Solana, where the table is locked to the Rollup, so it may warn that the transaction could fail. That warning is expected: the app sends the trade to the Private ER, where it runs." On `settled`: "Swept {swept} SOL back to your wallet." and a primary "Play another round" (back to `ready`). `chip` = `"Wallet · " + (roundId ? "Round " + roundId + " · Private ER" : "devnet")`.

- [ ] **Step 9: `web/src/app/Desk.tsx`** — two optional props, nothing else changes (Express passes neither):
      ```tsx
      export function Desk({ r, tape, panel, chip }: { r: RoundApi; tape: ReactNode; panel?: ReactNode; chip?: string }) {
      ```
      Inside, replace the `chip` constant with `const chipText = chip ?? (r.roundParam === null ? "No round selected" : \`Round ${r.roundParam} · ${r.mode === "tee" ? "Private ER" : "Commit-reveal"}\`);` and render `{chipText}`; replace `<Panel r={r} />` with `{panel ?? <Panel r={r} />}`.

- [ ] **Step 10: `web/src/app/App.tsx`** — route by `playMode(window.location.search)`:
      ```tsx
      const WalletApp = lazy(() => import("./wallet/WalletApp").then((m) => ({ default: m.WalletApp })));
      const walletIdle = (
        <Desk
          r={IDLE}
          tape={<Tape r={IDLE} />}
          chip="Wallet · devnet"
          panel={
            <>
              <p className="desk-panel__title">Play with your wallet</p>
              <p className="desk-panel__text">Loading the wallet desk…</p>
              <button type="button" className="btn btn--primary" disabled>Connect a wallet</button>
            </>
          }
        />
      );
      export function App() {
        useCopyButtons();
        const search = window.location.search;
        if (playMode(search) === "wallet") {
          return (
            <Suspense fallback={walletIdle}>
              <WalletApp />
            </Suspense>
          );
        }
        const named = new URLSearchParams(search).get("round") !== null;
        if (!named) return idle;
        return (
          <Suspense fallback={idle}>
            <LiveApp />
          </Suspense>
        );
      }
      ```
      (`idle`, `IDLE`, `LiveApp` and `useCopyButtons` stay as they are; add `import { playMode } from "./wallet/route";`.)

- [ ] **Step 11: `web/app/index.html`** — add `<meta name="hh-play-modes" content="wallet express">` in `<head>` (the deploy marker `gates:28`/`gates:30` check), and update the meta/og descriptions to: "Play the Hidden Hand trading pit on Solana devnet with your own wallet: one seat, three bots, sealed hands on the MagicBlock Private ER, one wallet popup per trade. Express mode keeps the no-wallet demo." Keep every other line, including the plan comments and the `#record-root` markup.

- [ ] **Step 12: Arm the taste gate for this page (new build)**
      Run: `pnpm --filter @hidden-hand/web build; if ($?) { Push-Location web; node "$HOME/.claude/skills/design-taste-frontend/scripts/gate.mjs" --start dist/app/index.html --root dist --kind software --category "on-chain trading game" --primary "Connect a wallet" --rounds 6 --new; Pop-Location }`
      Then follow the skill's run (`SKILL.md` §4) after `pnpm --filter @hidden-hand/web build`: `copy-lint.mjs`, `consistency.mjs`, `assets/layout/check.mjs`, `shoot.mjs` (1440, 1024, 820x1180, 768x1024, 390), `perf.mjs` against `dist/app/index.html` with `--root dist`, one at a time in the foreground; fix every FAIL; read every screenshot against the skill's §5 checklist. Headless Chrome has no wallet, so the gate sees the `connect` panel; it must render the primary button "Connect a wallet", one column with full-width 44 px buttons at 390. A FAIL you judge false is waived in `web/.taste-skill/waivers.json` with its reason, never gamed. Also build `/app/?mode=express` in a browser check: it must still show "Start a round" and the "Copy the demo command" button.

- [ ] **Step 13: Run to confirm it passes (THE GATE)**
      Run: `pnpm --filter @hidden-hand/web verify; if ($?) { pnpm --filter @hidden-hand/web build }; if ($?) { Push-Location web; node "$HOME/.claude/skills/design-taste-frontend/scripts/gate.mjs" dist/app/index.html --root dist; Pop-Location }`
      Expected: PASS: vitest passes every test file (`states`, `pitTimeline`, `walletStates`), the build writes `web/dist/app/index.html`, and the gate's last line is `GATE: PASS`.

- [ ] **Step 14: Commit (kernel-performed — no agent runs this)**
      Message: `feat(web): wallet mode at /app/ with Express mode kept`

---

### Task 27: Honest copy for wallet mode: README, landing page, submission draft

**Files:**
- Modify: `README.md`
- Modify: `web/index.html`
- Modify: `web/src/landing/main.tsx`
- Modify: `docs/gates/submission-draft.md`

**Depends on:** Task 26, Task 25, Task 10
**Effort:** medium
**Provides:** `README.md, web/index.html and docs/gates/submission-draft.md describe wallet mode (real wallet, one popup per trade, sealed hands on the Private ER, bots in the other seats) and Express mode honestly`
**Requires:** `/app/ (no params) — wallet mode: connect a Wallet Standard wallet, precheck, fund, join, sign in, trade with one popup per trade; /app/?round=<id> and /app/?mode=express — Express mode, unchanged`, `docs/proof/wallet-round.md (a full devnet wallet-mode round: wallet popups, wallet ER trades, the delayed-signature measurement, measured spend)`

**Before editing `web/index.html` or `web/src/landing/main.tsx`, read `~/.claude/skills/design-taste-frontend/SKILL.md` in full** and `references/copy.md` + `copy-voice.md`; copy edits only, no layout or visual change; the skill is never copied into the repo.

Wording that must appear (adapt the sentences around it, keep these facts):
- README `## What it does`: replace the sentence "Trades on the Ephemeral Rollup are zero-fee and need no wallet prompt per trade." with: "Trades on the Ephemeral Rollup are zero-fee. **Wallet mode** (the default at `/app/`) seats you with your own devnet wallet (Phantom, Solflare or Backpack): one wallet popup per trade, three bots in the other seats, and an in-tab house that opens, deals, settles and sweeps its leftover SOL back to you. **Express mode** (`/app/?mode=express`, or the link `demo-round` prints) is the no-wallet demo with a burner seat key and no prompt per trade; it is what the demo video shows."
- README `## Quickstart`: add, after the existing runner block, the line "Or open `/app/` with a devnet wallet and press **Open a table**: one round needs about 0.11 devnet SOL, and the leftover comes back to the wallet at the end."
- README `## How it works`: add a `### Wallet mode` subsection (5–8 lines): the popup order (fund, seat, sign-in message for the Private ER token, one per trade), that the house and bot keys live only in the tab (sessionStorage) and are swept back, that the wallet's preview warning on Rollup transactions is expected and why, that a random or idle human breaks the reveal (the hint keeps the close within 4), and a link to `docs/proof/wallet-round.md`.
- Keep every existing `#`/`##` heading, the schema stamp on line 1, the phrases "linear information market" and "random or idle human breaks the reveal".
- `web/index.html`: the hero's supporting line and the primary CTA's surrounding copy say the pit is played with your own devnet wallet, with Express mode as the no-wallet option. The CTA label "Open the pit" and its `/app/` target stay.
- `docs/gates/submission-draft.md`: in Step 2's description field add two sentences: "Play it at hiddenhand.suitz.xyz/app/ with your own devnet wallet: one popup per trade, sealed hands on the MagicBlock Private ER, three bots in the other seats. Express mode (no wallet) is the one-click demo shown in the video." Change nothing else.

- [ ] **Step 1: Edit README.md, web/index.html, web/src/landing/main.tsx (only if it holds hero copy) and docs/gates/submission-draft.md as above.**
- [ ] **Step 2: Arm the taste gate for the landing (new build)**
      Run: `pnpm --filter @hidden-hand/web build; if ($?) { Push-Location web; node "$HOME/.claude/skills/design-taste-frontend/scripts/gate.mjs" --start dist/index.html --root dist --kind software --category "on-chain trading game" --primary "Open the pit" --rounds 6 --new; Pop-Location }`
      Then run `copy-lint.mjs` and `shoot.mjs` against `dist/index.html` with `--root dist`, fix every FAIL, and read the screenshots against the §5 checklist (copy changed only, so layout must be unchanged).
- [ ] **Step 3: Run to confirm it passes (THE GATE)**
      Run: `$want = @('# Hidden Hand','## Demo','## What it does','## Quickstart','## Built at Solana Blitz v10 (Entertainment Finance)','## How it works','## Tech stack','## Run locally','## Contract addresses','## Roadmap','## License'); $stamp = '<!-- readme-schema: R1-web-app v1 -->'; $lines = Get-Content README.md -Encoding UTF8; $inFence = $false; $got = foreach ($l in $lines) { if ($l -match '^```') { $inFence = -not $inFence } elseif (-not $inFence -and $l -cmatch '^#{1,2} ') { $l } }; $ok = ($got.Count -eq $want.Count); if ($ok) { for ($i = 0; $i -lt $want.Count; $i++) { if ($got[$i] -cne $want[$i]) { $ok = $false } } }; $words = (Select-String -Path README.md -SimpleMatch 'linear information market' -Quiet) -and (Select-String -Path README.md -SimpleMatch 'random or idle human breaks the reveal' -Quiet) -and (Select-String -Path README.md -SimpleMatch 'Express mode' -Quiet) -and (Select-String -Path README.md -SimpleMatch 'one wallet popup per trade' -Quiet) -and (Select-String -Path README.md -SimpleMatch '### Wallet mode' -Quiet) -and -not (Select-String -Path README.md -SimpleMatch 'need no wallet prompt per trade' -Quiet) -and (Select-String -Path docs/gates/submission-draft.md -SimpleMatch 'one popup per trade' -Quiet); if ($ok -and $words -and ($lines[0] -ceq $stamp)) { Push-Location web; node "$HOME/.claude/skills/design-taste-frontend/scripts/gate.mjs" dist/index.html --root dist; Pop-Location } else { 'FAIL' }`
      Expected: PASS: the last line is `GATE: PASS` (a README or draft wording miss prints `FAIL`).
- [ ] **Step 4: Commit (kernel-performed — no agent runs this)**
      Message: `docs: wallet mode and Express mode, honestly`

---

### Task 28: Vercel preview of the wallet-mode build (HUMAN GATE — deploy)

**Files:**
- Modify: `docs/gates/2026-11-26-gate-ledger.md`

**Depends on:** Task 26, Task 27, Task 25
**Effort:** low
**Model tier:** top
**Provides:** `WALLET-PREVIEW: <https://…vercel.app> (a Vercel preview of branch wallet-mode; production untouched)`
**Requires:** `/app/ (no params) — wallet mode: connect a Wallet Standard wallet, precheck, fund, join, sign in, trade with one popup per trade; /app/?round=<id> and /app/?mode=express — Express mode, unchanged`, `README.md, web/index.html and docs/gates/submission-draft.md describe wallet mode (real wallet, one popup per trade, sealed hands on the Private ER, bots in the other seats) and Express mode honestly`

Run by the gate-concierge on the user's consent. **Preview only: never `--prod`, never `vercel domains`, never touch hiddenhand.suitz.xyz.** Same Vercel project and CLI login as the production deploy recorded in the ledger (`vercel@67.0.0` via npx, project `hidden-hand`, team `heisbei-s-projects`).

- [ ] **Step 1: Build on the branch**
      Run: `git rev-parse --abbrev-ref HEAD; pnpm --filter @hidden-hand/web build`
      Expected: `wallet-mode`, then `web/dist/app/index.html` exists.
- [ ] **Step 2: Link if the build wiped it** — if `web/dist/.vercel/project.json` is missing (Vite empties `dist/`), run from `web/dist`: `npx --yes vercel@67.0.0 link --yes --project hidden-hand --scope heisbei-s-projects`, then `npx --yes vercel@67.0.0 git disconnect --yes`, then delete `web/dist/.env.local` and `web/dist/.gitignore` if the CLI wrote them (never print the token).
- [ ] **Step 3: Preview deploy**
      Run (from `web/dist`): `npx --yes vercel@67.0.0 deploy --yes`
      Expected: a `https://hidden-hand-…-heisbei-s-projects.vercel.app` URL. Append the line `WALLET-PREVIEW: <url>` (with the time, UTC) to `docs/gates/2026-11-26-gate-ledger.md`, and give the URL to the user for Task 29.
- [ ] **Step 4: Run to confirm it passes (THE GATE)**
      Run: `$u = (Select-String -Path docs/gates/2026-11-26-gate-ledger.md -Pattern 'WALLET-PREVIEW: (https://\S+\.vercel\.app)' | Select-Object -Last 1).Matches[0].Groups[1].Value; $code = curl.exe -s -o NUL -w "%{http_code}" "$u/app/"; if ($u -and ($code -eq '200' -or $code -eq '401')) { 'PREVIEW: PASS' } else { "PREVIEW: FAIL ($code)" }`
      Expected: PASS: `PREVIEW: PASS` (401 = Vercel's preview protection; the user opens it logged in).
- [ ] **Step 5: Commit (kernel-performed — no agent runs this)**
      Message: `chore(gates): wallet-mode Vercel preview`

---

### Task 29: The user's manual Phantom test on the preview (HUMAN GATE — real wallet)

**Files:**
- Modify: `docs/gates/wallet-manual-test.md`

**Depends on:** Task 28
**Effort:** low
**Model tier:** top
**Provides:** `MANUAL-TEST: PASS|FAIL recorded in docs/gates/wallet-manual-test.md (the GO/NO-GO input, 11:30Z)`
**Requires:** `WALLET-PREVIEW: <https://…vercel.app> (a Vercel preview of branch wallet-mode; production untouched)`

The user runs `docs/gates/wallet-manual-test.md` by hand with Phantom on devnet against the preview URL; nobody else signs. The concierge only records what the user reports. **GO/NO-GO at 11:30Z:** without `MANUAL-TEST: PASS` by then, wallet mode is dropped, Task 30 does not run, and `main` ships as is.

- [ ] **Step 1: The user runs the checklist** and reports each line; the concierge ticks them in `docs/gates/wallet-manual-test.md` and fills the result block (time, table address, popups, any wallet warning text).
- [ ] **Step 2: Run to confirm it passes (THE GATE)**
      Run: `if (Select-String -Path docs/gates/wallet-manual-test.md -Pattern '^MANUAL-TEST: PASS' -Quiet) { 'MANUAL-TEST: PASS' } else { 'MANUAL-TEST: FAIL' }`
      Expected: PASS: `MANUAL-TEST: PASS`.
- [ ] **Step 3: Commit (kernel-performed — no agent runs this)**
      Message: `chore(gates): manual Phantom test of wallet mode`

---

### Task 30: Merge wallet-mode into main and deploy production (HUMAN GATE — the user's explicit GO only)

**Files:**
- Modify: `docs/gates/2026-11-26-gate-ledger.md`

**Depends on:** Task 29
**Effort:** low
**Model tier:** top
**Provides:** `main contains wallet-mode; hiddenhand.suitz.xyz/app/ serves wallet mode (meta hh-play-modes)`
**Requires:** `MANUAL-TEST: PASS|FAIL recorded in docs/gates/wallet-manual-test.md (the GO/NO-GO input, 11:30Z)`

Runs only after `MANUAL-TEST: PASS` **and** the user's explicit "GO, merge and deploy" in this session. Approval of Task 28 or 29 is not approval of this task.

- [ ] **Step 1: Merge** — `git checkout main; git pull --ff-only; git merge --no-ff wallet-mode -m "Merge wallet mode"; git push origin main` (resolve nothing by guessing: a conflict stops the task and goes to the user).
- [ ] **Step 2: Build and deploy production from main** — `pnpm --filter @hidden-hand/web build`; re-link in `web/dist` as in Task 28 Step 2 if needed; from `web/dist`: `npx --yes vercel@67.0.0 deploy --prod --yes`. The domain is already attached; never run `vercel domains`.
- [ ] **Step 3: Ledger** — append `WALLET-PROD: <deployment url> <time UTC>`; the user then resumes `gates:19` (Submission) with the updated draft.
- [ ] **Step 4: Run to confirm it passes (THE GATE)**
      Run: `git fetch -q; git merge-base --is-ancestor wallet-mode origin/main; $merged = ($LASTEXITCODE -eq 0); $html = curl.exe -s https://hiddenhand.suitz.xyz/app/; if ($merged -and ($html -match 'name="hh-play-modes"')) { 'PROD: PASS' } else { 'PROD: FAIL' }`
      Expected: PASS: `PROD: PASS`.
- [ ] **Step 5: Commit (kernel-performed — no agent runs this)**
      Message: `chore(gates): wallet mode merged and live`
