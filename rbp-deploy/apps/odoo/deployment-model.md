# Deployment model: odoo

## Runtime type

- erp_application

## Ingress model

- internal_api

## Egress/dependencies

- database, object_storage(optional)

## Auth boundary

- TODO: define runtime auth and trust boundary for odoo.

## Config + secrets

- Config keys should be declared in `config.template.yaml`.
- Secret references should be declared in `secret-refs.template.yaml`.
- Secret values must come from environment secret manager, never from git.

## Health checks

- Liveness endpoint: `TODO`
- Readiness endpoint: `TODO`
- Dependency checks: `TODO`
