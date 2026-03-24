# Rollback guidance

## Standard rollback triggers

- failed health checks post-deploy
- auth/session failure on login callback
- critical data-path errors
- elevated 5xx error rate beyond threshold

## Rollback approaches

1. Deploy previous known-good artifact/tag.
2. Revert environment overlay change and redeploy.
3. Activate emergency freeze policy and disable risky toggles.

## Required records

- incident ID
- change ID / PR
- pipeline run ID
- rollback completion timestamp
