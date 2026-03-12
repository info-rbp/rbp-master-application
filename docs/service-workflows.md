# Priority 10 Service Workflows

This phase standardizes service operations around a unified workflow model implemented in `src/lib/service-workflows.ts`.

## Workflow types

- `customisation`
- `implementation_support`
- `discovery_call`
- `strategic_checkup`

Collections remain operationally separated (`customisation_requests`, `support_requests`, `discovery_calls`) while sharing a consistent typed payload with `workflowType`.

## Status and priority model

Shared statuses:

- `submitted`
- `under_review`
- `assigned`
- `in_progress`
- `awaiting_member`
- `completed`
- `cancelled`

Shared priorities:

- `low`
- `normal`
- `high`
- `urgent`

## Entitlement enforcement

Server-side checks are enforced in workflow creation handlers:

- Basic: discovery calls only.
- Standard: discovery calls + 1 customisation request per month.
- Premium: unlimited customisation, implementation support, strategic check-ups.

Monthly standard limits are enforced via `periodKey` plus backward-compatible created-at fallback checks.

## Visibility and operations

- Members can only list their own workflow records.
- Admins can manage all queues via `/admin/services/*` pages.
- Admin updates support assignment, status/priority changes, member-visible updates, and internal notes.

## Audit and analytics

- Member submission events are logged through `safeLogAnalyticsEvent`.
- Admin status updates are logged to audit (`logAuditEvent`) and analytics.

## Future hook points

Future SLA/reporting upgrades should query by:

- `workflowType`
- `status`
- `priority`
- `assignedAdminId`
- `periodKey` (for monthly usage)
