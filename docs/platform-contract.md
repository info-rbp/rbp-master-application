# Platform Contract v1

This application now defines its long-term integration contract around a **canonical platform model** rather than around any individual source system. The contract is intentionally business-shaped, tenant-aware, relationship-first, and extensible.

## Contract principles

1. **Canonical, not vendor-shaped** — use `customer`, `application`, `loan`, and `sourceRefs[]` instead of source-specific fields such as `odoo_partner_id`.
2. **Source-aware, but source-agnostic** — every entity keeps traceability via `sourceRefs[]`, but the platform contract stays stable.
3. **Tenant-scoped by default** — business records resolve to one `tenantId` and optionally one `workspaceId`.
4. **Extension-friendly** — stable core fields live in the canonical contract, while vendor/domain specifics live in `extensions.{namespace}`.
5. **Relationship-first** — record linkage is first-class through `relationships[]` instead of giant embedded payloads.
6. **Actionable** — the contract is designed to support UX, workflows, notifications, permissions, and audit from the outset.

## Common entity envelope

Every canonical entity inherits the same base wrapper:

```json
{
  "id": "plf_xxxxx",
  "entityType": "customer",
  "tenantId": "ten_xxxxx",
  "workspaceId": "wrk_xxxxx",
  "displayName": "Acme Pty Ltd",
  "status": {
    "category": "active",
    "code": "customer.active",
    "label": "Active"
  },
  "sourceRefs": [
    {
      "system": "odoo",
      "recordType": "res.partner",
      "recordId": "4821",
      "isPrimary": true,
      "lastSyncedAt": "2026-03-22T10:00:00Z"
    }
  ],
  "relationships": [
    {
      "type": "owns",
      "targetEntityType": "accountOrFacility",
      "targetId": "plf_loan_123"
    }
  ],
  "tags": ["vip", "broker-referred"],
  "createdAt": "2026-03-01T09:00:00Z",
  "updatedAt": "2026-03-22T10:00:00Z",
  "createdBy": "usr_123",
  "updatedBy": "usr_456",
  "extensions": {
    "odoo": {},
    "frappeLending": {}
  }
}
```

### Required base fields

- `id`
- `entityType`
- `tenantId`
- `workspaceId` when applicable
- `displayName`
- `status`
- `sourceRefs[]`
- `relationships[]`
- `createdAt`
- `updatedAt`
- `extensions{}`

## Canonical v1 scope

The initial platform contract is intentionally bounded to the following stable entities:

- User
- Person
- Organisation
- Customer
- ProductOrService
- Application
- AccountOrFacility
- Invoice
- Payment
- Document
- Decision
- Task
- TicketOrCase
- Conversation
- Appointment
- KnowledgeItem
- Tenant
- Workspace
- Role
- Session
- NavigationItem
- Notification
- AuditEvent

## Universal core entity guidance

### Core business entities

- **User** — authenticating actor with role assignments and auth-provider references.
- **Person** — human identity separate from access.
- **Organisation** — legal or operational entity.
- **Customer** — commercial relationship abstraction over a person or organisation.
- **ProductOrService** — sellable or deliverable offering.
- **Application** — requested state before approval/activation.
- **AccountOrFacility** — active customer-held arrangement such as a live loan or subscription.
- **Invoice** and **Payment** — billing and settlement objects.
- **Document** — business document with lifecycle, ownership, and classification.
- **Decision** — risk, fraud, AML, credit, or approval outcome.
- **Task** — actionable cross-system work object.
- **TicketOrCase** — support, investigation, or service issue.
- **Conversation** — communication thread.
- **Appointment** — scheduled interaction.
- **KnowledgeItem** — article, guide, wiki, or training content.

### Platform context entities

- **Tenant** — top-level access, branding, module, governance, and compliance boundary.
- **Workspace** — sub-context for a business line, branch, team, or operational area.
- **Role** — permission bundle defined by resource/action/scope/conditions.
- **Session** — frontend bootstrap payload for active user + tenant/workspace context.
- **NavigationItem** — data-driven route/module/action visibility model.
- **Notification** — user-facing event routed through reusable channels.
- **AuditEvent** — immutable append-only record of who did what, where, and with what outcome.

## Domain extensions

Extensions build on top of the canonical core instead of replacing it.

