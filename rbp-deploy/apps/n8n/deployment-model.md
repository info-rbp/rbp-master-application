# Deployment model: n8n

## Runtime type

- workflow_automation

## Ingress model

- internal_api_plus_webhooks

## Egress/dependencies

- database, queue(optional)

## Auth boundary

- TODO: define runtime auth and trust boundary for n8n.

## Config + secrets

- Config keys should be declared in `config.template.yaml`.
- Secret references should be declared in `secret-refs.template.yaml`.
- Secret values must come from environment secret manager, never from git.

## Health checks

- Liveness endpoint: `TODO`
- Readiness endpoint: `TODO`
- Dependency checks: `TODO`
