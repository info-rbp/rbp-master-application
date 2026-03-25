# Emergency Production Freeze / Deploy Halt Runbook

## Purpose
Immediately stop production changes during a critical incident.

## Symptoms / Trigger Conditions
- Active production incident with unknown blast radius.
- Repeated failed deployments/smoke checks in production.
- Security or data integrity concern.

## Prerequisites
- Incident declared and incident commander assigned.

## Required Access / Roles
- Incident commander
- Repo admin (can lock workflows/approvals)
- SRE on-call

## Exact Steps
1. Announce freeze in incident and release channels.
2. Disable/hold production workflow dispatch access temporarily.
3. Remove or tighten production environment approvals to prevent accidental deploy.
4. Cancel in-progress production workflows if unsafe.
5. Snapshot current deployment and config state.
6. Decide stabilize path:
   - rollback release,
   - config rollback,
   - hold until root cause found.
7. Keep freeze until incident commander declares recovery criteria met.

## Verification Steps
- No production deploy workflows can execute without explicit incident commander approval.
- Service stability metrics are improving/within threshold.

## Rollback / Escalation Path
- Execute `runbooks/rollback.md` if current release is unsafe.
- Escalate to executive/security response path for severe incidents.

## Related Systems
- GitHub Actions production workflow
- Incident management tooling
- Monitoring/alerts

## Related Secrets / Config
- Production environment protection settings
- production secrets (read-only unless required)

## Who to Notify
- Incident channel + executives (severity dependent)
- Security team
- Customer communications owner

## Links to Adjacent Runbooks / Docs
- `runbooks/failed-deployment.md`
- `runbooks/rollback.md`
- `docs/deployment/incident-entry-points.md`
