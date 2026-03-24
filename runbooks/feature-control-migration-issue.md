# Feature-Control Migration Issue Runbook

## Purpose
Recover when feature-control data/model migration causes admin/control-plane failures.

## Symptoms / Trigger Conditions
- Feature-control admin APIs fail after migration/deploy.
- Runtime flag evaluation errors spike.

## Prerequisites
- Access to migration logs and control-plane diagnostics endpoint.

## Required Access / Roles
- Platform engineer
- Feature-control owner

## Exact Steps
1. Confirm failing surfaces:
   - `/api/admin/feature-controls/diagnostics`
   - `/api/admin/feature-flags`
2. Check deployment history for migration script execution.
3. Verify schema/data assumptions in latest migration commit.
4. If migration introduced bad state:
   - disable affected rollout/assignment rules,
   - restore previous known-good records from backup/export.
5. Re-run deployment and smoke tests.
6. For production, freeze promotions until diagnostic endpoint returns stable output.

## Verification Steps
- Feature-control read/evaluate endpoints recover.
- Runtime flag checks no longer fail.

## Rollback / Escalation Path
- Roll back application release and migration batch if needed.
- Escalate to platform lead if control-plane consistency is uncertain.

## Related Systems
- Feature flag control plane
- Firestore-backed repositories
- Admin APIs

## Related Secrets / Config
- Firestore credentials
- feature-control migration controls

## Who to Notify
- Feature-control owner
- Platform on-call
- Product owner for risk communication

## Links to Adjacent Runbooks / Docs
- `runbooks/failed-deployment.md`
- `runbooks/firestore-access-issue.md`
- `docs/deployment/incident-entry-points.md`
