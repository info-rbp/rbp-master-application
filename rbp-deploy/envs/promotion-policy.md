# Promotion policy

## Path

`local` -> `dev` -> `staging` -> `prod`

- Local artifacts are developer-only and must be rebuilt/released through CI for dev.
- Promotions are forward-only between shared environments.

## Release gates

### Dev gate

- PR validation checks pass
- overlay/config contract validation passes
- basic smoke checks pass

### Staging gate

- successful dev deployment baseline
- integration checks pass in staging
- release manager + SRE approval

### Prod gate

- staging validation green
- change ticket attached
- required approvals (owner + SRE + security if auth/network/secrets impacted)
- rollback target identified before deploy

## Rollback expectations

- Rollback uses last known good artifact and/or overlay revert.
- Production rollback must include incident/change record.
- Post-rollback verification must include auth callback, app health, and critical workflows.

## Freeze control

- Emergency production freeze can suspend promotions until incident commander clears release flow.
- See `../runbooks/emergency-production-freeze.md`.
