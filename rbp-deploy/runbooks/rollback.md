# Runbook: rollback

## Preconditions

- identify last known good release
- confirm rollback approvers

## Procedure

1. Trigger rollback pipeline/artifact redeploy.
2. Re-apply known-good env overlay if config drift caused failure.
3. Verify critical paths:
   - login/auth callback
   - dashboard/API
   - admin control-plane
4. Announce status in incident channel.

## Post-rollback

- freeze further deploys until root cause is identified
- capture timeline and lessons learned
