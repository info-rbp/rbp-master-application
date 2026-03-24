# Runbook: first environment bootstrap

## Goal

Bring up a new environment overlay and connect it to deploy/runtime systems.

## Steps

1. Copy env template files in `envs/<env>/` and fill real values.
2. Register DNS/domain and auth callback URLs.
3. Provision cloud projects and service accounts.
4. Populate secret manager entries and references.
5. Validate network allowlists and webhook endpoints.
6. Run dry-run and smoke-check pipeline.

## Exit criteria

- service endpoints resolve
- app login callback works
- health checks pass
