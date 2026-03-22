# Remote Business Partner Platform Core

This repository now includes **Step 2 of the platform core**: a backend-managed auth/session/tenant foundation designed for a multi-tenant platform that will later integrate systems such as Authentik, Odoo, Frappe Lending, Marble, Chaskiq, Metabase, Docspell, EasyAppointments, and others.

## What was added

- Authentik OIDC login/callback/logout integration with PKCE and issuer discovery.
- Secure backend-managed session brokering using encrypted HttpOnly cookies.
- Canonical platform session contract with user, tenant, workspace, roles, permissions, modules, navigation, and security context.
- Tenant switching endpoint that recomputes session state.
- Shared permission resolution and module access evaluation services.
- Frontend session provider, protected route handling, tenant switcher, and session-aware admin shell.
- Local development fallback auth/bootstrap data when Authentik is not configured.
- Platform core tests for session, permission, module, route, navigation, and tenant switching behavior.

## Key environment variables

### Required for production Authentik OIDC

- `AUTHENTIK_ISSUER_URL`
- `AUTHENTIK_CLIENT_ID`
- `AUTHENTIK_CLIENT_SECRET`
- `AUTHENTIK_REDIRECT_URI`
- `AUTHENTIK_POST_LOGOUT_REDIRECT_URI`
- `SESSION_SECRET`
- `APP_BASE_URL`
- `API_BASE_URL`
- `NODE_ENV`

### Optional for local development fallback

- `LOCAL_AUTH_ENABLED=true`

If Authentik values are missing, local auth is enabled automatically outside production.

## Local development strategy

When Authentik is not configured, the app uses a replaceable bootstrap layer in `src/lib/platform/bootstrap.ts`.

Seeded local users:

- `admin@rbp.local`
- `member@rbp.local`

Local password for both:

- `password123!`

This local strategy exists only to keep development runnable without blocking the real Authentik-backed implementation.

## Running the platform core

```bash
npm install
npm run dev
```

Open `/login`.

- If Authentik is configured, click **Continue with Authentik**.
- If local auth is enabled, sign in with one of the seeded users above.

## Core API endpoints

- `GET /api/session`
- `POST /api/session/switch-tenant`
- `GET /api/session/modules`
- `GET /api/session/navigation`
- `GET /api/auth/login`
- `GET /api/auth/callback`
- `POST /api/auth/logout`

## Architecture notes

### Shared contracts

Canonical auth/session/tenant/platform types live in:

- `src/lib/platform/types.ts`

### Core backend services

- `src/lib/platform/auth/authentik.ts` – OIDC discovery, authorization URL creation, code exchange, refresh, logout URL, token validation.
- `src/lib/platform/auth/local.ts` – local development fallback authenticator.
- `src/lib/platform/bootstrap.ts` – replaceable bootstrap data for tenants, workspaces, roles, module registry inputs, and seeded principals.
- `src/lib/platform/permissions.ts` – canonical permission resolution and `can`-style checks.
- `src/lib/platform/modules.ts` – module access evaluation and navigation construction.
- `src/lib/platform/session.ts` – persisted session creation, hydration, switching, cookie-backed restoration, and session response generation.
- `src/lib/platform/route-access.ts` / `src/lib/platform/server-guards.ts` – centralized route access metadata and guard evaluation.

### Frontend integration

- `src/app/providers/platform-session-provider.tsx` – app bootstrap for `/api/session`.
- `src/components/platform/tenant-switcher.tsx` – tenant switcher UI.
- `src/components/platform/auth-guard.tsx` – client-side access helper.
- `src/app/admin/components/sidebar.tsx` – session-aware admin nav and logout.


## Step 3 navigation registry

The frontend navigation is now driven from the platform registry and route metadata instead of hardcoded layout arrays. See `docs/module-registry-navigation.md` for how modules, routes, access evaluation, and navigation builders work together.

## Step 4 platform adapters

The platform now includes a dedicated integration layer for Odoo, Frappe Lending, Marble, and n8n under `src/lib/platform/integrations/*` and `src/lib/platform/adapters/*`. Use `getPlatformAdapter()` / `getPlatformAdapters()` from `src/lib/platform/adapters/factory.ts` in server-side services so source-specific auth, retries, timeouts, tracing, error mapping, and mock-mode fallbacks stay centralized. Detailed setup and extension guidance lives in `docs/platform-adapters.md`.

## Tests

Run:

```bash
npm run test:platform
```

Coverage currently includes:

- unauthenticated session response
- authenticated session response
- allowed tenant switching
- rejected tenant switching
- permission aggregation across multiple roles
- module access evaluation
- navigation generation
- route protection decisions
- access-denied decisions

## Production hardening notes

Before going live, the next phase should add:

- persistent storage for principals, tenants, workspaces, and role assignments
- CSRF enforcement for cookie-mutating endpoints
- provider-backed user provisioning and tenant assignment sync
- stronger audit logging around login, logout, refresh, and tenant switching events
- richer workspace-level restrictions and policy conditions
- integration of the new session core into remaining legacy Firebase-auth pages
