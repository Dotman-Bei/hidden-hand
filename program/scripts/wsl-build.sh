#!/usr/bin/env bash
# Hidden Hand program gate. Run from PowerShell at the repo root:
#   wsl -d Ubuntu-24.04 -u root --exec bash -l program/scripts/wsl-build.sh [build|sync-id]
# Copies program/ to the WSL filesystem, builds there (never under /mnt/c), copies the IDL back.
set -euo pipefail
if [ -f "/root/.toolchain_env" ]; then . "/root/.toolchain_env"; fi

MODE="${1:-build}"
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="$(cd "${SRC}/.." && pwd)"
WORK="/root/hidden-hand/program"
KEYDIR="/root/.config/hidden-hand"
KEY="${KEYDIR}/program-keypair.json"

fail() { echo "HH-GATE: FAIL ($1)"; exit 1; }
case "${WORK}" in /mnt/*) fail "work dir is under /mnt";; esac
command -v rsync >/dev/null 2>&1 || fail "rsync missing: apt-get install -y rsync"
command -v anchor >/dev/null 2>&1 || fail "anchor missing from PATH"
command -v solana-keygen >/dev/null 2>&1 || fail "solana-keygen missing from PATH"
command -v node >/dev/null 2>&1 || fail "node missing from PATH"
command -v npm >/dev/null 2>&1 || fail "npm missing from PATH"

mkdir -p "${WORK}" "${KEYDIR}"
if [ ! -f "${KEY}" ]; then
  solana-keygen new --no-bip39-passphrase --silent --outfile "${KEY}" >/dev/null
  chmod 600 "${KEY}"
fi
PROGRAM_ID="$(solana-keygen pubkey "${KEY}")"

if [ "${MODE}" = "sync-id" ]; then
  sed -i -E "s/declare_id!\(\"[1-9A-HJ-NP-Za-km-z]{32,44}\"\)/declare_id!(\"${PROGRAM_ID}\")/" "${SRC}/programs/hidden-hand/src/lib.rs"
  sed -i -E "s/^hidden_hand = \"[1-9A-HJ-NP-Za-km-z]{32,44}\"/hidden_hand = \"${PROGRAM_ID}\"/" "${SRC}/Anchor.toml"
  echo "HH-PROGRAM-ID: ${PROGRAM_ID}"
fi

rsync -a --delete --exclude "target/" --exclude ".anchor/" --exclude "cu/node_modules/" "${SRC}/" "${WORK}/"
mkdir -p "${WORK}/target/deploy"
cp "${KEY}" "${WORK}/target/deploy/hidden_hand-keypair.json"
chmod 600 "${WORK}/target/deploy/hidden_hand-keypair.json"
cd "${WORK}"

grep -q "declare_id!(\"${PROGRAM_ID}\")" "programs/hidden-hand/src/lib.rs" \
  || fail "declare_id! is not ${PROGRAM_ID}; run: wsl -d Ubuntu-24.04 -u root --exec bash -l program/scripts/wsl-build.sh sync-id"

cargo test -p hidden-hand-engine --quiet || fail "engine tests"
# The SBF stack warning is printed at link time, so a cached no-op build would hide it:
# touch the program crate so every gate run recompiles and relinks it.
touch "programs/hidden-hand/src/lib.rs"
BUILD_LOG="${WORK}/target/hh-build.log"
anchor build 2>&1 | tee "${BUILD_LOG}" || fail "anchor build"
if grep -qiE "Stack offset|exceeded max offset|may cause undefined behavior" "${BUILD_LOG}"; then
  fail "SBF stack warning in anchor build output; see ${BUILD_LOG}"
fi
grep -q "declare_id!(\"${PROGRAM_ID}\")" "programs/hidden-hand/src/lib.rs" || fail "anchor build rewrote declare_id!"

# Compute-unit gate: LiteSVM runs the instructions at the default limit, prints HH-CU lines.
# node_modules lives only in the WSL work dir and is reinstalled only when the lockfile changes.
if ! cmp -s "${WORK}/cu/package-lock.json" "${WORK}/cu/node_modules/.hh-installed-lock"; then
  npm ci --silent --no-audit --no-fund --prefix "${WORK}/cu" || fail "npm ci in program/cu"
  cp "${WORK}/cu/package-lock.json" "${WORK}/cu/node_modules/.hh-installed-lock"
fi
node "${WORK}/cu/cu-check.mjs" "${WORK}/target/deploy/hidden_hand.so" "${WORK}/target/idl/hidden_hand.json" \
  || fail "compute-unit check"

mkdir -p "${REPO}/client/src/idl"
cp "target/idl/hidden_hand.json" "${REPO}/client/src/idl/hidden_hand.json"
cp "target/types/hidden_hand.ts" "${REPO}/client/src/idl/hidden_hand.ts"
cp "Cargo.lock" "${SRC}/Cargo.lock"
echo "HH-PROGRAM-ID: ${PROGRAM_ID}"
echo "HH-GATE: PASS"
