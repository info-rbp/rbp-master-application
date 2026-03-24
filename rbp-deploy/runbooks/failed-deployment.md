# Runbook: failed deployment

## Trigger

Deployment job failed or post-deploy checks failed.

## Immediate actions

1. Stop additional promotions.
2. Capture failing stage and logs.
3. Classify as config issue vs artifact/runtime issue.
4. Decide rollback or forward-fix path.

## Escalation

- Notify service owner + platform SRE on-call.
- Open incident if production impact exists.
