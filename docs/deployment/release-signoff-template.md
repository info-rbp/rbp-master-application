# Release Sign-off Template

Use this template for staging and production promotions.

## Release metadata

- Environment: `<staging|production>`
- Release ref (tag/sha): `<ref>`
- Change ticket: `<ticket>`
- Deployment run URL: `<actions-run-url>`
- Deployment window (UTC): `<start/end>`

## Automated verification summary

- Smoke command: `APP_BASE_URL=<url> SMOKE_ENV=<env> ./scripts/ci/smoke-test.sh`
- Result: `<pass|fail|pass-with-skips>`
- Skipped checks (if any): `<list>`
- Runtime health endpoint status: `<ok|degraded>`

## Manual verification summary

- Homepage and primary UX: `<pass/fail + notes>`
- Auth login/callback/logout behavior: `<pass/fail + notes>`
- Admin/control-plane verification: `<pass/fail + notes>`
- Firestore/runtime observability verification: `<pass/fail + notes>`
- Alerts/logging verification: `<pass/fail + notes>`

## Risk assessment

- Known issues accepted for this release: `<list>`
- Rollback trigger thresholds: `<list>`

## Approval

- Service owner: `<name/date>`
- Platform/SRE: `<name/date>`
- Security/compliance (if required): `<name/date>`

## Decision

- [ ] Approved for promotion
- [ ] Hold / remediation required
- [ ] Rollback initiated
