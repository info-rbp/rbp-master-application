# prod bootstrap and seed notes

## Seed baseline

- Bootstrap only required production tenants/workspaces and named operator accounts.

## Seeded users

- Platform admin user: `<replace-prod-platform-admin-email>`
- Operator user group: `<replace-prod-operator-group>`
- Break-glass contact: `<replace-prod-oncall-contact>`

## Data principles

- Live production data policy enforced; synthetic test records must be explicitly tagged.

## Operational notes

- No destructive reseed operations without incident-approved change process.
- Reference runbook: `../../runbooks/first-environment-bootstrap.md`
