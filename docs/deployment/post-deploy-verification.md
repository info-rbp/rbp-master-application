# Post-deploy Verification Guide

This guide defines what must happen immediately after every deployment.

## 1) Run scripted smoke tests

```bash
APP_BASE_URL=<environment-base-url> \
SMOKE_ENV=<dev|staging|prod> \
SMOKE_AUTH_COOKIE='<session-cookie-when-available>' \
./scripts/ci/smoke-test.sh
```

Notes:

- `SMOKE_AUTH_COOKIE` (or `SMOKE_AUTH_HEADER`) enables authorized-path checks.
- Missing integration URLs are reported as `SKIP`, not `PASS`.

## 2) Verify runtime dependency status

- Check `/api/health` for app liveness.
- Check `/api/health/runtime` for Firestore and upstream dependency status.
- Treat `degraded` runtime response as non-signoff until triaged.

## 3) Complete manual verification

Use `smoke-test-checklist.md` for operator checks:

- auth/session browser behavior
- admin/control-plane workflow checks
- observability and alerts checks

## 4) Record sign-off

Fill `release-signoff-template.md` and attach to change ticket/release record.

## 5) Escalate or rollback when needed

If any critical check fails:

1. stop further promotion
2. notify release owner + SRE
3. execute `docs/deployment/rollback-model.md`
4. run `rbp-deploy/runbooks/rollback.md`

## CI integration points

- `deploy-dev.yml` runs smoke checks after deploy.
- `promote-staging.yml` runs smoke checks after deploy.
- `deploy-prod.yml` runs smoke checks and emits rollback instructions.

This keeps post-deploy verification standardized across environments.
