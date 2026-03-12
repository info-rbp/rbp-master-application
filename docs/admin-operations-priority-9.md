# Priority 9 Admin Restructuring and Content Operations

## Admin information architecture

The admin dashboard is now grouped by platform operations domains:

1. Membership
2. Content
3. Services
4. Promotions
5. System

Navigation source-of-truth lives in `src/app/admin/components/admin-navigation.ts`.

## Operational responsibilities

### Membership
- Member administration and CRM history
- Membership plans and Square plan mapping
- Billing visibility and subscription oversight
- Access-control visibility

### Content
- DocShare family operations
- Knowledge Center operations
- Partner Marketplace operations
- Upload-to-page flow controls (slug, summary, metadata, publish/access alignment)

### Services
- Discovery call queue operations
- Strategic check-up queue operations
- Support request queue operations
- Customisation request queue operations

### Promotions
- Free membership offers
- Discount code constructs
- Service purchase promotions
- Annual plan promotions

### System
- Admin users
- Roles and permissions visibility
- Settings and module links
- Notifications, analytics, audit logs
- Email and automation log visibility

## Security and access

- All added service and promotion operations are server-verified via `requireAdminServerContext`.
- Promotion data is stored in `admin_promotions`, which remains admin-only in Firestore rules.
- Roles remain anchored in `roles_admin`; no insecure client-side role editor was added.

## Upload-to-page and publishing alignment

Use the **Content Operations** route (`/admin/content-operations`) to coordinate:
- title/slug/summary quality
- access-tier alignment with entitlement controls
- published/active visibility behavior
- related content linking and metadata expectations

This route links to existing content managers so admins can manage page-capable content without code edits.
