# Environment naming standard

## Service naming

Use lowercase kebab-case service keys:

- `rbp-master-application`
- `authentik`
- `odoo`
- `lending`
- `marble`
- `n8n`
- `docspell`
- `metabase`

## Environment suffixes

- local: `local`
- development: `dev`
- staging: `stg`
- production: no suffix where applicable

## Domain naming

- app: `app[-<env>].<domain>` (prod uses `app.<domain>`)
- internal engine endpoints: `<service>[-<env>].platform.internal`
- auth callback: `<app-domain>/api/auth/callback`

## Resource naming

- runtime bucket: `rbp-<env>-app-assets`
- document bucket: `rbp-<env>-documents`
- logging namespace: `rbp/<env>/<service>`
- monitoring namespace: `rbp/<env>`

## Firebase/Firestore naming

- Firebase project: `rbp-<env>-firebase` (placeholder pattern)
- GCP project: `rbp-<env>-gcp` (placeholder pattern)
- Firestore database: `(default)` unless explicit multi-db strategy adopted

## Secret naming prefixes

Use path convention:

`rbp/<env>/<service>/<SECRET_KEY>`

Examples:

- `rbp/dev/rbp-master-application/SESSION_SECRET`
- `rbp/prod/marble/MARBLE_API_KEY`
