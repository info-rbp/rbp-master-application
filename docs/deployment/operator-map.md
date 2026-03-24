# Operator Map

Start here if you are new to operating this platform.

## What to read first

Branch strategy quick view:
- Open PRs targeting `master`
- Merge to `master` triggers dev deploy
- Promote to staging by release tag/manual ref from `master`
- Deploy to production by manual dispatch of approved `master`-derived release ref

1. `docs/deployment/ci-cd-model.md`
2. `docs/deployment/release-flow.md`
3. `docs/deployment/smoke-test-checklist.md`
4. `docs/deployment/post-deploy-verification.md`
5. `docs/deployment/incident-entry-points.md`

## Where deployment is defined
- Workflows: `.github/workflows/`
  - `pr-validation.yml`
  - `deploy-dev.yml`
  - `promote-staging.yml`
  - `deploy-prod.yml`

## Where environment config is defined
- `rbp-deploy/envs/<env>/`
  - `config-contract.yaml`
  - `domain-mapping.yaml`
  - `service-endpoints.yaml`
  - `secret-reference-map.yaml`

## Where secrets policy is defined
- `rbp-deploy/shared/secrets/`
- `rbp-deploy/envs/<env>/secret-reference-map.yaml`
- GitHub Environment secrets (runtime values)

## Where smoke tests are defined
- `scripts/ci/smoke-test.sh`
- `scripts/ci/smoke-test.mjs`
- runtime endpoints:
  - `/api/health`
  - `/api/health/runtime`

## Where runbooks are
- `runbooks/` (operator execution runbooks)
- `docs/deployment/*checklist*.md` (quick execution aids)

## Automation vs manual responsibility
- Automated: validation, deploy, smoke, artifact capture.
- Manual: release sign-off, production approvals, emergency freeze decision, incident comms.

## If something breaks
- Use `docs/deployment/incident-entry-points.md` to select the correct first runbook.
