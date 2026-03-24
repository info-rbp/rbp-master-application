# Runbook: auth callback failure

## Symptoms

- `/api/auth/callback` returns errors/redirect loops
- users stuck on login

## Checks

1. Verify callback URL matches environment domain mapping.
2. Verify Authentik client ID/secret references are valid.
3. Verify session secret is present and runtime can decrypt cookies.
4. Inspect recent domain or ingress changes.

## Remediation

- restore known-good callback and secret refs
- redeploy app
- validate login and logout flow
