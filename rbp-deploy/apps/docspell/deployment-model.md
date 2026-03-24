# Deployment model: docspell

## Runtime type

- document_ingest_engine

## Ingress model

- internal_api

## Egress/dependencies

- database, search_index, object_storage

## Auth boundary

- TODO: define runtime auth and trust boundary for docspell.

## Config + secrets

- Config keys should be declared in `config.template.yaml`.
- Secret references should be declared in `secret-refs.template.yaml`.
- Secret values must come from environment secret manager, never from git.

## Health checks

- Liveness endpoint: `TODO`
- Readiness endpoint: `TODO`
- Dependency checks: `TODO`
