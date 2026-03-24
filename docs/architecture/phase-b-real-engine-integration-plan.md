# Phase B Real Engine Integration Plan (`rbp-master-application`)

## 1. Current repository state

- The repo is already a **single deployable Next.js runtime** with web UX + BFF APIs + control-plane behavior (not a frontend-only shell), consistent with deployment docs and current API/BFF footprint.
- Step 2 platform-core auth/session is implemented: Authentik OIDC login/callback/logout, PKCE, encrypted HttpOnly session cookies, tenant switch, permissions/modules/navigation derivation, and local fallback auth.
- Platform boundaries are already documented and largely respected:
  - Authentik = identity truth
  - Odoo = ERP/commercial truth
  - Lending = loan lifecycle truth
  - Marble = risk/decision truth
  - n8n = automation execution truth
  - Docspell = document ingest metadata truth (planned)
  - Metabase = analytics presentation truth (planned)
  - Platform = experience composition + policy + orchestration state
- Integration foundation is in place:
  - adapter runtime env config (`live|mock|disabled`)
  - adapter factory and typed adapter interfaces
  - base HTTP/retry/error/tracing envelope
  - BFF services that normalize statuses and output canonical DTOs
  - graceful degradation warnings when optional dependencies fail
- Existing composite BFF patterns (Dashboard, Customer360, Application detail, Loan detail, Task Inbox) prove that cross-engine composition through canonical contracts is established.
- Control-plane persistence exists for feature flags/module controls (Firestore repository), but identity/tenancy persistence still depends on bootstrap seeds and workflow persistence is currently file-backed JSON.

## 2. Architectural constraints that must not be violated

1. Keep `rbp-master-application` as unified deployable app + BFF + control-plane runtime.
2. Do not host external engines in this repo.
3. No browser-direct API calls to Odoo/Lending/Marble/n8n/Docspell; only BFF-mediated access (except OIDC redirects and approved signed embeds).
4. Never leak raw engine payloads to frontend contracts.
5. Preserve source-of-truth ownership exactly as documented.
6. Extend existing adapter framework; do not fork alternate integration styles.
7. Extend current session/permission/module/route-policy model; do not create competing auth stack.
8. Add/maintain tests per milestone.

## 3. Cross-milestone design principles

- **Canonical DTO discipline**: define DTOs in `src/lib/bff/dto/**` and map via adapter mappers; include `sourceRefs` and normalized status categories.
- **Adapter uniformity**: all engines conform to `PlatformAdapter` + source envelope + shared error taxonomy + tracing headers + health + capability discovery + mode controls.
- **BFF-only orchestration**: UI consumes `/api/**` contracts only.
- **Explicit degradation**: each composite response includes structured warnings `{code,message,sourceSystem,retryable}` and partial sections remain usable.
- **Control-plane persistence**: Firestore for platform-owned state (principals projections, tenant/workspace metadata, assignments, workflow state, dashboard registry, audit).
- **Correlation-first observability**: `x-correlation-id` propagated end-to-end in adapters, workflows, audit entries, and response metadata.
- **Feature-gated rollout**: Docspell/Metabase modules default off in production until registry/access policy/smoke tests pass.

## 4. Milestone 1 implementation blueprint

### Objective
Create one governance model so all seven engines follow the same ownership, mapping, adapter, and operational patterns.

### What already exists
- Source-of-truth docs and service inventory docs.
- Typed integration envelopes and adapter interfaces.
- Runtime adapter config with `live/mock/disabled`.

### What is missing
- A repository-local canonical ownership matrix down to entity-level IDs, cache behavior, and outage behavior.
- Base adapter contract extensions for idempotency, capability metadata, and policy-driven fallback.
- Unified degradation/criticality table used by BFF services and runtime health.

### Implementation tasks
1. Add `docs/architecture/integration-governance.md` with:
   - entity ownership matrix (system of record, write owner, projection, fallback)
   - engine criticality classes (`critical`, `important`, `optional`)
   - canonical correlation and source-ref rules.
