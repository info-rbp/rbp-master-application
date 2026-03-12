# Member Dashboard Operations Hub

## Information architecture

The member dashboard is now an operations hub under `/portal` (with `/dashboard` redirecting to `/portal`):

- Overview
- Membership
- Subscription
- Customisation Requests
- Support Requests
- Discovery Calls
- Saved & Recent

This removes the old portal-as-library behavior. Content discovery remains in public catalogue surfaces (DocShare, Knowledge Center, Partner Offers, Services).

## Data model extensions

This phase adds/standardizes member-owned collections:

- `customisation_requests`
- `support_requests`
- `discovery_calls`
- `user_saved_items`
- `user_recent_activity`

Each record stores `memberId` and lifecycle timestamps, with member-only visibility and admin management support.

## Membership and billing integration

The dashboard derives tier and benefits from the entitlement model and existing Square subscription structures.

- No Stripe terminology or Stripe objects are used.
- Billing details are shaped from `subscriptions` and `billing_history` where available.

## Request workflow model

- Customisation requests: entitlement-enforced server-side (Basic none, Standard 1/month, Premium unlimited).
- Support requests: implementation support remains Premium-only and is enforced server-side.
- Discovery calls: discovery call requests are enabled by tier; strategic check-ups are Premium-only.

## Saved / recent layer

Saved resources point back to public detail pages (`itemPath`).
Recent activity records member interactions and request context without rebuilding a private content library.

## Future extension points

- richer booking integrations
- expanded analytics/reporting on member operation events
- personalized dashboard recommendations based on `user_recent_activity`
