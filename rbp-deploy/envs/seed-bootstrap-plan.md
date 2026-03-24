# Seed bootstrap plan

## Global seed principles

1. Seed only what is needed for environment role.
2. Keep seed data deterministic and idempotent where possible.
3. Never move production raw PII into non-prod.
4. Track seed versions and execution logs.

## Environment seed profiles

| Environment | Tenant/workspace profile | User profile | Data profile |
|---|---|---|---|
| local | deterministic sample tenants/workspaces | local admin/member fixture users | synthetic only |
| dev | shared integration tenants covering all major modules | test operators + integration test users | synthetic or masked |
| staging | production-shaped tenants/workspaces for release confidence | release operators + QA users | masked production-like |
| prod | minimal required live tenant/workspace bootstrap | real operator/admin users with least privilege | live production |

## Minimum seed objects

- tenant records
- workspace records
- role and capability assignments
- admin/operator user principals
- baseline feature-flag and module-control posture

## Operator workflow

1. Confirm environment config contract values.
2. Execute seed runbook and capture run ID.
3. Validate auth, session, and admin access.
4. Validate core module visibility by seeded roles.
5. Record completion in environment changelog.

## References

- `./local/bootstrap-seed-notes.md`
- `./dev/bootstrap-seed-notes.md`
- `./staging/bootstrap-seed-notes.md`
- `./prod/bootstrap-seed-notes.md`
