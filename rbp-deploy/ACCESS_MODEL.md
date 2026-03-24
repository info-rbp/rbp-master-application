# Access model

## Repository access tiers

| Access level | Who | Scope |
|---|---|---|
| Read | Engineering, Security, Product Ops | Entire repo (except external secret manager systems) |
| Write (non-prod) | Service teams + Platform SRE | `envs/dev`, `envs/staging`, service manifests, pipelines |
| Write (prod paths) | Restricted maintainers | `envs/prod`, production pipeline configs |
| Deploy trigger | CI service accounts + release managers | Pipeline execution |
| Secret manager admin | Security + Platform SRE | Out-of-band secret systems only |

## Mutation policy

- Direct pushes to default branch: forbidden.
- PRs required for all changes.
- CODEOWNERS should be added in Step 3 to enforce approvals by path.

## Deployment policy

- Dev deploy: automated on merge to master when checks pass.
- Staging deploy: explicit promotion gate.
- Prod deploy: manual approval gate + change ticket/incident context.

## Production approval requirements

Prod-impacting changes require:

1. service owner approval
2. platform SRE approval
3. security approval when auth/network/secret policy changes are involved

## Secret access model

- Secret values are never stored in this repo.
- This repo stores only secret reference keys/paths.
- Runtime retrieves secrets from approved secret manager at deploy/runtime.
- Rotation cadence and last-rotated metadata should be maintained in `shared/secrets/` docs.

## Environment segregation policy

- Dev/staging/prod use separate cloud projects/accounts and logically isolated data stores.
- Cross-environment credentials are forbidden.
- Prod secret references must not be re-used in non-prod.

## Audit expectations

- All deploy-triggering changes should be traceable to PR and pipeline run ID.
- Emergency/manual changes must be documented in runbooks and incident records.