- **Lending** — `Loan`, `RepaymentSchedule`, `RepaymentInstallment`, `Collateral`, `CreditAssessment`
- **Finance** — `Expense`, `JournalReference`, `Refund`, `Subscription`
- **Operations** — `InventoryItem`, `PurchaseOrder`, `WorkOrder`, `Asset`, `FleetVehicle`, `DispatchJob`
- **HR** — `Employee`, `Candidate`, `LeaveRequest`, `Appraisal`, `Referral`
- **Commerce** — `Cart`, `Order`, `Shipment`, `POSSale`

## Tenant and workspace rules

- Every business record resolves to **one `tenantId`**.
- Business records may additionally resolve to **one `workspaceId`**.
- Tenants own enabled modules, feature flags, branding, localisation, compliance settings, billing plan, security policy, and other settings.
- Workspaces provide finer operational boundaries without forcing source-specific shapes into the platform model.

## Role model

Roles are capability bundles, not copies of app-specific roles.

Permission grants follow this shape:

```json
{
  "resource": "loan",
  "actions": ["read", "create", "approve"],
  "scope": "tenant",
  "conditions": {
    "assignedOnly": false,
    "moduleEnabled": true
  }
}
```

Recommended starter role codes:

- `platform.super_admin`
- `tenant.admin`
- `finance.manager`
- `finance.agent`
- `ops.manager`
- `ops.agent`
- `support.manager`
- `support.agent`
- `compliance.analyst`
- `sales.manager`
- `sales.agent`
- `service.coordinator`
- `hr.manager`
- `customer.primary_user`
- `customer.standard_user`
- `partner.broker`
- `viewer`

## Session model

The frontend should receive one resolved session payload rather than assembling user, tenant, workspace, modules, permissions, and flags from multiple systems.

Core session fields:

- `sessionId`
- `user`
- `activeTenant`
- `activeWorkspace`
- `roleAssignments[]`
- `effectivePermissions[]`
- `enabledModules[]`
- `featureFlags{}`
- `navigationProfile`
- `preferences`
- `securityContext`
- `issuedAt`
- `expiresAt`

## Navigation model

Navigation is data-driven, with visibility controlled by:

- enabled modules
- effective permissions
- feature flags
- tenant plan
- workspace context

This avoids hardcoding one frontend forever to one vendor-specific application structure.

## Canonical task, notification, and audit guidance

### Task

- Canonical statuses: `open`, `in_progress`, `waiting_internal`, `waiting_external`, `blocked`, `completed`, `cancelled`
- Canonical priorities: `low`, `normal`, `high`, `urgent`, `critical`
- Task actions stay platform-oriented even if source systems use stranger semantics.

### Notification

- Canonical severities: `info`, `success`, `warning`, `error`, `critical`
- Canonical statuses: `pending`, `delivered`, `read`, `dismissed`, `expired`
- Channels are independent of content: `in_app`, `email`, `sms`, `push`, `chat`

### Audit

- Audit is append-only and universal.
- Categories include authentication, authorisation, data access/change, workflow, compliance, billing, support, system administration, and security.
- Outcomes include `success`, `failure`, `partial`, and `denied`.

## Mapping rules across current integrations

- **Odoo** → Organisation, Customer, ProductOrService, Invoice, Payment, Expense, Subscription, Employee, TicketOrCase, KnowledgeItem
- **Frappe Lending** → Application, AccountOrFacility/Loan, Payment, repayment extensions, Customer
- **Marble** → Decision, TicketOrCase, Task, AuditEvent
- **Chaskiq** → Conversation, Notification, Customer, TicketOrCase
- **Docspell** → Document
- **EasyAppointments** → Appointment
- **Metabase** → dashboard metadata, report references, analytics cards; not operational source-of-truth entities
- **Authentik** → User, Session, role assignment inputs, identity credentials
- **Vaultwarden** → infrastructure concern, not a canonical business entity

## Implementation notes in this repository

- Canonical TypeScript definitions now live in `src/lib/platform-contract.ts`.
- The admin system area exposes the contract as an in-app reference page so the operating model is visible alongside roles, notifications, analytics, and audit.
- Existing app-specific collections can continue to exist, but new integrations should map into this contract instead of extending source-shaped field names across the codebase.
