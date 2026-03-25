# Environment Promotion Runbook

## Purpose
Promote releases safely from dev -> staging -> production.

## Symptoms / Trigger Conditions
- Release candidate ready for staging/prod.
- Scheduled release window.

## Prerequisites
- Green PR validation and dev deployment.
- Release tag or approved commit SHA.

## Required Access / Roles
- Release manager
- Platform engineer
- Production approver(s)

## Exact Steps
1. Validate dev status:
   - latest deploy green,
   - smoke checks pass.
2. Promote to staging:
   - tag release (`v*` or `release-*`) or run manual dispatch.
3. Review staging run summary and smoke outcomes.
4. Complete manual checks + sign-off template.
5. For production:
   - run manual `Deploy Production` workflow with `release_ref` + `change_ticket`.
   - wait for protected environment approval.
6. Validate production smoke and runtime health.
7. Communicate release completion.

## Verification Steps
- Workflow summaries for staging/prod show successful deploy and smoke checks.
- Manual checklist completed and archived.

## Rollback / Escalation Path
- If any critical check fails, stop promotion and use rollback runbook.

## Related Systems
- GitHub Actions workflows
- deployment docs/checklists

## Related Secrets / Config
- GitHub environment secrets per env
- promotion policy docs

## Who to Notify
- Release channel
- Platform + SRE
- Stakeholders for production releases

## Links to Adjacent Runbooks / Docs
- `runbooks/rollback.md`
- `runbooks/emergency-production-freeze.md`
- `docs/deployment/release-flow.md`
