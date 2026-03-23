# Platform BFF layer

This repository now includes the first Backend-for-Frontend layer for platform workspaces.

## Endpoints

- `GET /api/session`
- `POST /api/session/switch-tenant`
- `GET /api/dashboard`
- `GET /api/dashboard/summary`
- `GET /api/customers/:id/360`
- `GET /api/applications/:id`
- `GET /api/loans/:id`
- `GET /api/tasks`
- `GET /api/tasks/summary`
- `POST /api/tasks/:id/actions/:action`
- `GET /api/notifications`
- `POST /api/notifications/:id/read`
- `POST /api/notifications/mark-all-read`

## Structure

- DTOs live in `src/lib/bff/dto`.
- Endpoint orchestration services live in `src/lib/bff/services`.
- Shared request-context, access, and response helpers live in `src/lib/bff/utils`.
- Route handlers stay thin in `src/app/api/**/route.ts` and delegate to BFF services.

## How it works

1. Each route creates a correlation ID from `x-correlation-id` or generates one.
2. `getBffRequestContext` resolves the authenticated session from the Step 2 platform session core.
3. Services enforce module access and permissions with the Step 3 module/permission model.
4. Services call the Step 4 adapter registry for Odoo, Lending, Marble, and n8n.
5. Services map upstream models into stable, UI-ready DTOs and canonical statuses.
6. Non-critical upstream failures are converted into `warnings[]` and `meta.degraded = true`.

## Adding a new BFF endpoint

1. Add or extend a DTO in `src/lib/bff/dto`.
2. Create a dedicated orchestration service in `src/lib/bff/services`.
3. Reuse `getBffRequestContext`, `requireModule`, and `requirePermission`.
4. Keep route handlers thin and return the standard envelope from `src/lib/bff/utils/http.ts`.
5. Add tests covering access, shape, and degraded behavior.

## Access enforcement

All protected BFF endpoints enforce:

- authenticated platform session
- active tenant context
- module availability in the current tenant/workspace
- permission grants in the current context

## Partial failures

Dashboard, customer 360, application, and loan workspaces allow non-critical adapter failures to degrade gracefully. Those failures are surfaced as warnings and the response metadata is marked degraded.