2. Extend `src/lib/platform/integrations/types.ts`:
   - add `sourceSystem` support for `docspell|metabase|authentik|platform` in references.
   - add canonical `IntegrationWarning` type used by DTOs.
3. Add `src/lib/platform/integrations/policy.ts`:
   - operation classes (read/list/detail/write/trigger/embed)
   - timeout/retry/idempotency defaults per engine.
4. Add `src/lib/platform/integrations/capabilities.ts`:
   - capability registry backing adapter `getCapabilities()` with version and rollout metadata.
5. Add governance tests validating config and fallback policy matrix.

### File targets
- Extend: `src/lib/platform/integrations/types.ts`, `src/lib/platform/integrations/config.ts`, `src/lib/platform/adapters/base/types.ts`, `src/lib/bff/services/shared.ts`
- Add: `docs/architecture/integration-governance.md`, `src/lib/platform/integrations/policy.ts`, `tests/unit/platform/integration-governance.test.ts`

### DTO/API contracts
- New shared warning contract:
  ```ts
  type IntegrationWarning = {
    code: string;
    message: string;
    sourceSystem: string;
    retryable: boolean;
    criticality: 'critical'|'important'|'optional';
  };
  ```

### Data model changes
- Control-plane collection `runtime/integration_policy` for per-environment overrides (timeouts, kill-switches, degraded-mode toggles).

### Tests
- Governance schema validation test.
- Adapter capability contract test.

### Docs to update
- `docs/deployment/system-responsibility-matrix.md`
- new `docs/architecture/integration-governance.md`

### Exit criteria
- No ambiguous owner for any critical domain entity.
- Every adapter advertises mode/capabilities and follows common policy defaults.

## 5. Milestone 2 implementation blueprint

### Objective
Productionize identity + tenancy persistence and complete commercial core integration through Odoo-backed canonical BFF contracts.

### What already exists
- Authentik OIDC login/callback/logout flows.
- Session cookie, token refresh, tenant switching, permission/module derivation.
- Bootstrap principals/tenants/workspaces/roles and local fallback auth.
- Odoo adapter and commercial DTO mappings for customers/invoices/tickets.

### What is missing
- Persistent principal/tenant/workspace/role-assignment storage (Firestore).
- CSRF enforcement for cookie-mutating routes.
- provisioning sync from Authentik claims/groups to persistent identity model.
- stronger auth/session audit events.
- explicit integration path for remaining legacy firebase-auth pages.

### Implementation tasks
1. Introduce identity repository layer:
   - `src/lib/platform/identity/repository.ts`
   - `src/lib/platform/identity/firestore-repository.ts`
   - `src/lib/platform/identity/service.ts`
2. Replace bootstrap-only identity resolution path in auth callback/session build:
   - resolve principal from Firestore; fallback to bootstrap only in local mode.
3. Add Authentik provisioning sync service:
   - maps groups/claims -> role assignments + tenant memberships.
4. CSRF middleware/helper:
   - issue anti-CSRF token for session-authenticated clients
   - validate on `POST /api/auth/logout`, `POST /api/session/switch-tenant`, and mutable admin routes.
5. Audit hardening:
   - record login success/failure, logout, refresh, tenant switch with correlation IDs.
6. Odoo entitlement bridge:
   - Firestore projection `customer_access_bindings` linking Odoo company/customer state to platform tenant/workspace/module entitlements.
7. Route migration plan for legacy Firebase-auth pages:
   - add compatibility gate that hydrates platform session server-side and rejects direct Firebase auth-only assumptions.

### File targets
- Extend: `src/lib/platform/session.ts`, `src/lib/platform/auth/authentik.ts`, `src/app/api/auth/*`, `src/app/api/session/*`, `src/lib/platform/server-guards.ts`, `src/lib/platform/bootstrap.ts` (local-only boundary)
- Add: `src/lib/platform/identity/**`, `src/lib/platform/security/csrf.ts`, `src/lib/platform/audit/auth-audit.ts`, `src/lib/bff/services/commercial-bff-service.ts`, `src/app/api/commercial/**`
- Do not touch boundary intent files except additive clarifications: `docs/deployment/*` ownership docs.

