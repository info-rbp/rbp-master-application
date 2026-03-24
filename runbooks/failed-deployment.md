# Failed Deployment Runbook

## Purpose
Restore service quickly when a deployment workflow fails.

## Symptoms / Trigger Conditions
- `deploy-dev`, `promote-staging`, or `deploy-prod` workflow fails.
- Smoke tests fail after deployment.

## Prerequisites
- Access to GitHub Actions logs and artifacts.
- Last known good release reference.

## Required Access / Roles
- On-call platform engineer
- Service owner

## Exact Steps
1. Identify failing stage in workflow logs (validation/config/deploy/smoke).
2. Download deployment artifacts from run (`artifacts/**/*.md`, debug logs).
3. Classify failure:
   - validation error -> fix code/config and redeploy.
   - deployment command failure -> check Firebase credentials/project.
   - smoke failure -> inspect endpoint-level failures.
4. If prod or user-visible outage, freeze further promotions immediately.
5. Run targeted diagnostics:
   - `/api/health`
   - `/api/health/runtime`
6. Decide:
   - safe quick-fix and redeploy, or
   - rollback to last known good.
7. If rollback selected, execute `runbooks/rollback.md`.

## Verification Steps
- Latest deployment is green.
- Smoke tests pass or accepted skips are documented.

## Rollback / Escalation Path
- Roll back on repeated smoke failures or elevated incidents.
- Escalate to SRE + security if auth/data impact exists.

## Related Systems
- GitHub Actions
- Firebase App Hosting
- Firestore

## Related Secrets / Config
- GitHub environment secrets
- `rbp-deploy/envs/<env>/config-contract.yaml`

## Who to Notify
- Platform on-call
- Service owner
- Product incident channel for prod impact

## Links to Adjacent Runbooks / Docs
- `runbooks/rollback.md`
- `runbooks/emergency-production-freeze.md`
- `docs/deployment/incident-entry-points.md`
