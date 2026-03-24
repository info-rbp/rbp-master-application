# Deployment Checklist

Use this checklist for each environment deployment.

## Pre-deploy
- [ ] Change/ref selected and reviewed.
- [ ] Relevant runbook identified.
- [ ] Required approvals obtained.
- [ ] Environment config validated: `./scripts/ci/validate-env-config.sh <env>`.
- [ ] Secrets present in GitHub Environment.

## Deploy
- [ ] Trigger correct workflow (`deploy-dev`, `promote-staging`, `deploy-prod`).
- [ ] Confirm validation stages pass (lint/typecheck/tests/build).
- [ ] Confirm deploy stage succeeds.

## Post-deploy
- [ ] Smoke tests pass.
- [ ] `/api/health` returns OK.
- [ ] `/api/health/runtime` reviewed.
- [ ] Manual checks completed (auth/admin/observability).
- [ ] Release sign-off template completed.

## If anything fails
- [ ] Follow `runbooks/failed-deployment.md`.
- [ ] If high risk, apply `runbooks/emergency-production-freeze.md`.