### DTO/API contracts
- `/api/commercial/customers`, `/api/commercial/invoices`, `/api/commercial/tickets`
- stable DTOs include normalized status + source refs + entitlement summary.

### Data model changes
- Firestore collections:
  - `platform_identity/principals/{principalId}`
  - `platform_identity/tenants/{tenantId}`
  - `platform_identity/workspaces/{workspaceId}`
  - `platform_identity/role_assignments/{assignmentId}`
  - `platform_identity/tenant_memberships/{membershipId}`
  - `platform_identity/session_audit/{eventId}`
  - `platform_control_plane/module_controls/*` (existing, reused)

### Tests
- Auth callback -> persistent principal sync.
- Session refresh path + token expiry behavior.
- CSRF reject/accept tests for cookie-mutating endpoints.
- Odoo mapping and entitlement bridge tests.

### Docs to update
- README “production hardening notes” closure items.
- new `docs/architecture/identity-tenancy-model.md`.

### Exit criteria
- Authentik user can sign in to persistent platform session with stable tenant/workspace context.
- Odoo commercial contracts available through canonical BFF endpoints only.

## 6. Milestone 3 implementation blueprint

### Objective
Integrate Lending + Marble as first-class engines with canonical surfaces for applications/loans/risk/cases.

### What already exists
- Lending and Marble adapters (live/mock/disabled).
- BFF Application and Loan detail services + risk/degradation behavior.
- Workflow service uses Lending + Marble + n8n for submission flow.

### What is missing
- Explicit cross-engine correlation registry (Odoo customer ↔ Lending borrower/application ↔ Marble subject/case).
- richer canonical DTOs for repayment timelines, case history, decision events.
- standardized not-found/access-denied mapping across engines.

### Implementation tasks
1. Add correlation service:
   - `src/lib/platform/correlation/entity-correlation-service.ts` with Firestore-backed references.
2. Extend Lending DTO coverage:
   - borrower summary, repayment schedule summary, lifecycle timeline events.
3. Extend Marble DTO coverage:
   - decision submission status, case queue/owner/resolution, async decision correlation.
4. Add BFF routes:
   - `/api/applications/:id/timeline`
   - `/api/loans/:id/workspace`
   - `/api/risk/subjects/:subjectId`
5. Normalize failures:
   - map upstream 404/403 to BFF `not_found|access_denied` consistently.
6. Webhook intake (if Marble async):
   - `/api/webhooks/marble/decision` updates correlation + timeline projection.

### File targets
- Extend: `src/lib/platform/adapters/lending/*`, `src/lib/platform/adapters/marble/*`, `src/lib/bff/services/application-bff-service.ts`, `src/lib/bff/services/loan-bff-service.ts`, `src/lib/bff/utils/status.ts`
- Add: `src/lib/bff/dto/risk-summary.ts`, `src/lib/bff/services/risk-bff-service.ts`, `src/app/api/risk/**`, `src/lib/platform/correlation/**`

### DTO/API contracts
- `ApplicationDetailDto` adds `lifecycleTimeline[]` and `correlationRefs[]`.
- `LoanDetailDto` adds `repaymentScheduleSummary` and `riskPanel`.
- `RiskSubjectDto` with decision history + case summary + escalation guidance.

### Data model changes
- Firestore `platform_correlations/entity_links/{linkId}` with typed links and confidence/source metadata.

### Tests
- mapper tests for Lending/Marble payload variants.
- partial-failure tests (risk down, lending up; lending down, risk up).
- access-denied and not-found contract tests.

### Docs to update
- `docs/architecture/canonical-entity-model.md`
- API contract docs for risk/application/loan routes.

