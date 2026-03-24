# rbp-deploy (deployment/infrastructure scaffold)

This directory is a **ready-to-extract bootstrap** for a dedicated deployment repository (for example `info-rbp/rbp-deploy`).

## Purpose

Centralize deployment and infrastructure ownership for the RBP platform:

- environment overlays (`envs/dev`, `envs/staging`, `envs/prod`)
- per-application deployment boundaries (`apps/*`)
- shared network, policy, and secret conventions (`shared/*`)
- release pipelines and promotion flow (`pipelines/*`)
- operator runbooks (`runbooks/*`)

## Relationship to `rbp-master-application`

`rbp-master-application` remains the application source repo. This scaffold is where deployment/runtime management for that app and its dependent engines is codified.

- Application code changes happen in `rbp-master-application`.
- Deploy strategy, env mappings, domain/DNS, secret references, and infra policies live here.

## What is managed here

- Deployment topology and runtime contracts for:
  - `rbp-master-application`
  - Authentik
  - Odoo
  - Lending
  - Marble
  - n8n
  - Docspell
  - Metabase
- Environment-specific endpoint/domain/project overlays.
- Secret **references** (not secret values).
- CI/CD pipeline definitions and promotion policy.
- Incident and rollback runbooks.

## Environment overlay model

Each environment folder includes:

- `service-endpoints.yaml`
- `domain-mapping.yaml`
- `firebase-gcp-projects.yaml`
- `feature-flag-posture.yaml`
- `secret-reference-map.yaml`
- `observability.yaml`
- `seeded-tenancy.yaml`

The same schema is used across dev/staging/prod so automation can diff/validate parity.

## Deployment philosophy

1. **One source of deploy truth per environment**.
2. **No secrets in git** (only references).
3. **Promotion, not re-implementation** (dev → staging → prod).
4. **Small blast radius** via service-level deployment manifests.
5. **Explicit ownership and approvals** for production changes.
6. **Runbook-first operations** for rollback and incident handling.

## Scaffold status

- This repo content is template/bootstrap material.
- Placeholder values are marked with `TODO` and `<replace-me>`.
- Safe to copy into a new dedicated repository with minimal changes.
