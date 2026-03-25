# Configuration matrix

This matrix defines the runtime/deploy configuration contract for `rbp-master-application` and integrated engines.

## Classification legend

- **Class**: `non-secret` or `secret`
- **Phase**: `deploy-time`, `runtime`, or `both`
- **Scope flags**:
  - `env-override`: varies by local/dev/staging/prod
  - `local-only`: used only in local development
  - `external-ref`: value points to managed external system
  - `operator-managed`: set/approved by operator/release manager

## Inventory

| Key | Purpose | Type | Class | Required | Envs | Phase | Scope flags | Source of value | Owner | Rotation | Example placeholder | Dependent subsystem(s) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `ENVIRONMENT` | Canonical runtime env identifier | string | non-secret | yes | all | both | env-override | env overlay | Platform SRE | n/a | `dev` | app bootstrap, logging tags |
| `NODE_ENV` | Node runtime mode | string | non-secret | yes | all | runtime | env-override | deploy platform/runtime | Platform App Team | n/a | `production` | Next.js runtime behavior |
| `APP_BASE_URL` | Public app origin | url | non-secret | yes | all | both | env-override, operator-managed | env overlay/domain mapping | Platform SRE | on domain change | `https://app-stg.<domain>` | auth redirects, links |
| `API_BASE_URL` | API base origin | url | non-secret | yes | all | both | env-override | env overlay | Platform SRE | on topology change | `https://app-stg.<domain>/api` | frontend API calls |
| `ADMIN_PATH` | Admin/control-plane route prefix | string | non-secret | yes | all | runtime | fixed | config contract | Platform App Team | n/a | `/admin` | admin routing |
| `RBP_APP_HOSTING_BACKEND_ID` | Firebase App Hosting backend id | string | non-secret | yes | dev/staging/prod | deploy-time | env-override, external-ref | firebase config mapping | Platform SRE | on infra change | `rbp-master-application` | deploy pipeline |
| `FIREBASE_PROJECT_ID` | Firebase project binding | string | non-secret | yes | all | both | env-override, external-ref | env overlay | Platform SRE | n/a | `rbp-dev-firebase` | firebase sdk/server |
| `GCP_PROJECT_ID` | GCP primary project | string | non-secret | yes | dev/staging/prod | both | env-override, external-ref | env overlay | Platform SRE | n/a | `rbp-dev-gcp` | gcp integrations |
| `FIRESTORE_DATABASE` | Firestore database id | string | non-secret | yes | all | runtime | env-override | env overlay | Platform App Team | n/a | `(default)` | control-plane store |
| `RBP_CONTROL_PLANE_COLLECTION` | Root control-plane collection | string | non-secret | optional | all | runtime | env-override | app config | Platform App Team | n/a | `platform_control_plane` | feature controls |
| `PRIMARY_STORAGE_BUCKET` | App assets bucket | string | non-secret | yes | dev/staging/prod | runtime | env-override, external-ref | env overlay | Platform SRE | on infra change | `rbp-dev-app-assets` | files/assets |
| `DOCUMENT_STORAGE_BUCKET` | Document/object bucket | string | non-secret | yes | dev/staging/prod | runtime | env-override, external-ref | env overlay | Document Platform Team | on infra change | `rbp-dev-documents` | doc workflows |
| `AUTHENTIK_ISSUER_URL` | OIDC issuer endpoint | url | non-secret | yes | all | runtime | env-override, external-ref | service endpoints | Identity Team | on IdP change | `https://auth-dev.<domain>/application/o/rbp/` | auth login/callback |
| `AUTHENTIK_CLIENT_ID` | OIDC client identifier | string | non-secret | yes | all | runtime | env-override | IdP client registration | Identity Team | on client rotation | `rbp-master-app` | auth login/callback |
| `AUTHENTIK_CLIENT_SECRET` | OIDC client secret value | secret | secret | yes | dev/staging/prod | runtime | env-override, external-ref | secret manager ref | Identity Team + Security | 60-90 days | `ref:rbp/dev/rbp-master-application/AUTHENTIK_CLIENT_SECRET` | auth code exchange |
| `AUTHENTIK_REDIRECT_URI` | OIDC callback URI | url | non-secret | yes | all | runtime | env-override | env overlay | Platform SRE | on domain change | `https://app-dev.<domain>/api/auth/callback` | auth callback |
| `AUTHENTIK_POST_LOGOUT_REDIRECT_URI` | OIDC logout return URL | url | non-secret | yes | all | runtime | env-override | env overlay | Platform SRE | on domain change | `https://app-dev.<domain>/login` | logout flow |
| `SESSION_SECRET` | Encrypt/sign session cookie payloads | secret | secret | yes | all | runtime | env-override, external-ref | secret manager ref | Platform Security | 30-60 days | `ref:rbp/dev/rbp-master-application/SESSION_SECRET` | session service |
| `SESSION_COOKIE_NAME` | Session cookie key name | string | non-secret | optional | all | runtime | env-override | app config | Platform App Team | n/a | `rbp_session` | auth/session boundary |
| `LOCAL_AUTH_ENABLED` | Enable local fallback auth | boolean | non-secret | optional | local/dev | runtime | local-only, env-override | local env config | Platform App Team | n/a | `true` | local bootstrap auth |
| `ODOO_BASE_URL` | Odoo API base URL | url | non-secret | yes | all | runtime | env-override, external-ref | service endpoints | ERP Team | on endpoint change | `https://odoo-dev.internal` | odoo adapter |
| `ODOO_DATABASE` | Odoo db selector | string | non-secret | optional | dev/staging/prod | runtime | env-override | operator-managed config | ERP Team | on db migration | `odoo_prod` | odoo adapter |
| `ODOO_API_KEY` | Odoo API auth secret | secret | secret | conditional | dev/staging/prod | runtime | env-override, external-ref | secret manager ref | ERP Team + Security | 90 days | `ref:rbp/dev/odoo/ODOO_API_KEY` | odoo adapter |
| `ODOO_USERNAME` / `ODOO_PASSWORD` | Alternative Odoo auth creds | secret | secret | conditional | dev/staging/prod | runtime | env-override, external-ref | secret manager refs | ERP Team + Security | 90 days | `ref:rbp/dev/odoo/ODOO_PASSWORD` | odoo adapter |
| `LENDING_BASE_URL` | Lending API base URL | url | non-secret | yes | all | runtime | env-override, external-ref | service endpoints | Lending Platform Team | on endpoint change | `https://lending-dev.internal` | lending adapter |
| `LENDING_API_KEY` | Lending API key | secret | secret | yes | dev/staging/prod | runtime | env-override, external-ref | secret manager ref | Lending Platform Team + Security | 60-90 days | `ref:rbp/dev/lending/LENDING_API_KEY` | lending adapter |
| `LENDING_API_SECRET` | Lending API secret | secret | secret | yes | dev/staging/prod | runtime | env-override, external-ref | secret manager ref | Lending Platform Team + Security | 60-90 days | `ref:rbp/dev/lending/LENDING_API_SECRET` | lending adapter |
| `MARBLE_BASE_URL` | Marble API base URL | url | non-secret | yes | all | runtime | env-override, external-ref | service endpoints | Risk Engineering | on endpoint change | `https://marble-dev.internal` | marble adapter |
| `MARBLE_API_KEY` | Marble API token | secret | secret | yes | dev/staging/prod | runtime | env-override, external-ref | secret manager ref | Risk Engineering + Security | 60-90 days | `ref:rbp/dev/marble/MARBLE_API_KEY` | marble adapter |
| `N8N_BASE_URL` | n8n API base URL | url | non-secret | yes | all | runtime | env-override, external-ref | service endpoints | Automation Team | on endpoint change | `https://n8n-dev.internal` | n8n adapter/workflows |
| `N8N_API_KEY` | n8n API token | secret | secret | yes | dev/staging/prod | runtime | env-override, external-ref | secret manager ref | Automation Team + Security | 60-90 days | `ref:rbp/dev/n8n/N8N_API_KEY` | n8n adapter/workflows |
| `N8N_WEBHOOK_SIGNING_SECRET` | Verify inbound webhook signatures | secret | secret | conditional | staging/prod | runtime | env-override, external-ref | secret manager ref | Automation Team + Security | 60 days | `ref:rbp/prod/n8n/N8N_WEBHOOK_SIGNING_SECRET` | webhook handlers |
| `DOCSPELL_BASE_URL` | Docspell API base URL | url | non-secret | planned | all | runtime | env-override, external-ref | service endpoints | Document Platform Team | on endpoint change | `https://docspell-dev.internal` | future doc adapter |
| `DOCSPELL_API_TOKEN` | Docspell API secret | secret | secret | planned | dev/staging/prod | runtime | env-override, external-ref | secret manager ref | Document Platform Team + Security | 90 days | `ref:rbp/dev/docspell/DOCSPELL_API_TOKEN` | future doc adapter |
| `METABASE_BASE_URL` | Metabase base URL | url | non-secret | planned | all | runtime | env-override, external-ref | service endpoints | Data Platform Team | on endpoint change | `https://metabase-dev.internal` | analytics embed |
| `METABASE_EMBED_SECRET` | Metabase signed-embed secret | secret | secret | planned | dev/staging/prod | runtime | env-override, external-ref | secret manager ref | Data Platform Team + Security | 60 days | `ref:rbp/dev/metabase/METABASE_EMBED_SECRET` | analytics embed |
| `PLATFORM_INTEGRATION_TIMEOUT_MS` | Default adapter timeout | integer | non-secret | optional | all | runtime | env-override, operator-managed | env overlay | Platform App Team | n/a | `8000` | integration transport |
| `PLATFORM_INTEGRATION_RETRY_COUNT` | Default adapter retries | integer | non-secret | optional | all | runtime | env-override, operator-managed | env overlay | Platform App Team | n/a | `2` | integration transport |
| `PLATFORM_INTEGRATION_DEBUG` | Verbose adapter logs toggle | boolean | non-secret | optional | local/dev | runtime | local-only, env-override | env overlay | Platform App Team | n/a | `true` | adapter debugging |
| `FEATURE_PREVIEW_ENABLED` | Allow preview/simulation APIs | boolean | non-secret | optional | dev/staging | runtime | env-override, operator-managed | operator config | Platform Ops | n/a | `true` | admin feature preview |
| `AUDIT_SINK` | Audit event sink selector | string | non-secret | optional | all | runtime | env-override, external-ref | env overlay | Platform Ops | on sink change | `firestore` | audit pipeline |
| `NOTIFICATION_SINK` | Notification delivery backend selector | string | non-secret | optional | all | runtime | env-override | operator config | Platform Ops | n/a | `platform_default` | notifications |
| `LOGGING_DESTINATION` | Structured logging destination key | string | non-secret | yes | all | runtime | env-override, external-ref | env overlay | Platform SRE | on sink change | `gcp-logging-dev` | observability |
| `MONITORING_DESTINATION` | Monitoring workspace/endpoint key | string | non-secret | yes | all | runtime | env-override, external-ref | env overlay | Platform SRE | on sink change | `gcp-monitoring-dev` | observability |
| `ALERTING_TARGET_REF` | Alert routing target reference | string | non-secret | yes | dev/staging/prod | runtime | env-override, operator-managed | env overlay / alert system | Platform SRE | on on-call change | `pagerduty:rbp-prod-primary` | incident response |

## Notes

- For keys with `/` in name (e.g., `ODOO_USERNAME / ODOO_PASSWORD`), both keys are distinct environment entries.
- “planned” means contract is reserved now even if runtime integration may still be staged later.
