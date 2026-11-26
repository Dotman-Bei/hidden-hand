import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Keypair } from "@solana/web3.js";
import { keypairFromJson, parseDotEnv } from "./keys";

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export function readEnvVar(name: string): string | null {
  const direct = process.env[name];
  if (direct && direct.trim().length > 0) return direct.trim();
  const file = resolve(REPO_ROOT, ".env");
  if (!existsSync(file)) return null;
  return parseDotEnv(readFileSync(file, "utf8"), name);
}

/** The devnet burner, from the user env var or the git-ignored repo-root .env. Never from the repo. */
export function loadBurner(): Keypair {
  const value = readEnvVar("HH_BURNER_KEYPAIR_JSON");
  if (!value) throw new Error("HH_BURNER_KEYPAIR_JSON is not set (user env var or the git-ignored repo-root .env)");
  return keypairFromJson(value);
}

export * from "./index";
