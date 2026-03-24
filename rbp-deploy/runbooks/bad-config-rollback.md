# Runbook: bad config rollback

## Trigger

Recent config/overlay change breaks runtime behavior.

## Procedure

1. Revert offending overlay file(s).
2. Re-run config validation checks.
3. Redeploy affected service(s) only.
4. Confirm resolution with smoke checks.

## Prevention follow-up

- add validation guardrail in PR pipeline
- add owner check for affected path
