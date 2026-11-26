#!/usr/bin/env bash
# HUMAN-GATED. Deploy or upgrade hidden_hand on devnet with the burner as payer and upgrade authority.
#   wsl -d Ubuntu-24.04 -u root --exec bash -l program/scripts/wsl-deploy.sh deploy   # human gate only
#   wsl -d Ubuntu-24.04 -u root --exec bash -l program/scripts/wsl-deploy.sh check    # read-only
set -euo pipefail
if [ -f "/root/.toolchain_env" ]; then . "/root/.toolchain_env"; fi

MODE="${1:-check}"
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="$(cd "${SRC}/.." && pwd)"
WORK="/root/hidden-hand/program"
KEYDIR="/root/.config/hidden-hand"
KEY="${KEYDIR}/program-keypair.json"
BURNER="${KEYDIR}/burner.json"
RPC="https://api.devnet.solana.com"
LOG="${REPO}/docs/proof/deploy-log.md"

fail() { echo "HH-DEPLOY: FAIL ($1)"; exit 1; }
[ -f "${KEY}" ] || fail "program keypair missing; run wsl-build.sh first"
PROGRAM_ID="$(solana-keygen pubkey "${KEY}")"

case "${MODE}" in
  deploy)
    LINE="$(grep -E '^HH_BURNER_KEYPAIR_JSON=' "${REPO}/.env" 2>/dev/null | head -n 1 || true)"
    [ -n "${LINE}" ] || fail "HH_BURNER_KEYPAIR_JSON missing from the git-ignored .env"
    umask 077
    printf '%s' "${LINE#HH_BURNER_KEYPAIR_JSON=}" | tr -d '\r' > "${BURNER}"
    trap 'rm -f "${BURNER}"' EXIT
    bash "${SRC}/scripts/wsl-build.sh" build | tail -n 1 | grep -q "HH-GATE: PASS" || fail "build gate failed"
    cd "${WORK}"
    OUT="$(solana program deploy "target/deploy/hidden_hand.so" --program-id "${KEY}" --keypair "${BURNER}" --upgrade-authority "${BURNER}" --url "${RPC}" --output json)"
    SIG="$(printf '%s' "${OUT}" | tr -d '\n' | sed -E 's/.*"signature": *"([^"]+)".*/\1/')"
    mkdir -p "${REPO}/docs/proof"
    if [ ! -f "${LOG}" ]; then
      printf '# Deploy log\n\n| UTC | program id | deploy signature |\n|---|---|---|\n' > "${LOG}"
    fi
    printf '| %s | %s | %s |\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "${PROGRAM_ID}" "${SIG}" >> "${LOG}"
    echo "HH-DEPLOY: PASS ${PROGRAM_ID}"
    ;;
  check)
    solana program show "${PROGRAM_ID}" --url "${RPC}" >/dev/null 2>&1 || fail "${PROGRAM_ID} is not deployed on devnet"
    echo "HH-DEPLOY: PASS ${PROGRAM_ID}"
    ;;
  *) fail "mode must be deploy or check";;
esac
