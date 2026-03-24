# Service inventory (Phase A / Step 1)

## Classification key

- **Runtime type**: Next.js app, vendor SaaS, self-hosted VM/container, Kubernetes workload, platform data service.
- **Environment sensitivity**: low / medium / high / very high.
- **Launch scope**:
  - **Launch-critical**: must be available for MVP launch path.
  - **Internal-only accelerator**: boosts operations but is not externally required day-1.
  - **Optional later-phase module**: planned for later integration or progressive rollout.

## Inventory

| Service / Engine | Purpose | Deployment location | Runtime type | Owner (operational) | Public vs Internal | Environment sensitivity | Launch scope |
|---|---|---|---|---|---|---|---|
| `rbp-master-application` | User web experience, BFF APIs, admin control-plane, workflow orchestration surface | Firebase App Hosting project (per env) | Next.js web app runtime | Platform application team | Public web + internal admin paths | Very high | Launch-critical |
| Firestore/Firebase project resources | Control-plane persistence, app data, analytics event store, hosting integration | Firebase/GCP project per environment | Platform data service | Platform application + cloud ops | Internal data plane (accessed via app) | Very high | Launch-critical |
| Authentik | Identity provider (OIDC auth, claims, login/logout) | Separate identity platform stack | Separate platform service (self-hosted or managed by identity team) | Identity/platform security team | Public auth endpoints + internal admin | Very high | Launch-critical |
| Odoo | ERP/commercial truth (customers, invoices, tickets, knowledge artifacts) | Separate Odoo deployment | Self-hosted VM/container or K8s workload (external to this repo) | ERP/business systems team | Internal API service (not direct public UI from this app) | Very high | Launch-critical |
| Lending (Frappe Lending) | Lending application + loan lifecycle truth | Separate lending deployment | Self-hosted VM/container or K8s workload | Lending operations/platform team | Internal API service | Very high | Launch-critical |
| Marble | Risk decisioning and case outcomes | Separate Marble service environment | Vendor-hosted or dedicated separate service | Risk platform team | Internal API service | Very high | Launch-critical for risked loan flows |
| n8n | Automation execution for workflow steps | Separate n8n deployment | Self-hosted container/K8s or managed n8n | Platform automation team | Internal API + inbound webhook endpoints | High | Internal-only accelerator (critical for advanced automation, not for minimal read-only launch) |
| Docspell | Document ingest metadata/source of truth for document indexing | Separate Docspell deployment | Separate platform service | Document operations/platform team | Internal API service | High | Optional later-phase module |
| Metabase | Analytics dashboards/report presentation (not transactional source) | Separate BI deployment | Separate platform service (managed or self-hosted) | Data/BI team | Internal/admin-facing, optionally embedded public-safe slices | Medium-High | Optional later-phase module |
| Optional internal tooling (e.g., Appsmith) | Back-office operational tooling | Separate internal tools stack | Separate platform service | Internal tools team | Internal-only | Medium | Internal-only accelerator |

## Runtime boundary details

| Unit | Ingress pattern | Auth boundary | Config dependency | Secret dependency | Launch-critical? |
|---|---|---|---|---|---|
| `rbp-master-application` | Public HTTPS web + API routes under same domain | Session cookie + platform access policy + admin/internal route controls | Next.js/Firebase env vars | OIDC secrets, session secret, adapter API keys | Yes |
| Authentik | OIDC browser redirects + token endpoint calls from app backend | Authentik realm/policy | issuer/client/redirect config | client secret, signing keys (provider side) | Yes |
| Odoo | Backend-to-backend HTTPS from adapter layer | API key or basic auth | base URL/db mode | Odoo credentials/API key | Yes |
| Lending | Backend-to-backend HTTPS | token/basic auth | base URL + mode | lending key/secret or creds | Yes |
| Marble | Backend-to-backend HTTPS | API key | base URL + mode | marble API key | Yes for risk-enabled launch |
| n8n | Backend triggers + status checks; optional inbound webhooks | API key + workflow-level ACL | base URL + mode | n8n API key/webhook secrets | No (for minimal launch), yes for automation-heavy launch |
| Docspell | Backend integration API (planned) | service auth/token | base URL + ingestion mapping config | docspell auth secret/token | No |
| Metabase | Embed/query gateway (planned) | signed embed/session or service auth | base URL + dashboard ids | embed signing key/service token | No |
