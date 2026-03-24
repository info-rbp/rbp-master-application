# Deployment model: authentik

## Runtime type

- identity_provider

## Ingress model

- public_oidc_endpoints

## Egress/dependencies

- directory_or_idp_backend

## Auth boundary

- TODO: define runtime auth and trust boundary for authentik.

## Config + secrets

- Config keys should be declared in `config.template.yaml`.
- Secret references should be declared in `secret-refs.template.yaml`.
- Secret values must come from environment secret manager, never from git.

## Health checks

- Liveness endpoint: `TODO`
- Readiness endpoint: `TODO`
- Dependency checks: `TODO`
