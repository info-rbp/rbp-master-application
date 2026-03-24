# Deployment model: metabase

## Runtime type

- analytics_presentation

## Ingress model

- internal_ui_and_embed

## Egress/dependencies

- warehouse_or_reporting_db

## Auth boundary

- TODO: define runtime auth and trust boundary for metabase.

## Config + secrets

- Config keys should be declared in `config.template.yaml`.
- Secret references should be declared in `secret-refs.template.yaml`.
- Secret values must come from environment secret manager, never from git.

## Health checks

- Liveness endpoint: `TODO`
- Readiness endpoint: `TODO`
- Dependency checks: `TODO`
