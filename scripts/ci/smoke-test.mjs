#!/usr/bin/env bash
set -euo pipefail

TARGET_ENV="${1:-}"
if [[ -z "${TARGET_ENV}" ]]; then
  echo "Usage: $0 <dev|staging|prod>"
  exit 2
fi

if [[ ! -f "./scripts/ci/smoke-test.mjs" ]]; then
  echo "[ERROR] Missing Node smoke runner: ./scripts/ci/smoke-test.mjs"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js is required to run smoke-test.mjs"
  exit 1
fi

echo "[INFO] Running smoke tests for environment: ${TARGET_ENV}"
node ./scripts/ci/smoke-test.mjs "${TARGET_ENV}"
