# System responsibility matrix (Phase A / Step 1)

## Core source-of-truth boundaries

The platform adopts strict source-of-truth ownership:

- **Authentik owns identity truth.**
- **Odoo owns ERP/commercial truth.**
- **Lending owns application/loan lifecycle truth.**
- **Marble owns decision/risk outcome truth.**
- **Docspell owns document-ingest metadata truth.**
- **n8n owns automation execution state, not transactional truth.**
- **Metabase owns analytics presentation state, not transactional truth.**
- **`rbp-master-application` owns experience composition, control-plane policy, and user-facing orchestration surfaces.**

## Capability-to-system matrix

| Domain capability | System of record | Consumers | Notes |
|---|---|---|---|
| User identity, credentials, IdP session | Authentik | `rbp-master-application` auth/session broker | App stores platform session projection; identity master stays in Authentik. |
| Tenant/workspace experience context + route/module/capability enforcement | `rbp-master-application` | Browser users, internal operators | Composition and authorization enforcement live in this repo runtime. |
| Feature flags / module controls / rollout rules | `rbp-master-application` (Firestore-backed control-plane) | Admin control-plane + runtime checks | Platform-owned control-plane policy state. |
| ERP customers/invoices/support/commercial entities | Odoo | BFF, workflows, search/tasks aggregation | BFF maps Odoo records into canonical DTOs; does not replace Odoo as source. |
| Lending applications and loans | Lending (Frappe Lending) | BFF, workflows, search/tasks aggregation | Lifecycle truth remains in Lending engine. |
| Risk decisions/cases/outcomes | Marble | BFF/workflows/risk views | Decision truth remains in Marble. |
| Document ingest metadata/classification | Docspell | Document workflows, document views | Planned/explicit boundary even if adapter not yet implemented in repo. |
| Automation execution logs/status | n8n | Workflow services and ops tooling | Execution state belongs to n8n; business state remains in source systems/platform workflow state. |
| Analytics dashboards/cards/report definitions | Metabase | Admin analytics views/embedded dashboards | Presentation truth only; not transactional record ownership. |
| Platform workflow instance state/idempotency/step history | `rbp-master-application` | API consumers + operators | Platform orchestration owns workflow control-plane records and status endpoints. |
| Audit trail of platform operations | `rbp-master-application` | Admin/audit users | Cross-system references can be stored, but platform audit is app-owned. |

## Ownership by required domains

| Required domain statement | Formal owner |
|---|---|
| Identity | Authentik |
| ERP/commercial entities | Odoo |
| Lending lifecycle | Lending |
| Risk outcomes | Marble |
| Document-ingest metadata | Docspell |
| Analytics presentation | Metabase |
| Experience composition + control-plane + user orchestration surfaces | `rbp-master-application` |

## Communication responsibility model

| Interaction type | Owning caller | Direct browser access allowed? | Expected pattern |
|---|---|---:|---|
| Auth login redirect/callback | `rbp-master-application` + browser redirect | Yes (OIDC front-channel only) | Auth redirect + server token exchange |
| ERP/lending/risk API access | `rbp-master-application` BFF/adapters | No | BFF-mediated server calls |
| Automation trigger | `rbp-master-application` workflows | No | Event-driven orchestration + polling/status |
| Doc ingest integration | `rbp-master-application` workflows/BFF | No | Backend API/event pipeline |
| Analytics presentation embed | `rbp-master-application` admin/web surfaces | Sometimes (through signed embed URL) | Embedded analytics |