### Exit criteria
- Applications and loans are visible via canonical DTOs.
- Marble decisions/cases are correlated and surfaced without raw schemas.

## 7. Milestone 4 implementation blueprint

### Objective
Add workflow/document spine while preserving ownership boundaries (platform orchestrates; n8n executes; Docspell owns ingest metadata).

### What already exists
- n8n adapter with trigger/status/list capabilities.
- Workflow orchestration services with idempotency and event publishing.
- Workflow APIs and workflow/task hooks.

### What is missing
- persistent workflow store in Firestore (currently JSON file store).
- Docspell adapter and document-center contracts.
- explicit retry/replay policy matrix and operator controls.

### Implementation tasks
1. Replace workflow JSON store with Firestore store implementation:
   - keep interface, swap default provider by env.
2. Add Docspell adapter (live/mock/disabled) in factory/config pattern.
3. Document correlation model:
   - document refs linked to customer/application/loan/workflow IDs.
4. Add workflow operator APIs:
   - retry step, mark acknowledged, add operator note.
5. Add webhook ingestion endpoints:
   - n8n status callbacks and Docspell ingest events.
6. Add Document Center BFF service and APIs.

### File targets
- Extend: `src/lib/platform/integrations/config.ts`, `src/lib/platform/adapters/base/types.ts`, `src/lib/platform/adapters/factory.ts`, `src/lib/workflows/services/*`, `src/lib/workflows/types.ts`
- Add: `src/lib/platform/adapters/docspell/*`, `src/lib/bff/services/document-center-bff-service.ts`, `src/lib/workflows/store/firestore-workflow-store.ts`, `src/app/api/documents/center/route.ts`, `src/app/api/webhooks/n8n/route.ts`, `src/app/api/webhooks/docspell/route.ts`

### DTO/API contracts
- `DocumentCenterDto`: linked entities, ingest status (`uploaded|received|pending|failed`), source refs.
- `WorkflowStatusDto` adds retry metadata, operator notes, failure class.

### Data model changes
- Firestore collections:
  - `platform_workflows/instances/{id}`
  - `platform_workflows/steps/{id}`
  - `platform_workflows/events/{id}`
  - `platform_workflows/idempotency/{key}`
  - `platform_workflows/operator_notes/{id}`
  - `platform_documents/links/{id}`

### Tests
- n8n trigger idempotency and replay tests.
- Docspell mapper tests.
- workflow store parity tests (file-store vs firestore implementation behavior).

### Docs to update
- `docs/architecture/workflow-control-plane.md`
- `docs/architecture/document-integration.md`

### Exit criteria
- Workflow executions are observable/correlated/retriable.
- Document metadata surfaces are canonical and linked to business entities.

## 8. Milestone 5 implementation blueprint

### Objective
Add safe Metabase insight layer with scoped embeds and dashboard governance.

### What already exists
- analytics module controls and dashboard surfaces.
- runtime health checks already include Metabase base URL probing.

### What is missing
- Metabase adapter/embedding abstraction.
- dashboard registry, scoping, and access policy model.
- audit trail for dashboard access.

### Implementation tasks
1. Add Metabase adapter with signed-embed helper (server-side signing key only).
2. Add dashboard registry (Firestore) with tenant/workspace/role scopes and environment flags.
3. Add API to request scoped embed URLs; reject unapproved dashboard IDs.
4. Add admin catalog UI/API for dashboard governance (owner/team, criticality, visibility).
5. Add fallback UX contract when dashboard unavailable.

### File targets
- Extend: `src/lib/platform/integrations/config.ts`, `src/lib/platform/adapters/base/types.ts`, `src/lib/platform/adapters/factory.ts`, `src/lib/bff/services/dashboard-bff-service.ts`
- Add: `src/lib/platform/adapters/metabase/*`, `src/lib/insights/dashboard-registry.ts`, `src/app/api/insights/embed/[dashboardKey]/route.ts`, `src/lib/bff/services/insights-bff-service.ts`

