# Release Flow

## Branch/promotion model

The release model encoded by workflows is:

1. **Pull Request** → validation only (`PR Validation` workflow).
2. **Merge to `develop`** → deploy to **dev** (`Deploy Dev`).
3. **Tag release (`v*` / `release-*`) or manual dispatch** → deploy to **staging** (`Promote to Staging`).
4. **Manual production dispatch with protected environment approval** → deploy to **production** (`Deploy Production`).

## Promotion gates

### PR gate

Required checks from `pr-validation.yml`:

- lint
- typecheck
- platform tests
- BFF tests
- production build

### Dev gate

`deploy-dev.yml` requires:

- all quality gates pass
- dev config validation passes
- deployment succeeds
- smoke checks pass

### Staging gate

`promote-staging.yml` requires:

- release candidate validation passes
- staging config verification passes
- staging deploy succeeds
- staging smoke checks pass
- manual sign-off activities recorded in workflow summary

### Production gate

`deploy-prod.yml` requires:

- manual dispatch with explicit release ref + change ticket
- full validation and config verification
- protected `production` environment approval before deploy
- production smoke checks
- rollback instructions emitted in run summary

## Operational notes

- promotions are linear (dev -> staging -> prod) even when triggered manually.
- each environment has its own secrets via GitHub environments.
- concurrency groups prevent overlapping deployment jobs per environment.
