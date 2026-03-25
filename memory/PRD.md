# Remote Business Partner Platform - PRD

## Milestone 2: Identity + Commercial Core

### What Was Implemented

#### A. Identity & Tenancy Persistence (Firestore-backed)
- Firestore-backed repositories for principals, tenants, workspaces, role assignments, tenant memberships
- Audit event persistence repository
- Seed service to populate Firestore from bootstrap data
- All collections use `platform_` prefix convention

#### B. Auth/Session Hardening
- CSRF double-submit cookie protection for cookie-mutating POST endpoints
- Comprehensive audit logging across all auth events (login, callback, logout, tenant-switch)
- Fixed missing import in switch-tenant route
- Preserved local auth fallback for development

#### C. Odoo Commercial Bridge
- Platform-owned DTOs for customer summary/detail, invoice summary/detail, entitlement bridge
- Commercial BFF service that normalizes Odoo data into clean contracts
- BFF API routes: GET /api/commercial/customers, customers/:id, invoices, invoices/:id
- No raw Odoo payloads leak into frontend contracts

#### D. Tests
- 27 tests across 5 suites, all passing
- Identity persistence contracts, auth hardening, CSRF, Odoo DTO mappings, BFF contracts, collection naming

### Architecture Preserved
- `rbp-master-application` remains web app + BFF + control-plane
- Authentik remains identity source of truth
- Odoo remains ERP/commercial source of truth
- Platform owns session projection, tenant/workspace context, orchestration
- No raw Odoo payloads in frontend contracts

### Firestore Collections
- `platform_principals` - User identity projections
- `platform_tenants` - Tenant records
- `platform_workspaces` - Workspace records
- `platform_roles` - Role definitions
- `platform_role_assignments` - Role-to-principal assignments
- `platform_tenant_memberships` - Principal-to-tenant memberships
- `platform_audit_events` - Auth/session audit trail

### Files Changed/Created
See implementation summary for complete file list.

### Next Tasks (Later Milestones)
- Wire session.ts to read from Firestore persistence (currently uses bootstrap with persistence as projection)
- Provider-backed user provisioning sync from Authentik
- Workspace-level restrictions and policy conditions
- Integration of session core into remaining legacy Firebase-auth pages
- Lending, Marble, Docspell, n8n integrations