### DTO/API contracts
- `DashboardEmbedDto`: `{dashboardKey, embedUrl, expiresAt, scope}`.
- `DashboardCatalogDto`: approved dashboards with `audienceType` (`internal_admin|ops|executive|customer_safe`).

### Data model changes
- Firestore `platform_insights/dashboards/{dashboardKey}` and `platform_insights/access_audit/{eventId}`.

### Tests
- scope/role enforcement tests.
- signed embed generation tests.
- degraded behavior tests when Metabase down.

### Docs to update
- `docs/architecture/insight-layer.md`
- env var docs for Metabase embedding.

### Exit criteria
- Only approved scoped dashboards can be embedded.
- Analytics layer remains replaceable/non-transactional.

## 9. Milestone 6 implementation blueprint

### Objective
Deliver unified user experiences (Customer 360, Loan Workspace, Back-office Console, Executive/Ops dashboards) from canonical BFF composition.

### What already exists
- `Customer360BffService` composite pattern.
- Dashboard, Application, Loan, Task Inbox canonical contracts.
- warning and normalized status patterns.

### What is missing
- Docspell + workflow + metabase integration into composites.
- canonical task/timeline normalization across all engines.
- explicit back-office and executive composite DTOs.

### Implementation tasks
1. Extend Customer360 composition:
   - include doc metadata and workflow status rollups.
2. Add Loan Workspace service:
   - application + loan + repayment + decision + documents + workflows + next actions.
3. Add Back-office Console service:
   - task inbox + exceptions + engine health context + operator actions.
4. Add Executive/Operations service:
   - KPI rollups + metabase cards + health/warning panels.
5. Standardize timeline/task normalization rules:
   - canonical event types and priority semantics.

### File targets
- Extend: `src/lib/bff/services/customer-360-bff-service.ts`, `src/lib/bff/services/task-inbox-bff-service.ts`, `src/lib/bff/services/dashboard-bff-service.ts`
- Add: `src/lib/bff/services/loan-workspace-bff-service.ts`, `src/lib/bff/services/backoffice-bff-service.ts`, `src/lib/bff/services/executive-bff-service.ts`, `src/lib/bff/dto/loan-workspace.ts`, `src/lib/bff/dto/backoffice-console.ts`, `src/lib/bff/dto/executive-dashboard.ts`, matching `/api/**` routes.

### DTO/API contracts
- `Customer360Dto` v2 includes `documentsSummary`, `workflowSummary`, `engineHealthHints`.
- `LoanWorkspaceDto`, `BackOfficeConsoleDto`, `ExecutiveDashboardDto` new contracts with `warnings[]` and normalized timeline/tasks.

### Data model changes
- optional cached projection docs for expensive composite reads:
  - `platform_views/customer_360_cache/{tenantId}:{customerId}`
  - `platform_views/loan_workspace_cache/{tenantId}:{loanId}`

### Tests
- composite contract tests for each new BFF service.
- partial-failure snapshot tests (optional dependency outages).

### Docs to update
- `docs/architecture/unified-experience-contracts.md`

### Exit criteria
- Key journeys do not require raw engine UIs.
- Composite views remain usable under optional dependency degradation.

## 10. Milestone 7 implementation blueprint

### Objective
Make the integrated platform production survivable.

### What already exists
- shared retry/timeout HTTP client + typed integration errors.
- adapter health checks and runtime health endpoint.
- warning-based degradation in BFF services.

### What is missing
- circuit breaker / kill-switch per engine.
- explicit fail-open/fail-closed policy per endpoint.
- aggregated observability and operational runbooks.

### Implementation tasks
1. Add circuit breaker module per adapter operation class.
2. Add integration kill switches in control-plane (Firestore-backed).
3. Build `/api/health/integrations` with adapter-native checks and policy state.
4. Standardize structured logs:
   - request, adapter call, workflow event, dashboard embed access.
