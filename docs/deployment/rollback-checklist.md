# Rollback Checklist

## Trigger conditions
- [ ] Smoke failures on critical paths.
- [ ] Runtime degraded and not quickly recoverable.
- [ ] Incident commander or service owner approved rollback.

## Execution
- [ ] Freeze forward deployments/promotions.
- [ ] Identify last known good release ref.
- [ ] Trigger deploy workflow with rollback ref.
- [ ] Monitor workflow and smoke output.

## Validation
- [ ] Smoke tests pass after rollback.
- [ ] Runtime health restored.
- [ ] Error/alert rates return to baseline.

## Comms & closure
- [ ] Incident and release channels updated.
- [ ] Sign-off template updated with rollback details.
- [ ] Follow-up actions captured.
