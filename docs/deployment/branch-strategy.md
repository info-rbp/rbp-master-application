# Branch Strategy (Canonical)

This repository uses a **single integration branch model**.

## Canonical branches and roles

- **Default branch:** `master`
- **Integration branch:** `master`
- **Dev auto-deploy source:** pushes/merges to `master`
- **Release candidate source:** release tags (`v*`, `release-*`) cut from `master` (or explicitly selected `master`-derived ref)
- **Production deploy source:** manually approved release ref (normally tagged from `master`)

## CI/CD mapping

- PR validation runs for PRs targeting `master`.
- Merge to `master` triggers dev deployment.
- Staging deploy runs from release tags or manual dispatch, using release refs from `master`.
- Production deploy is manual and approval-gated.

## Operator expectations

- Open PRs against `master`.
- Do not use `develop` as integration/deploy branch unless workflows/docs are intentionally reworked together.
- If GitHub default branch differs from `master`, update repository settings to match this document or update all docs/workflows in one coordinated change.