5. Add alerting docs and failure playbooks by engine.
6. Enforce security hardening:
   - CSRF, rate limits for auth/workflow triggers, tighter admin route controls, secret rotation policy.

### File targets
- Extend: `src/lib/platform/integrations/http.ts`, `src/lib/platform/integrations/tracing.ts`, `src/app/api/health/runtime/route.ts`, `src/lib/platform/server-guards.ts`
- Add: `src/lib/platform/integrations/circuit-breaker.ts`, `src/lib/platform/integrations/degradation-policy.ts`, `docs/runbooks/*.md`, `docs/operations/go-live-checklist.md`

### DTO/API contracts
- `IntegrationHealthDto`: per-engine `{status,mode,lastSuccessAt,circuitState,killSwitch}`.

### Data model changes
- Firestore `platform_control_plane/integration_runtime/{engine}` storing breaker/kill-switch overrides.

### Tests
- circuit open/half-open/closed tests.
- fail-open vs fail-closed route behavior tests.
- smoke tests for login, dashboard, customer360, application workflow, loan workspace.

### Docs to update
- runbooks for Authentik/Odoo/Lending/Marble/n8n/Docspell/Metabase outages.

### Exit criteria
- Upstream failures are visible, controlled, and operator-actionable.

## 11. Canonical entity and ownership matrix

| Entity | System of record | Canonical ID format | Platform projection | Write owner | Read strategy | Cache strategy | Upstream outage behavior |
|---|---|---|---|---|---|---|---|
| User | Authentik | `usr_{providerSub}` | principal profile + memberships | Authentik + platform assignment policy | session hydrate + identity repo | short-lived session cache | block login if identity unavailable |
| Tenant | Platform | `ten_{slug}` | tenant policy/config | platform control-plane | direct repo read | config cache 5m | fail-closed for protected routes |
| Workspace | Platform | `wrk_{tenant}_{name}` | workspace config | platform control-plane | direct repo read | config cache 5m | default to tenant context |
| Customer | Odoo | `cust_{odooId}` | customer summary/profile | Odoo | read-through adapter | 2-5m cache optional | show partial view + warning |
| Application | Lending | `app_{lendingId}` | application summary/detail | Lending | read-through + correlation | 1-2m cache optional | fail on detail; partial on aggregates |
| Loan | Lending | `loan_{lendingId}` | loan workspace projection | Lending | read-through + correlation | 1-2m cache optional | fail for loan detail |
| Repayment | Lending | `rep_{loanId}_{n}` | repayment summary | Lending | read-through | no long cache | partial warning on unavailable |
| Decision | Marble | `dec_{marbleId}` | decision panel/history | Marble | read-through + async webhook updates | 1m cache | warning; workflow can continue partially |
| Case | Marble | `case_{marbleId}` | case summary/detail | Marble | read-through | 1m cache | warning/degraded queue panel |
| Document | Docspell | `doc_{docspellId}` | document center metadata | Docspell | read-through + webhook projection | 2-5m cache | warning + pending state |
| Invoice | Odoo | `inv_{odooId}` | billing summary | Odoo | read-through | 2-5m cache | warning; finance widgets degrade |
| Support Ticket | Odoo | `tkt_{odooId}` | support summary | Odoo | read-through | 2-5m cache | warning; support panel partial |
| Workflow Instance | Platform | `wf_{uuid}` | orchestration state | Platform | Firestore direct | n/a | fully available independent of n8n |
| Notification | Platform | `noti_{uuid}` | user notifications | Platform | Firestore direct | n/a | available; may include upstream warning notifications |
| Dashboard Definition | Metabase + Platform registry | `dash_{key}` | dashboard catalog + scoped embeds | Platform registry controls exposure | registry + embed service | short TTL signed URLs | show fallback card if unavailable |
| Audit Event | Platform | `aud_{uuid}` | immutable audit record | Platform | Firestore query | n/a | always persisted if platform healthy |
| Feature Flag/Module Control | Platform | `ff_{key}` / `mod_{key}` | control-plane rule sets | Platform | Firestore | in-memory with ttl | default-safe fallback rules |

