#!/usr/bin/env bash
set -euo pipefail

TARGET_ENV="${1:-}"
if [[ -z "$TARGET_ENV" ]]; then
  echo "Usage: $0 <dev|staging|prod>"
  exit 2
fi

: "${APP_BASE_URL:?APP_BASE_URL is required for smoke testing}"

SMOKE_PATHS="${SMOKE_PATHS:-/ /api/health}"
FAILED=0
for path in $SMOKE_PATHS; do
  url="${APP_BASE_URL%/}${path}"
  echo "Smoke checking: ${url}"
  if ! curl -fsS --max-time 20 "$url" >/dev/null; then
    echo "[ERROR] Smoke check failed for ${url}"
    FAILED=1
  fi
done

if [[ "$FAILED" -ne 0 ]]; then
  exit 1
fi

echo "[OK] Smoke checks passed for ${TARGET_ENV}."
