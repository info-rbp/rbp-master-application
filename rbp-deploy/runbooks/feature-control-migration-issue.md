# Runbook: feature-control migration issue

## Symptoms

- feature rules missing or inconsistent after migration
- control-plane diagnostics showing conflicts

## Checks

1. Confirm migration job/environment target.
2. Validate repository/runtime store references.
3. Inspect diagnostics and recent changes endpoints.
4. Compare expected flag posture with env overlay notes.

## Remediation

- stop further mutations
- restore from control-plane backup/export if available
- re-run migration with idempotency checks
