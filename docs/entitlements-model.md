# Priority 2 Entitlement and Access Model

## Membership model

Core types live in `src/lib/definitions.ts` and `src/lib/entitlements.ts`:

- `MembershipTier`: `basic | standard | premium`
- `BillingCycle`: `free | monthly | annual`
- `MembershipPlanCode`:
  - `basic_free`
  - `standard_monthly`
  - `standard_annual`
  - `premium_monthly`
  - `premium_annual`

`MembershipPlan` now separates tier entitlement from billing cycle and keeps Square mapping fields.

## Feature entitlement matrix

`ENTITLEMENT_MATRIX` in `src/lib/entitlements.ts` is the source of truth for:

- DocShare access (templates, guides, suites, end-to-end, tools level)
- Partner offers (top vs exclusive)
- Support and service benefits
- Customisation quotas
- Service discount percentages

## Effective entitlement evaluation flow

1. Resolve base membership tier from active subscription/plan/user profile.
2. Load active `membership_access_grants` for the user.
3. Apply highest active grant tier (never downgrade users).
4. Resolve feature access and content-level access using matrix helpers.

Main helper functions:

- `getEffectiveMembershipTier`
- `getEntitlementContextForUser`
- `hasFeatureAccess`
- `getFeatureValue`
- `canAccessContent`
- `getServiceDiscountPercent`
- `getCustomisationRequestAllowance`
- `canSubmitCustomisationRequest`
- `canBookDiscoveryCall`
- `canBookStrategicCheckup`
- `canAccessImplementationSupport`

## Promotion-ready grants model

Collection: `membership_access_grants`

Minimum fields:

- `userId`
- `sourceType`
- `sourceReferenceId`
- `grantTier`
- `grantStartAt`
- `grantEndAt`
- `status`
- `createdAt`
- `updatedAt`
- `notes` (optional)

This supports temporary grants such as 3 months of Standard after qualifying service purchases.

## Content access metadata

Content/resource models now support structured metadata via `EntitlementAccessFields`:

- `accessTier`
- `requiresLogin`
- `requiresMembership`
- `previewEnabled`
- `isLimitedAccess`
- `contentType`

DocShare sections are normalized through `getAccessMetadataForDocuShareSection`.
