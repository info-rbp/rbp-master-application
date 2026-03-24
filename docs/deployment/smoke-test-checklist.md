# Smoke Test Checklist

Use this checklist after deployment for `dev`, `staging`, and `production`.

## Scripted checks (automated)

Run:

```bash
APP_BASE_URL=<url> SMOKE_ENV=<dev|staging|prod> ./scripts/ci/smoke-test.sh
```

Automated checks include:

1. Homepage load (`/`).
2. Login redirect flow (`/api/auth/login`).
3. Session bootstrap (`/api/session`).
4. Basic app health (`/api/health`).
5. Runtime/Firestore health (`/api/health/runtime`).
6. Unauthorized admin access denial (`/api/admin/feature-flags`).
7. Unauthorized protected API denial (`/api/admin/feature-controls/recent-changes`).
8. Authorized feature-control read path (when `SMOKE_AUTH_COOKIE` or `SMOKE_AUTH_HEADER` is supplied).
9. Authorized protected API success (when auth credentials are supplied).
10. Admin/operator console reachability (when auth credentials are supplied).
11. Upstream integration reachability for configured endpoints (`ODOO_BASE_URL`, `LENDING_BASE_URL`, `MARBLE_BASE_URL`, `N8N_BASE_URL`, `DOCSPELL_BASE_URL`, `METABASE_BASE_URL`).
12. For staging/prod: DNS resolution, HTTPS enforcement, auth callback reachability.

## Manual checks (operator)

### Auth/session behavior

- Confirm login completes in browser and lands on expected post-login route.
- Confirm logout destroys session and protected views redirect to login.
- Confirm callback URL configured in IdP matches environment domain.

### Control plane/admin behavior

- Open `/admin/system/feature-controls` with operator account.
- Verify feature flags list renders and evaluation panel opens.
- Confirm role-restricted actions remain denied for non-operator account.

### Runtime and data plane

- Verify Firestore reads/writes appear in Cloud logs for deployment window.
- Verify no spike in auth/session errors.

### Observability

- Confirm deployment logs exist for app hosting release.
- Confirm alerts pipeline is receiving events (or perform test trigger where permitted).

## Exit criteria

Deployment is eligible for sign-off when:

- scripted smoke tests pass (or only expected skips due to intentionally unconfigured integrations), and
- all mandatory manual checks for target environment are completed.
