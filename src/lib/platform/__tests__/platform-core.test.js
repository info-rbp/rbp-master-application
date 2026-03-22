require('ts-node/register/transpile-only');
const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveEffectivePermissions } = require('../../../../.tmp-platform-tests/permissions');
const { evaluateModuleAccess, evaluateEnabledModules } = require('../../../../.tmp-platform-tests/modules');
const { getTenantById, getWorkspacesForTenant } = require('../../../../.tmp-platform-tests/bootstrap');
const { applyTenantSwitch, createPersistedSession, toSessionResponse } = require('../../../../.tmp-platform-tests/session');
const { evaluateRouteAuthorization } = require('../../../../.tmp-platform-tests/server-guards');
const { createNavigationContextFromSession } = require('../../../../.tmp-platform-tests/navigation-context');
const { buildAdminNavigation, buildPublicNavigation, buildWorkspaceNavigation } = require('../../../../.tmp-platform-tests/navigation-builder');
const { getModuleByKey, getAllModules } = require('../../../../.tmp-platform-tests/module-registry');
const { canAccessRoute, getDefaultLandingRoute, getRouteDefinition } = require('../../../../.tmp-platform-tests/route-access');

const principal = {
  user: {
    id: 'usr_test_admin',
    email: 'admin@rbp.local',
    displayName: 'Admin User',
    firstName: 'Admin',
    lastName: 'User',
    authProvider: 'authentik',
    authProviderUserId: 'auth0-admin',
    status: 'active',
    defaultTenantId: 'ten_rbp_internal',
  },
  availableTenantIds: ['ten_rbp_internal', 'ten_acme_customer'],
  roleAssignments: [
    { roleId: 'role_tenant_admin', tenantId: 'ten_rbp_internal', workspaceId: 'wrk_internal_admin', assignedAt: '2026-03-22T10:00:00.000Z' },
    { roleId: 'role_support_agent', tenantId: 'ten_rbp_internal', workspaceId: 'wrk_internal_ops', assignedAt: '2026-03-22T10:00:00.000Z' },
    { roleId: 'role_customer_user', tenantId: 'ten_acme_customer', workspaceId: 'wrk_acme_service', assignedAt: '2026-03-22T10:00:00.000Z' },
  ],
  defaultTenantId: 'ten_rbp_internal',
  mfaVerified: true,
  lastAuthenticatedAt: '2026-03-22T10:00:00.000Z',
};

test('registry loading and lookup work deterministically', () => {
  assert.ok(getAllModules().length >= 12);
  assert.equal(getModuleByKey('dashboard').defaultLandingRoute, '/dashboard');
});

test('session response returns unauthenticated state correctly', async () => {
  const response = await toSessionResponse(null);
  assert.deepEqual(response, { authenticated: false });
});

test('session response returns authenticated session correctly', async () => {
  const persisted = createPersistedSession({ principal, auth: { provider: 'local' } });
  const response = await toSessionResponse(persisted);
  assert.equal(response.authenticated, true);
  if (response.authenticated) {
    assert.equal(response.session.activeTenant.id, 'ten_rbp_internal');
    assert.ok(response.session.enabledModules.includes('admin'));
  }
});

test('tenant switching succeeds when allowed', () => {
  const persisted = createPersistedSession({ principal, auth: { provider: 'local' } });
  const next = applyTenantSwitch(persisted, { tenantId: 'ten_acme_customer', workspaceId: 'wrk_acme_service' });
  assert.equal(next.activeTenantId, 'ten_acme_customer');
  assert.equal(next.activeWorkspaceId, 'wrk_acme_service');
});

test('tenant switching fails when not allowed', () => {
  const persisted = createPersistedSession({ principal, auth: { provider: 'local' } });
  assert.throws(() => applyTenantSwitch(persisted, { tenantId: 'ten_unknown' }), /tenant_switch_not_allowed/);
});

test('permission resolution combines multiple roles', () => {
  const permissions = resolveEffectivePermissions({
    roleAssignments: principal.roleAssignments,
    activeTenantId: 'ten_rbp_internal',
    activeWorkspaceId: 'wrk_internal_admin',
  });
  assert.ok(permissions.some((permission) => permission.resource === 'finance' && permission.actions.includes('manage')));
  assert.ok(permissions.some((permission) => permission.resource === 'dashboard' && permission.actions.includes('read')));
});