## 12. File-by-file change map

### Extend existing files (do extend)
- `src/lib/platform/session.ts`: persistent identity lookup, refresh audit hooks, CSRF token rotation.
- `src/lib/platform/auth/authentik.ts`: provisioning sync helper, claim normalization, logout propagation metadata.
- `src/lib/platform/types.ts`: add persistent identity/workflow/embed support types.
- `src/lib/platform/integrations/config.ts`: docspell/metabase configs + per-engine policies.
- `src/lib/platform/adapters/factory.ts`: include Docspell + Metabase adapters in same runtime pattern.
- `src/lib/platform/adapters/base/*`: add idempotency/circuit context contract.
- `src/lib/bff/services/customer-360-bff-service.ts`: extend composite with doc/workflow/metabase-aware warnings.
- `src/lib/workflows/services/*`: move to Firestore-backed workflow state and operator actions.
- `src/app/api/session/*` and `src/app/api/auth/*`: CSRF + audit + persistent identity usage.

### New files/modules (add)
- `src/lib/platform/identity/**`
- `src/lib/platform/correlation/**`
- `src/lib/platform/adapters/docspell/**`
- `src/lib/platform/adapters/metabase/**`
- `src/lib/workflows/store/firestore-workflow-store.ts`
- `src/lib/insights/dashboard-registry.ts`
- `src/lib/bff/services/loan-workspace-bff-service.ts`
- `src/lib/bff/services/backoffice-bff-service.ts`
- `src/lib/bff/services/executive-bff-service.ts`
- `src/lib/bff/dto/{loan-workspace,backoffice-console,executive-dashboard}.ts`
- `src/app/api/risk/**`, `src/app/api/insights/**`, `src/app/api/webhooks/{marble,n8n,docspell}/**`
- `docs/architecture/*.md`, `docs/runbooks/*.md`

### Stable boundaries (do not rewrite)
- Keep `src/lib/platform/route-access.ts`, `src/lib/platform/server-guards.ts` policy model (extend only).
- Keep adapter factory pattern and mode semantics (extend only).
- Keep canonical DTO approach in `src/lib/bff/dto/**` (additive evolution only).

## 13. Environment variables and secrets map

### Existing core auth/session
- `AUTHENTIK_ISSUER_URL`, `AUTHENTIK_CLIENT_ID`, `AUTHENTIK_CLIENT_SECRET`, `AUTHENTIK_REDIRECT_URI`, `AUTHENTIK_POST_LOGOUT_REDIRECT_URI`
- `SESSION_SECRET`, `APP_BASE_URL`, `API_BASE_URL`, `LOCAL_AUTH_ENABLED`

### Existing engine integration
- Odoo: `ODOO_BASE_URL`, `ODOO_DATABASE`, `ODOO_USERNAME`, `ODOO_PASSWORD`, `ODOO_API_KEY`, timeout/retry vars
- Lending: `LENDING_BASE_URL`, `LENDING_API_KEY`, `LENDING_API_SECRET`, `LENDING_USERNAME`, `LENDING_PASSWORD`, timeout/retry vars
- Marble: `MARBLE_BASE_URL`, `MARBLE_API_KEY`, timeout/retry vars
- n8n: `N8N_BASE_URL`, `N8N_API_KEY`, timeout/retry vars

### New required for Phase B
- Docspell: `DOCSPELL_BASE_URL`, `DOCSPELL_API_TOKEN`, `DOCSPELL_MODE`, `DOCSPELL_TIMEOUT_MS`, `DOCSPELL_RETRY_COUNT`
- Metabase: `METABASE_BASE_URL`, `METABASE_EMBED_SECRET`, `METABASE_MODE`, `METABASE_TIMEOUT_MS`, `METABASE_RETRY_COUNT`
- Platform control-plane:
  - `RBP_IDENTITY_COLLECTION`
  - `RBP_WORKFLOW_COLLECTION`
  - `RBP_DASHBOARD_REGISTRY_COLLECTION`
  - `RBP_INTEGRATION_RUNTIME_COLLECTION`
