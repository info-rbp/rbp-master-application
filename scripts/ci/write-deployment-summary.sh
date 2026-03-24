#!/usr/bin/env bash
set -euo pipefail

TARGET_ENV="${1:-unknown}"
STATUS="${2:-unknown}"
DEPLOY_REF="${3:-n/a}"
ARTIFACT_DIR="${4:-artifacts}"
mkdir -p "${ARTIFACT_DIR}"

SUMMARY_FILE="${ARTIFACT_DIR}/deployment-summary-${TARGET_ENV}.md"
{
  echo "# Deployment Summary"
  echo
  echo "- Environment: ${TARGET_ENV}"
  echo "- Status: ${STATUS}"
  echo "- Ref: ${DEPLOY_REF}"
  echo "- Timestamp (UTC): $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
  echo
  echo "## Rollback"
  echo "- Follow docs/deployment/rollback-model.md"
  echo "- Use rbp-deploy/runbooks/rollback.md for operator procedure"
} > "${SUMMARY_FILE}"

if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  cat "${SUMMARY_FILE}" >> "${GITHUB_STEP_SUMMARY}"
fi

echo "Summary written to ${SUMMARY_FILE}"
