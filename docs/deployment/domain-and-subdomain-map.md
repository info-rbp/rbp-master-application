# Domain and subdomain map (Phase A / Step 1)

This file freezes the hostname/path strategy so operations, auth callbacks, and integration allowlists can be configured consistently.

## Canonical external domains

| Surface | Production pattern | Staging pattern | Local pattern | Notes |
|---|---|---|---|---|
| Public application + BFF APIs | `app.rbp.example.com` | `app-stg.rbp.example.com` | `localhost:3000` | Next.js app routes and `/api/*` share this origin. |
| Admin/control-plane UI | `app.rbp.example.com/admin/*` | `app-stg.rbp.example.com/admin/*` | `localhost:3000/admin/*` | Path-based admin in same deployment unit. |
| Auth callback endpoint | `app.rbp.example.com/api/auth/callback` | `app-stg.rbp.example.com/api/auth/callback` | `localhost:3000/api/auth/callback` | Must be explicitly allowlisted in Authentik OIDC client config. |
| Auth logout return | `app.rbp.example.com/login` (or `/`) | `app-stg.rbp.example.com/login` | `localhost:3000/login` | Keep environment-specific post-logout redirect URIs registered. |

> Replace `rbp.example.com` with the final registered apex domain during Step 2 infra execution; keep pattern unchanged.

## Internal service hostnames (non-public)

| Service | Hostname pattern (example) | Exposure |
|---|---|---|
| Authentik | `auth.platform.internal` or `auth.rbp.example.com` | Public auth endpoints required; admin console internal-restricted |
| Odoo | `odoo.platform.internal` | Internal-only to app runtime/network allowlist |
| Lending | `lending.platform.internal` | Internal-only |
| Marble | `marble.platform.internal` | Internal-only |
| n8n | `n8n.platform.internal` | Internal-only (plus narrowly scoped webhook ingress if required) |
| Docspell | `docspell.platform.internal` | Internal-only |
| Metabase | `metabase.platform.internal` | Internal/admin only; embeds signed via app |

## Environment-specific domain templates

| Environment | Public app origin | Engine DNS convention |
|---|---|---|
| Production | `https://app.rbp.example.com` | `https://<service>.platform.internal` or managed vendor DNS |
| Staging | `https://app-stg.rbp.example.com` | `https://<service>-stg.platform.internal` |
| Development | `http://localhost:3000` | local docker hostnames or shared dev service URLs |

## Domain ownership rules

1. Browser users talk to the app domain; they do not call Odoo/Lending/Marble/n8n/Docspell directly.
2. OIDC login uses redirect through Authentik, but callback terminates on app domain.
3. Admin/control-plane remains same origin using `/admin` paths for consistent session/policy enforcement.
4. Internal engines should be on private DNS or network policy restricted endpoints.
5. Any third-party callback/webhook ingress must target dedicated `/api/*` routes on app domain and verify signature/secrets.