- Security/ops:
  - `CSRF_SECRET`
  - `PLATFORM_RATE_LIMIT_*`
  - `AUDIT_LOG_SINK` (if forwarding)

### Secret handling defaults
- All secrets in cloud secret manager, not `.env` in production.
- per-env service credentials with least privilege and rotation every 90 days.

## 14. Testing and acceptance plan

### Test layers
1. **Adapter unit tests**: auth headers, mapper correctness, error mapping, retry policy.
2. **DTO mapping tests**: no raw upstream fields leak.
3. **BFF contract tests**: status normalization and warnings.
4. **Auth/session tests**: login/callback/logout/refresh/tenant switch/CSRF.
5. **Workflow tests**: idempotency, retry, partial-completion paths.
6. **Degraded-mode tests**: each engine unavailable scenario.
7. **Integration sandbox tests**: live endpoints against non-prod engines.
8. **Smoke tests**: login -> dashboard -> customer360 -> application submit -> loan workspace -> logout.

### Acceptance criteria by criticality
- Launch-critical (Authentik/Odoo/Lending/Marble): must pass full smoke + contract + outage behavior.
- Important (n8n): workflow failures must not corrupt transactional state.
- Optional (Docspell/Metabase): features behind module flags; outage must not block core journeys.

## 15. Hardening and operational readiness plan

### Resilience matrix
- Authentik: fail-closed for protected pages; local fallback only non-prod.
- Odoo/Lending/Marble: fail-open for aggregate widgets, fail-closed for detail/write operations.
- n8n: fail-open with workflow warning + retry queue.
- Docspell/Metabase: fail-open with hidden/degraded panels.

### Observability
- Structured logs include: `correlationId`, `tenantId`, `workspaceId`, `userId`, `engine`, `operation`, `durationMs`, `result`.
- Adapter health endpoint per engine + aggregate runtime endpoint.
- Audit events for auth, admin controls, workflow actions, dashboard access.

### Playbooks
- Per-engine outage SOP: detection, user impact, temporary toggles, rollback, communication template.
- Go-live checklist:
  - secrets provisioned
  - kill switches tested
  - dashboards scoped
  - webhook signatures validated
  - smoke tests green.

## 16. Ordered delivery roadmap

1. **Phase B.1 Governance + persistence foundation** (M1 + M2 base): entity governance docs, identity repository, CSRF/audit hardening.
2. **Phase B.2 Commercial + lending/risk completion** (M2/M3): Odoo entitlement bridge, correlation service, richer lending/marble contracts.
3. **Phase B.3 Workflow/document spine** (M4): Firestore workflow store, n8n operator controls, Docspell adapter and document center.
4. **Phase B.4 Insight layer** (M5): Metabase adapter, dashboard registry, scoped embeds.
5. **Phase B.5 Unified experiences** (M6): Customer360 v2, Loan Workspace, Back-office Console, Executive dashboards.
6. **Phase B.6 Production hardening and readiness** (M7): circuit breakers, kill switches, playbooks, full smoke and rollout.

## 17. Risks, assumptions, and default decisions

### Key risks
- Correlation drift across Odoo/Lending/Marble identities.
- Upstream schema changes breaking mappers.
- Workflow/event eventual consistency causing stale composite panels.
- Over-broad dashboard embedding leaking unscoped data if governance is weak.

### Assumptions
- Engine teams provide stable non-prod sandboxes and webhook testability.
- Firestore remains approved control-plane persistence store.
- Existing admin/feature-control capabilities remain central and extensible.

### Default decisions
- Prefer additive extension over rewrites.
- Use read-through over bulk replication for transactional domains.
- Cache only projections and composite views, not transactional ownership.
- Feature-flag Docspell/Metabase until smoke + security criteria pass.
