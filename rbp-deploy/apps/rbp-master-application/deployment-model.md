# Deployment model: rbp-master-application

## Runtime type

- nextjs_app_hosting

## Ingress model

- public_https_and_api

## Egress/dependencies

- authentik, odoo, lending, marble, n8n, firestore

## Auth boundary

- TODO: define runtime auth and trust boundary for rbp-master-application.

## Config + secrets

- Config keys should be declared in `config.template.yaml`.
- Secret references should be declared in `secret-refs.template.yaml`.
- Secret values must come from environment secret manager, never from git.

## Health checks

- Liveness endpoint: `TODO`
- Readiness endpoint: `TODO`
- Dependency checks: `TODO`
