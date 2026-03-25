# Rollback Model

Rollback is a first-class deployment outcome for every environment.

## When rollback is required

Trigger rollback when any of the following occurs after deployment:

- smoke checks fail
- critical user journeys fail in manual verification
- elevated error rates / severe incidents are detected
- security or data-integrity concerns are identified

## Rollback authority

- **dev**: platform engineers/service owners
- **staging**: platform engineers + release manager
- **production**: incident commander + on-call SRE + service owner

## Rollback procedure (high-level)

1. Freeze forward promotions.
2. Identify last known good release ref.
3. Execute rollback using `rbp-deploy/runbooks/rollback.md`.
4. Run smoke checks against rolled back version.
5. Record incident context and mitigation notes.
6. Re-open promotion only after root-cause containment.

## CI/CD workflow integration

- workflows always emit deployment summaries via `scripts/ci/write-deployment-summary.sh`.
- production workflow appends rollback instructions to `GITHUB_STEP_SUMMARY`.
- artifacts include deployment summaries/logs for incident timelines.

## Expected evidence after rollback

- deployment summary artifact showing rollback decision context
- runbook execution notes in incident channel/ticket
- smoke test pass on restored release
- documented action items for prevention
