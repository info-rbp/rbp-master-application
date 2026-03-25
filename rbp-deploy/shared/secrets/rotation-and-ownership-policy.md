# Rotation and ownership policy

## Ownership model

| Secret domain | Primary owner | Secondary owner | Approval required |
|---|---|---|---|
| Auth secrets (`AUTHENTIK_CLIENT_SECRET`, `SESSION_SECRET`) | Security Team | Identity Team / Platform SRE | Security + owner |
| ERP/Lending/Risk integration secrets | Service owner team | Security Team | Service owner + Security |
| Automation/webhook secrets | Automation Team | Security Team | Automation owner + Security |
| Analytics/doc ingestion secrets | Data/Document owner teams | Security Team | Owner + Security |

## Standard rotation cadence

| Secret class | Cadence |
|---|---|
| Session/auth-critical | 30-60 days |
| API tokens and integration credentials | 60-90 days |
| Long-lived fallback credentials (discouraged) | 90 days max |

## Rotation workflow

1. Create new secret version in secret manager.
2. Update secret reference mapping if key/path changes.
3. Deploy to dev and validate auth/integration health.
4. Promote to staging, validate, then to prod with approvals.
5. Disable prior secret version after safe cutover window.

## Emergency rotation workflow

Trigger conditions:

- suspected credential leak
- unauthorized access evidence
- provider compromise advisory

Actions:

1. Incident commander opens security incident.
2. Rotate affected secrets immediately in all environments (starting prod).
3. Force application restart/redeploy to reload values.
4. Invalidate old sessions/tokens where supported.
5. Post-incident review within 48 hours.

## Audit and records

- Every rotation event must capture:
  - initiator
  - approved-by
  - environment(s)
  - timestamp
  - impacted services
  - verification evidence
