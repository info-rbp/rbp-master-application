# Secret Setup Runbook

## Purpose
Configure and rotate deployment/runtime secrets safely without committing secret values to Git.

## Symptoms / Trigger Conditions
- New environment bootstrap.
- Secret missing/expired/rotated.
- Deployment fails due to authentication.

## Prerequisites
- Secret manager references defined for target env.
- Access to GitHub environment settings.

## Required Access / Roles
- Platform engineer
- Security owner for production secret approvals

## Exact Steps
1. Review expected secret names in:
   - `rbp-deploy/envs/<env>/secret-reference-map.yaml`
   - `rbp-deploy/shared/secrets/secrets-catalog.md`
2. Provision/update secrets in approved secret manager.
3. Update GitHub Environment secrets for deploy workflows:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_TOKEN`
   - `APP_BASE_URL`
   - optional smoke auth secret/header.
4. Validate env contract:
   ```bash
   ./scripts/ci/validate-env-config.sh <env>
   ```
5. Trigger environment deployment and verify smoke tests.

## Verification Steps
- Deployment can authenticate and deploy successfully.
- Smoke tests pass authorized checks when smoke auth secret is provided.

## Rollback / Escalation Path
- Revert to previous secret version if incident starts after rotation.
- Open security incident if unauthorized access is suspected.

## Related Systems
- GitHub Actions environments
- Secret manager
- Firebase

## Related Secrets / Config
- `secret-reference-map.yaml`
- GitHub environment secrets

## Who to Notify
- Security owner
- Platform lead
- On-call responder

## Links to Adjacent Runbooks / Docs
- `runbooks/first-environment-bootstrap.md`
- `runbooks/bad-config-rollback.md`
- `docs/deployment/ci-cd-model.md`
