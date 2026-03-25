# Incident Entry Points

This document maps common deployment/runtime incidents to first runbooks.

## Incident -> First runbook

- Deployment pipeline failed -> `runbooks/failed-deployment.md`
- Need immediate service restore -> `runbooks/rollback.md`
- Suspected config regression -> `runbooks/bad-config-rollback.md`
- Firestore permission/connectivity errors -> `runbooks/firestore-access-issue.md`
- Login/callback/session issues -> `runbooks/auth-callback-issue.md`
- Feature-control admin/evaluation failures -> `runbooks/feature-control-migration-issue.md`
- Unsafe production conditions -> `runbooks/emergency-production-freeze.md`
- New environment setup -> `runbooks/first-environment-bootstrap.md`
- Environment promotion support -> `runbooks/environment-promotion.md`
- Secret setup/rotation issue -> `runbooks/secret-setup.md`

## Triage priority

1. Protect users/data (freeze/rollback if needed).
2. Restore critical path availability.
3. Capture evidence from workflows/logs/artifacts.
4. Communicate status and next checkpoint.
