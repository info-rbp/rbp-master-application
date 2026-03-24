# Shared secrets conventions

## Principles

1. Never store secret values in git.
2. Store only reference keys/paths and metadata.
3. Use per-environment secret namespaces.
4. Rotate regularly and after incidents.

## Naming convention

`rbp/<env>/<service>/<secret_key>`

Example:

- `rbp/prod/rbp-master-application/SESSION_SECRET`
- `rbp/staging/lending/LENDING_API_KEY`

## Rotation policy template

- Standard secrets: every 90 days.
- High-risk auth secrets: every 30-60 days.
- Immediate rotation after suspected compromise.

## Tracking metadata

Track in a separate secure system:

- owner
- last rotated at
- next due date
- rotation runbook reference

## References in this repo

Use `envs/<env>/secret-reference-map.yaml` and `apps/*/secret-refs.template.yaml`.


## Step 4 contract artifacts

- `config-matrix.md`
- `secrets-catalog.md`
- `secret-naming-convention.md`
- `rotation-and-ownership-policy.md`
- `local-secret-bootstrap.md`
- `new-environment-bootstrap.md`
