# CI/CD Model

This document defines the executable CI/CD automation for `rbp-master-application`.

## Workflow inventory

Workflows live in `.github/workflows/`:

- `pr-validation.yml` — PR quality gates.
- `deploy-dev.yml` — automatic dev deployment from `develop`.
- `promote-staging.yml` — staging promotion from release tag or manual dispatch.
- `deploy-prod.yml` — manually approved production deployment.

## Shared behavior

All workflows include:

- Node 20 runtime setup via `actions/setup-node@v4`.
- npm dependency caching (`cache: npm`).
- deterministic install (`npm ci`).
- environment validation gate (`scripts/ci/validate-env-config.sh`).
- build/test validation gates (lint, typecheck, platform tests, BFF tests, build).
- post-run artifact upload (`actions/upload-artifact@v4`) for logs and summaries.
- deployment summary generation (`scripts/ci/write-deployment-summary.sh`).
- concurrency groups to prevent unsafe overlapping runs.

## Environment and secrets model

Workflows are attached to GitHub environments:

- `dev`
- `staging`
- `production`

Each environment must define at least:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_TOKEN`
- `APP_BASE_URL`

Production approvals are enforced via the protected `production` GitHub environment reviewers.

## Deployment execution path

Deployments call:

- `scripts/ci/deploy-apphosting.sh <env>`

That script executes real Firebase App Hosting deployment using `firebase-tools` against the configured project and token.

## Failure visibility

- workflow failure status appears directly on PR checks and Actions runs.
- `GITHUB_STEP_SUMMARY` is populated with status and operator instructions.
- artifacts retain logs and deployment summaries for forensic follow-up.

## Step 7 integration point

`smoke-test.sh` is intentionally lightweight and path-driven (`SMOKE_PATHS`) so Step 7 can replace/extend it with richer synthetic checks while keeping workflow contracts stable.
