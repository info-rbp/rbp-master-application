#!/usr/bin/env bash
set -euo pipefail

TARGET_ENV="${1:-}"
if [[ -z "$TARGET_ENV" ]]; then
  echo "Usage: $0 <dev|staging|prod>"
  exit 2
fi

ENV_DIR="rbp-deploy/envs/${TARGET_ENV}"
REQUIRED_FILES=(
  "${ENV_DIR}/config-contract.yaml"
  "${ENV_DIR}/service-endpoints.yaml"
  "${ENV_DIR}/secret-reference-map.yaml"
  "${ENV_DIR}/domain-mapping.yaml"
  "rbp-deploy/shared/policies/config-contract.yaml"
  "rbp-deploy/shared/secrets/secrets-catalog.md"
  "firebase.json"
)

missing=0
for file in "${REQUIRED_FILES[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "[ERROR] Missing required config file: $file"
    missing=1
  fi
done
if [[ "$missing" -ne 0 ]]; then
  exit 1
fi

if ! grep -q "apphosting" firebase.json; then
  echo "[ERROR] firebase.json does not include an apphosting block."
  exit 1
fi

if ! grep -q "${TARGET_ENV}" "${ENV_DIR}/overview.md"; then
  echo "[WARN] ${ENV_DIR}/overview.md does not explicitly mention ${TARGET_ENV}."
fi

if ! grep -q "variables:" "${ENV_DIR}/config-contract.yaml"; then
  echo "[ERROR] ${ENV_DIR}/config-contract.yaml missing variables declaration."
  exit 1
fi

if ! grep -q "SESSION_SECRET" "${ENV_DIR}/secret-reference-map.yaml"; then
  echo "[ERROR] ${ENV_DIR}/secret-reference-map.yaml missing SESSION_SECRET reference."
  exit 1
fi

if ! grep -q "AUTHENTIK_CLIENT_SECRET" "${ENV_DIR}/secret-reference-map.yaml"; then
  echo "[ERROR] ${ENV_DIR}/secret-reference-map.yaml missing AUTHENTIK_CLIENT_SECRET reference."
  exit 1
fi

if [[ "$TARGET_ENV" != "dev" ]]; then
  if [[ -z "${FIREBASE_PROJECT_ID:-}" ]]; then
    echo "[ERROR] FIREBASE_PROJECT_ID is required for ${TARGET_ENV} validation/deploy."
    exit 1
  fi
fi

echo "[OK] Environment config checks passed for ${TARGET_ENV}."
