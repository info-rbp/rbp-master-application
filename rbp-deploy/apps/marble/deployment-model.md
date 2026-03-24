# Deployment model: marble

## Runtime type

- risk_decision_engine

## Ingress model

- internal_api

## Egress/dependencies

- policy_store, risk_data_feeds

## Auth boundary

- TODO: define runtime auth and trust boundary for marble.

## Config + secrets

- Config keys should be declared in `config.template.yaml`.
- Secret references should be declared in `secret-refs.template.yaml`.
- Secret values must come from environment secret manager, never from git.

## Health checks

- Liveness endpoint: `TODO`
- Readiness endpoint: `TODO`
- Dependency checks: `TODO`
