// Copies the design kit's assets into the git-ignored public/assets at build time.
// The skill is never committed to this repo.
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(homedir(), ".claude", "skills", "design-taste-frontend", "assets");
const dest = join(here, "..", "public", "assets");
if (!existsSync(src)) {
  console.error(`sync-kit: design kit not found at ${src}`);
  process.exit(1);
}
rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`sync-kit: copied ${src} -> ${dest}`);
