# Priority 11: Square lifecycle, pricing, and promotions

## Plan model

Supported `MembershipPlanCode` values are:

- `basic_free` (tier `basic`, cycle `free`, amount `0`)
- `standard_monthly` (tier `standard`, cycle `monthly`, amount `99`)
- `standard_annual` (tier `standard`, cycle `annual`, amount `999`)
- `premium_monthly` (tier `premium`, cycle `monthly`, amount `499`)
- `premium_annual` (tier `premium`, cycle `annual`, amount `4999`)

Tier and billing cycle remain separate identities so annual/monthly variants map to the same entitlement tier while preserving lifecycle and pricing visibility.

## Square lifecycle model

- Webhook entrypoint remains `/api/square/webhooks` and signature verification remains mandatory.
- Event idempotency remains enforced by `square_webhook_events/{eventId}`.
- `src/lib/billing.ts` now delegates membership synchronization to `src/lib/membership-lifecycle.ts`.
- Lifecycle transitions normalize into stable internal classes:
  - `subscription_created`
  - `subscription_updated`
  - `subscription_canceled`
  - `subscription_reactivated`
  - `subscription_expired`
  - `payment_succeeded`
  - `payment_failed`
- Sync writes are centralized into:
  - `subscriptions`
  - `users`
  - `billing_history`
  - `membership_history`
- Failed-payment transitions emit member/admin alerts and analytics/audit events.

## Promotion model

Baseline promotion architecture now includes:

- `promotions` collection for promotion tracking records (type/status/rules/expiry metadata)
- `membership_access_grants` for user-level temporary access grants
- grant expiry processor (`expirePromotionalGrants`) that transitions stale grants to `expired`

### Implemented promotion flow: 3 months Standard after qualifying service purchase

- Trigger path: admin completes a qualifying service workflow (`implementation_support` or `customisation`).
- On completion, `grantStandardTrialFromServicePurchase` creates:
  - `membership_access_grants` record with `grantTier=standard`, `sourceType=service_purchase`, 3-month window
  - matching `promotions` tracking record
- Grant issuance is idempotent by `(userId, sourceType, sourceReferenceId, grantTier)`.
- User profile is updated with grant-expiry visibility fields for dashboard/CRM surfacing.

## Annual plan support

Annual Standard and Annual Premium are treated as first-class plan codes in:

- entitlement resolution
- lifecycle sync updates
- dashboard and CRM summary fields

## Operations and extension points

Future promotion variants (referral, seasonal, bundle, limited-time unlock, discount-code driven) can be implemented by adding new promotion records and reusing grant + lifecycle sync patterns.
