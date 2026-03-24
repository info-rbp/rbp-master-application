# Rollback Runbook

## Purpose
Safely return an environment to the last known good release.

## Symptoms / Trigger Conditions
- Post-deploy smoke checks fail.
- Critical customer/admin paths broken.
- Runtime health remains degraded after triage.

## Prerequisites
- Known good release tag/SHA.
- Approval for rollback (prod requires incident commander approval).

## Required Access / Roles
- Platform/SRE on-call
- Service owner
- Incident commander (production)

## Exact Steps
1. Freeze forward deployments/promotions.
2. Identify last known good release ref from Actions history.
3. Trigger target environment deploy workflow using rollback ref.
4. For production, include incident/change ticket and wait for environment approval.
5. After rollback deploy completes, run smoke tests manually:
   ```bash
   APP_BASE_URL=<url> SMOKE_ENV=<env> ./scripts/ci/smoke-test.sh
   ```
6. Verify runtime endpoint and business-critical paths.
7. Record rollback details in incident log/sign-off template.

## Verification Steps
- Smoke suite returns no failures.
- `/api/health` and `/api/health/runtime` healthy (or accepted known warnings).
- Error rates return to baseline.

## Rollback / Escalation Path
- If rollback fails, trigger `runbooks/emergency-production-freeze.md`.
- Escalate to platform lead + security for potential data/auth impact.

## Related Systems
- GitHub Actions deploy workflows
- Firebase App Hosting
- Monitoring/alerting

## Related Secrets / Config
- GitHub env secrets
- deployment references (tag/SHA)

## Who to Notify
- Incident channel
- Platform lead
- Product owner (if customer-facing impact)

## Links to Adjacent Runbooks / Docs
- `runbooks/failed-deployment.md`
- `runbooks/bad-config-rollback.md`
- `docs/deployment/rollback-checklist.md`
