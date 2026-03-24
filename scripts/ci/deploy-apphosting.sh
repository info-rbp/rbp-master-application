#!/usr/bin/env bash
set -euo pipefail

TARGET_ENV="${1:-}"
if [[ -z "$TARGET_ENV" ]]; then
  echo "Usage: $0 <dev|staging|prod>"
  exit 2
fi

: "${FIREBASE_PROJECT_ID:?FIREBASE_PROJECT_ID is required}"
: "${FIREBASE_TOKEN:?FIREBASE_TOKEN is required}"

EXTRA_ARGS=()
if [[ "${FIREBASE_DEPLOY_DEBUG:-false}" == "true" ]]; then
  EXTRA_ARGS+=("--debug")
fi

echo "Deploying apphosting to ${TARGET_ENV} (project: ${FIREBASE_PROJECT_ID})"
npx firebase-tools@13.35.1 deploy \
  --project "${FIREBASE_PROJECT_ID}" \
  --only apphosting \
  --non-interactive \
  --token "${FIREBASE_TOKEN}" \
  "${EXTRA_ARGS[@]}"

echo "[OK] Deployment command completed for ${TARGET_ENV}."
