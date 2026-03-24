# Auth Callback Issue Runbook

## Purpose
Restore login/callback flow when users cannot complete authentication.

## Symptoms / Trigger Conditions
- Login loops or callback errors.
- Staging/prod smoke callback check fails.

## Prerequisites
- Access to IdP config and app env config.

## Required Access / Roles
- Platform engineer
- Identity provider admin

## Exact Steps
1. Reproduce with `/api/auth/login` then callback flow.
2. Confirm callback URL configured in IdP matches env domain exactly.
3. Validate env config values for issuer/callback/logout redirect.
4. Check cookies/session settings for domain/secure attributes.
5. Check server logs for state/nonce or session persistence failures.
6. If misconfiguration identified, fix config and redeploy.
7. Re-run smoke tests and manual browser auth checks.

## Verification Steps
- Login completes to expected route.
- Callback endpoint returns expected redirect/response.
- Authenticated APIs are accessible for operator accounts.

## Rollback / Escalation Path
- Roll back to previous working auth config if unresolved.
- Escalate to IdP owner/security if potential auth attack signal.

## Related Systems
- Auth provider (Authentik/local auth)
- Session persistence
- Admin UI

## Related Secrets / Config
- IdP client secret
- callback/issuer URLs in env config

## Who to Notify
- Identity owner
- Platform on-call
- Security team (if suspicious traffic)

## Links to Adjacent Runbooks / Docs
- `runbooks/bad-config-rollback.md`
- `runbooks/rollback.md`
- `docs/deployment/smoke-test-checklist.md`
