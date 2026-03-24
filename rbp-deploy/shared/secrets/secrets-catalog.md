# Secrets catalog

This catalog defines **secret-backed** configuration only.

## Secret manager model

- Primary store: centralized secret manager (GCP Secret Manager or Vault equivalent).
- Git repository stores only references (`ref:rbp/<env>/<service>/<KEY>`), never raw values.
- Runtime fetch is performed by deploy/runtime identity with least privilege.
- CI/CD retrieves secrets just-in-time for deploy steps that require them.

## Secret inventory

| Secret key | Used by service(s) | Purpose | Environments | Storage path pattern | Read access | Write access | Rotation SLA | Emergency rotation |
|---|---|---|---|---|---|---|---|---|
| `AUTHENTIK_CLIENT_SECRET` | rbp-master-application | OIDC code exchange with Authentik | dev/staging/prod | `rbp/<env>/rbp-master-application/AUTHENTIK_CLIENT_SECRET` | runtime SA, release pipeline SA | Identity Team + Security | 60-90 days | yes |
| `SESSION_SECRET` | rbp-master-application | Session cookie encryption/signing | all | `rbp/<env>/rbp-master-application/SESSION_SECRET` | runtime SA | Security + Platform SRE | 30-60 days | yes |
| `ODOO_API_KEY` | rbp-master-application adapter | Odoo API auth | dev/staging/prod | `rbp/<env>/odoo/ODOO_API_KEY` | runtime SA, integration test SA | ERP Team + Security | 90 days | yes |
| `ODOO_PASSWORD` | rbp-master-application adapter | Odoo credential auth fallback | dev/staging/prod | `rbp/<env>/odoo/ODOO_PASSWORD` | runtime SA | ERP Team + Security | 90 days | yes |
| `LENDING_API_KEY` | rbp-master-application adapter | Lending API auth key | dev/staging/prod | `rbp/<env>/lending/LENDING_API_KEY` | runtime SA | Lending Team + Security | 60-90 days | yes |
| `LENDING_API_SECRET` | rbp-master-application adapter | Lending API auth secret | dev/staging/prod | `rbp/<env>/lending/LENDING_API_SECRET` | runtime SA | Lending Team + Security | 60-90 days | yes |
| `MARBLE_API_KEY` | rbp-master-application adapter | Marble API token | dev/staging/prod | `rbp/<env>/marble/MARBLE_API_KEY` | runtime SA | Risk Engineering + Security | 60-90 days | yes |
| `N8N_API_KEY` | rbp-master-application adapter/workflows | n8n API auth | dev/staging/prod | `rbp/<env>/n8n/N8N_API_KEY` | runtime SA | Automation Team + Security | 60-90 days | yes |
| `N8N_WEBHOOK_SIGNING_SECRET` | rbp-master-application webhooks | Verify webhook signatures | staging/prod | `rbp/<env>/n8n/N8N_WEBHOOK_SIGNING_SECRET` | runtime SA | Automation Team + Security | 60 days | yes |
| `DOCSPELL_API_TOKEN` | rbp-master-application (future) | Docspell API auth | dev/staging/prod | `rbp/<env>/docspell/DOCSPELL_API_TOKEN` | runtime SA | Document Platform + Security | 90 days | yes |
| `METABASE_EMBED_SECRET` | rbp-master-application (future) | Signed Metabase embeds | dev/staging/prod | `rbp/<env>/metabase/METABASE_EMBED_SECRET` | runtime SA | Data Platform + Security | 60 days | yes |
| `ALERTING_WEBHOOK_SECRET` | alerting integrations | Auth/signing for alert webhook sink | dev/staging/prod | `rbp/<env>/observability/ALERTING_WEBHOOK_SECRET` | alert pipeline SA | Platform SRE + Security | 90 days | yes |

## Injection timing

| Context | Injection method |
|---|---|
| Local | `.env.local` created from secret refs via developer bootstrap flow (never committed) |
| CI/CD deploy | pipeline retrieves secrets using deploy identity and injects ephemeral env vars |
| Runtime | workload identity/service account retrieves secret values at startup or via platform secret injection |

## Access control policy

- Human read access to raw secrets is limited to Security + designated secret owners.
- Service teams consume secrets through references and runtime identities.
- All secret reads/writes must be audit logged by secret manager.
