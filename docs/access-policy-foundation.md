# Sprint 3 access policy foundation

Sprint 3 finalises the backend-first access model around four central concepts:

1. **Capabilities** in `src/lib/access/capabilities.ts`
2. **Route policies** in `src/lib/access/route-policies.ts`
3. **Action policies** in `src/lib/access/action-policies.ts`
4. **Sub-features** in `src/lib/access/sub-features.ts`

## Capability naming

Capability keys are stable, platform-shaped, and namespaced by domain.

- module presence and page/view access: `dashboard.view`, `applications.detail.view`
- sub-feature or panel access: `customers.customer360.view`
- privileged mutations: `tasks.assign.execute`, `support.escalate.execute`
- workflow actions: `workflows.review.approve`, `workflows.status.view`
- admin/control plane access: `admin.feature_flags.read`, `admin.module_controls.manage`, `admin.audit.view`

Keep capability names focused on platform semantics rather than upstream vendor names.

## Route policy model

Route policies are the source of truth for significant protected pages and APIs.
Each route policy declares:

- path pattern
- route kind
- module key
- required capabilities
- required module controls / flags
- internal/admin-only behaviour
- access denied behaviour

For new protected pages or APIs:

1. add a route policy entry
2. enforce it in the route handler or page/section guard via `requireRoutePolicyAccess(...)` or `requireSessionForPath(...)`
3. add a test proving unauthenticated/unauthorised access is blocked

Nested route families such as `/admin/system`, `/admin/membership`, `/admin/resources`, `/portal/*`, and `/settings/*` should use section layouts where possible so direct URL access is checked against the specific route policy rather than only a broader parent route.

## Action policy model

Action policies cover sensitive backend operations such as:

- search entry and domain-specific search access
- task list/action execution
- workflow starts and review actions
- workflow status access
- feature-control and module-control mutations
- audit feed access

Server-side services should call `requireActionPolicyAccess(...)` before executing the operation. High-risk actions can audit attempts and denies through policy configuration.

## Sub-feature gating

Sub-features are for controls or panels inside otherwise visible modules, such as:

- customer 360
- internal notes
- finance exports
- workflow manual review tools
- rollout preview

Use `evaluateSubFeatureAccess(...)` or `canSubFeature(...)` for rendering hints, but keep the backend action or API protected separately.

## Deny behaviour

- unauthenticated route/API access returns or redirects to login
- authenticated but unauthorised access returns structured `forbidden` errors for APIs
- pages use `/access-denied` unless the route policy explicitly redirects to login
- internal-only routes remain backend enforced even if hidden in navigation

## Validation

`src/lib/access/validation.ts` validates that route/action/sub-feature definitions only reference known capabilities and modules, and that policy ids / action keys stay unique.

## Current Sprint 3 coverage

The central model now governs the major protected platform surfaces that currently exist in the repo, including:

- protected page roots and significant page families for admin, settings, dashboard, and portal flows
- application, loan, customer-360, search, task, workflow, and audit APIs
- admin feature-controls, resources, and membership management APIs
- sensitive workflow review, task execution, support escalation, document upload, and admin control-plane actions
- independently gated sub-features such as rollout preview, audit history, internal notes, and membership notes

When adding a new protected page/API/action/sub-feature, update the central registry first and extend tests/validation so the inventory remains complete.