test('module access evaluation respects disabled tenant modules and feature flags', () => {
  const tenant = getTenantById('ten_acme_customer');
  const permissions = resolveEffectivePermissions({
    roleAssignments: principal.roleAssignments,
    activeTenantId: 'ten_acme_customer',
    activeWorkspaceId: 'wrk_acme_service',
  });
  const context = {
    session: null,
    activeTenant: tenant,
    activeWorkspace: getWorkspacesForTenant('ten_acme_customer')[0],
    effectivePermissions: permissions,
    enabledModules: tenant.enabledModules,
    featureFlags: tenant.featureFlags,
    internalUser: false,
  };
  const analytics = evaluateModuleAccess(getModuleByKey('analytics'), context);
  const admin = evaluateModuleAccess(getModuleByKey('admin'), context);
  assert.equal(analytics.visible, false);
  assert.ok(analytics.reasonCodes.includes('missing_feature_flag'));
  assert.equal(admin.visible, false);
  assert.ok(admin.reasonCodes.includes('internal_only'));
});

test('navigation generation differs for anonymous, workspace, and admin users', async () => {
  const anonymousContext = createNavigationContextFromSession(null, '/');
  assert.ok(buildPublicNavigation(anonymousContext).some((item) => item.moduleKey === 'services'));

  const customerPersisted = createPersistedSession({
    principal: {
      ...principal,
      availableTenantIds: ['ten_acme_customer'],
      roleAssignments: [{ roleId: 'role_customer_user', tenantId: 'ten_acme_customer', workspaceId: 'wrk_acme_service', assignedAt: '2026-03-22T10:00:00.000Z' }],
      defaultTenantId: 'ten_acme_customer',
    },
    auth: { provider: 'local' },
    activeTenantId: 'ten_acme_customer',
    activeWorkspaceId: 'wrk_acme_service',
  });
  const customerSessionResponse = await toSessionResponse(customerPersisted);
  const customerContext = createNavigationContextFromSession(customerSessionResponse.session, '/portal');
  assert.ok(buildWorkspaceNavigation(customerContext).some((item) => item.moduleKey === 'support'));
  assert.ok(!buildWorkspaceNavigation(customerContext).some((item) => item.moduleKey === 'admin'));

  const adminSessionResponse = await toSessionResponse(createPersistedSession({ principal, auth: { provider: 'local' } }));
  const adminContext = createNavigationContextFromSession(adminSessionResponse.session, '/admin');
  assert.ok(buildAdminNavigation(adminContext).some((item) => item.moduleKey === 'admin'));
});

test('route access checks use route metadata and module access together', async () => {
  const sessionResponse = await toSessionResponse(createPersistedSession({ principal, auth: { provider: 'local' } }));
  const context = createNavigationContextFromSession(sessionResponse.session, '/admin/analytics');
  const routeAccess = canAccessRoute(getRouteDefinition('/admin/analytics'), context);
  assert.equal(routeAccess.allowed, true);
});

test('permission-aware route protection blocks inaccessible direct admin routes', async () => {
  const customerPersisted = createPersistedSession({
    principal: {
      ...principal,
      availableTenantIds: ['ten_acme_customer'],
      roleAssignments: [{ roleId: 'role_customer_user', tenantId: 'ten_acme_customer', workspaceId: 'wrk_acme_service', assignedAt: '2026-03-22T10:00:00.000Z' }],
      defaultTenantId: 'ten_acme_customer',
    },
    auth: { provider: 'local' },
    activeTenantId: 'ten_acme_customer',
    activeWorkspaceId: 'wrk_acme_service',
  });
  const response = await toSessionResponse(customerPersisted);
  const decision = evaluateRouteAuthorization('/admin', response);
  assert.equal(decision.allowed, false);
  assert.equal(decision.redirectTo, '/access-denied');
});

test('default landing route resolves from accessible route metadata', async () => {
  const response = await toSessionResponse(createPersistedSession({ principal, auth: { provider: 'local' } }));
  const context = createNavigationContextFromSession(response.session, '/');
  assert.equal(getDefaultLandingRoute(context), '/dashboard');
});
