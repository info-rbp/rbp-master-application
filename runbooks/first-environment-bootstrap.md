# First Environment Bootstrap Runbook

## Purpose
Bootstrap a new deployment environment (dev/staging/prod-like) for `rbp-master-application` in a repeatable way.

## Symptoms / Trigger Conditions
- New environment requested.
- Existing environment requires rebuild from scratch.

## Prerequisites
- Access to repository and GitHub Actions.
- Target Firebase/GCP project provisioned.
- DNS zones for target environment available.

## Required Access / Roles
- Platform engineer (owner)
- Cloud project admin (temporary for bootstrap)
- GitHub repo admin (environment secrets + protection)

## Exact Steps
1. Create environment branch/config set using `rbp-deploy/envs/<env>/` as baseline.
2. Duplicate and update:
   - `config-contract.yaml`
   - `domain-mapping.yaml`
   - `service-endpoints.yaml`
   - `secret-reference-map.yaml`
3. Configure GitHub Environment `<env>` with required secrets:
   - `FIREBASE_PROJECT_ID`, `FIREBASE_TOKEN`, `APP_BASE_URL`
   - optional: `SMOKE_AUTH_COOKIE`/`SMOKE_AUTH_HEADER`.
4. For production-like envs, enable required reviewers in GitHub Environment protection.
5. Run config validation locally:
   ```bash
   ./scripts/ci/validate-env-config.sh <env>
   ```
6. Trigger deployment workflow for environment.
7. Run post-deploy smoke checks:
   ```bash
   APP_BASE_URL=<url> SMOKE_ENV=<env> ./scripts/ci/smoke-test.sh
   ```
8. Complete release sign-off template.

## Verification Steps
- Workflow run is green.
- `/api/health` returns `200`.
- `/api/health/runtime` returns `ok` or triaged `degraded`.
- Smoke summary has zero failures.

## Rollback / Escalation Path
- If deployment fails: follow `runbooks/failed-deployment.md`.
- If environment is unstable: follow `runbooks/rollback.md`.
- Escalate to platform lead + SRE on-call.

## Related Systems
- GitHub Actions workflows
- Firebase App Hosting
- Authentik / auth provider
- Firestore

## Related Secrets / Config
- `rbp-deploy/envs/<env>/*`
- GitHub Environment secrets

## Who to Notify
- Platform lead
- Service owner
- SRE/on-call

## Links to Adjacent Runbooks / Docs
- `runbooks/secret-setup.md`
- `runbooks/environment-promotion.md`
- `docs/deployment/operator-map.md`
