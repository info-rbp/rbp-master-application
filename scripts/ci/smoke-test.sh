#!/usr/bin/env bash
set -euo pipefail

TARGET_ENV="${1:-${SMOKE_ENV:-dev}}"

node ./scripts/ci/smoke-test.mjs "$TARGET_ENV"
