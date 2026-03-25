# Repository Build Health

## Purpose

This document records the current deployment-readiness validation baseline for `rbp-master-application`.

It exists to make the build/test/deploy health of the repository explicit, durable, and reviewable rather than relying on pull request summaries or memory.

## Current validation baseline

The repository is expected to support the following validation path from a clean checkout:

```bash
npm ci
npm run lint
npm run typecheck
npm run test:platform
npm run test:bff
npm run build
