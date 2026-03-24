# staging bootstrap and seed notes

## Seed baseline

- Seed release-candidate tenants/workspaces mirroring production topology.

## Seeded users

- Platform admin user: `<replace-staging-platform-admin-email>`
- Operator user group: `<replace-staging-operator-group>`
- Break-glass contact: `<replace-staging-oncall-contact>`

## Data principles

- Use masked data only; no raw PII from production.

## Operational notes

- Reseed only through controlled runbook before release cycles.
- Reference runbook: `../../runbooks/first-environment-bootstrap.md`
