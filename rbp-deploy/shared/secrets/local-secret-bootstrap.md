# Local secret bootstrap

This defines how developers run locally without committing secrets.

## Goal

Produce a local `.env.local` (or equivalent runtime injection file) from secret references and safe defaults.

## Inputs

- `rbp-deploy/.env.example`
- `rbp-deploy/envs/local/config-contract.yaml`
- access to approved local/dev secret manager namespace

## Procedure

1. Copy `.env.example` to local runtime file outside git tracking (`.env.local`).
2. Replace `*_REF` entries by fetching values from allowed local/dev secret namespace.
3. Keep non-secret environment-provided values from local config contract.
4. Set `LOCAL_AUTH_ENABLED=true` only for local workflows.
5. Start app and validate:
   - `/login`
   - `/api/session`
   - admin path access policy behavior

## Rules

- Do not commit `.env.local`.
- Do not paste raw secret values into tickets/PRs.
- Rotate local/dev credentials immediately if leaked.

## Minimum local secret set

- `AUTHENTIK_CLIENT_SECRET` (if local IdP flow enabled)
- `SESSION_SECRET`
- adapter API keys only when testing live integrations
