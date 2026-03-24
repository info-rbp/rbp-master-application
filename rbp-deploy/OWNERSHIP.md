# Ownership model

## Service ownership matrix

| Service | Product owner | Technical owner | Ops owner | Backup owner |
|---|---|---|---|---|
| rbp-master-application | Platform Product | Platform App Team | Platform SRE | Web Platform Lead |
| Authentik | Security Product | Identity Team | Security/SRE | Platform SRE |
| Odoo | Commercial Ops | ERP Team | ERP/SRE | Platform Integrations |
| Lending | Lending Ops | Lending Platform Team | Lending/SRE | Platform Integrations |
| Marble | Risk Ops | Risk Engineering | Risk/SRE | Platform Integrations |
| n8n | Automation Ops | Automation Team | Platform SRE | Integrations Lead |
| Docspell | Document Ops | Document Platform Team | Platform SRE | Integrations Lead |
| Metabase | Analytics Ops | Data Platform Team | Data/SRE | Analytics Engineering |

## Infra ownership boundaries

- Shared network/policies/secrets baseline: Platform SRE + Security.
- Environment overlays and release definitions: Platform SRE + owning service team.
- App-level deployment manifests: each service owner with SRE review.

## Approval model

### Non-prod

- Dev changes: 1 technical approver from owning team.
- Staging changes: 1 owner + 1 SRE approver.

### Prod

- Requires:
  1. owning technical lead approval
  2. platform SRE approval
  3. security approval for policy/secret/auth boundary changes

## Emergency access expectations

- Break-glass access must be time-boxed and audited.
- Emergency changes must be backfilled into normal PR flow within 24 hours.
- Any production emergency mutation must reference a runbook and incident ID.

## Change classes

| Change class | Examples | Required approvers |
|---|---|---|
| Low risk | doc/runbook updates, non-prod label changes | 1 owner |
| Medium risk | dev/staging endpoint change, non-prod pipeline changes | owner + SRE |
| High risk | prod domain/DNS/secrets/policy or auth callback updates | owner + SRE + security |
| Critical | emergency freeze/rollback | incident commander + SRE on-call + service owner |
