# Shared networking conventions

## Boundary model

- Public edge: `rbp-master-application` and required auth endpoints.
- Internal services: Odoo, Lending, Marble, n8n, Docspell, Metabase.
- Control-plane/admin: app-hosted but policy-restricted (`/admin`, `/api/admin`).

## Ingress policy baseline

- Public ingress only for explicitly approved endpoints.
- Internal services should default deny public ingress.
- Webhook ingress must be minimal and signature-verified.

## Egress policy baseline

- App runtime can call approved upstream services only.
- Deny unknown egress destinations by default where platform supports it.
- Maintain explicit allowlist per environment.

## DNS convention

- Public app domains: `app.<domain>` or `app-<env>.<domain>`.
- Internal engine domains: `<service>.platform.internal` or env-prefixed equivalent.

## Firewall / allowlist expectations

- Document required source CIDRs/service identities before production promotion.
- Validate auth callback and webhook paths after every domain change.
