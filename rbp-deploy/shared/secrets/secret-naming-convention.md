# Secret naming convention

## Canonical path format

`rbp/<environment>/<service>/<SECRET_KEY>`

Examples:

- `rbp/dev/rbp-master-application/SESSION_SECRET`
- `rbp/staging/lending/LENDING_API_SECRET`
- `rbp/prod/marble/MARBLE_API_KEY`

## Rules

1. Environment segment must be one of: `local`, `dev`, `staging`, `prod`.
2. Service segment must match deploy service key (`rbp-master-application`, `odoo`, etc.).
3. Secret key segment must be uppercase snake case.
4. Do not reuse the same secret path across environments.
5. Deprecate old secrets with explicit suffix (`_DEPRECATED_YYYYMM`) before removal.

## Reference format in config files

Use reference strings, not values:

`ref:rbp/<env>/<service>/<SECRET_KEY>`

## Reserved prefixes

- `rbp/<env>/platform-shared/*` for cross-service shared secrets
- `rbp/<env>/observability/*` for logging/alerting integration secrets
