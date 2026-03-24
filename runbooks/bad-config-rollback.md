# Bad Config Rollback Runbook

## Purpose
Revert configuration-only changes that caused deployment/runtime instability.

## Symptoms / Trigger Conditions
- Deploy succeeds but smoke tests fail due to misconfigured URLs/secrets.
- Runtime health shows upstream/firestore failures tied to config.

## Prerequisites
- Previous valid config snapshot.
- Access to env config files and GitHub environment secrets.

## Required Access / Roles
- Platform engineer
- Config owner

## Exact Steps
1. Compare current and last known good:
   - `rbp-deploy/envs/<env>/config-contract.yaml`
   - `domain-mapping.yaml`
   - `service-endpoints.yaml`
   - GitHub environment secrets metadata.
2. Revert invalid config values (never paste secrets into repo).
3. Re-run validation:
   ```bash
   ./scripts/ci/validate-env-config.sh <env>
   ```
4. Redeploy environment.
5. Re-run smoke tests and capture summary.

## Verification Steps
- Smoke failures linked to config are cleared.
- Runtime health no longer reports misconfigured upstreams.

## Rollback / Escalation Path
- If config rollback fails, perform full release rollback.
- Escalate to security for secret-related misconfiguration.

## Related Systems
- Env config overlays
- GitHub environment secrets
- Deployment pipelines

## Related Secrets / Config
- `rbp-deploy/envs/<env>/*`
- secret manager refs

## Who to Notify
- Platform lead
- Service owner
- Security owner (if secrets affected)

## Links to Adjacent Runbooks / Docs
- `runbooks/secret-setup.md`
- `runbooks/rollback.md`
- `docs/deployment/deploy-checklist.md`
