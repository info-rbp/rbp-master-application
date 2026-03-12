# Priority 6: Paywall and Protected Actions

## Paywall state model

Protected action responses now resolve into one of these states:

- `allowed`
- `requiresLogin`
- `requiresMembership`
- `requiresUpgrade`
- `limitedAccess`
- `denied`

These are returned from `evaluateProtectedAction` in `src/lib/protected-actions.ts` and rendered through a shared UI block (`ProtectedActionCTA`).

## Protected action architecture

- All action checks run through server code in `src/lib/protected-actions.ts`.
- Browser UI calls `POST /api/protected-actions/evaluate`.
- DocShare asset delivery uses `GET /api/protected-actions/deliver?slug=...` which enforces entitlement checks before redirecting.

## Return-to-origin auth flow

- Gated action prompts include sign-in and sign-up links carrying a sanitized `returnTo` query string.
- Login and signup pages resolve the post-auth destination through `src/lib/return-path.ts`.
- Redirect targets are constrained to internal app-relative paths to avoid open redirects.

## Secure resource delivery approach

- Public pages no longer directly render a trusted protected file URL button.
- Gated DocShare actions route through `/api/protected-actions/deliver`.
- The deliver endpoint re-evaluates entitlement server-side and only then redirects to the resource target.

## Analytics hooks

`evaluateProtectedAction` emits baseline `resource_downloaded` events for successful resource actions and includes decision metadata to support downstream conversion analysis expansion.
