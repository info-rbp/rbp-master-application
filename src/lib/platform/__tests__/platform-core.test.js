require('ts-node/register/transpile-only');
const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveEffectivePermissions } = require('../../../../.tmp-platform-tests/permissions');
const { evaluateEnabledModules, buildNavigation } = require('../../../../.tmp-platform-tests/modules');
const { getTenantById, getWorkspacesForTenant } = require('../../../../.tmp-platform-tests/bootstrap');
const { applyTenantSwitch, createPersistedSession, toSessionResponse } = require('../../../../.tmp-platform-tests/session');
const { evaluateRouteAuthorization } = require('../../../../.tmp-platform-tests/server-guards');

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

test('module access evaluation respects tenant modules and feature flags', () => {
  const tenant = getTenantById('ten_acme_customer');
  assert.ok(tenant);
  const permissions = resolveEffectivePermissions({
    roleAssignments: principal.roleAssignments,
    activeTenantId: 'ten_acme_customer',
    activeWorkspaceId: 'wrk_acme_service',
  });
  const modules = evaluateEnabledModules({
    tenant,
    workspace: getWorkspacesForTenant('ten_acme_customer')[0],
    permissions,
    internalUser: false,
  });
  assert.ok(modules.some((module) => module.key === 'support'));
  assert.ok(!modules.some((module) => module.key === 'analytics'));
  assert.ok(!modules.some((module) => module.key === 'admin'));
});

test('navigation generation mirrors enabled modules', () => {
  const tenant = getTenantById('ten_acme_customer');
  const permissions = resolveEffectivePermissions({
    roleAssignments: principal.roleAssignments,
    activeTenantId: 'ten_acme_customer',
    activeWorkspaceId: 'wrk_acme_service',
  });
  const modules = evaluateEnabledModules({ tenant, workspace: getWorkspacesForTenant('ten_acme_customer')[0], permissions, internalUser: false });
  const navigation = buildNavigation(modules);
  assert.ok(navigation.every((item) => item.visible));
  assert.ok(navigation.some((item) => item.moduleKey === 'support'));
});

test('protected route behavior redirects unauthenticated users', () => {
  const decision = evaluateRouteAuthorization('/admin', { authenticated: false });
  assert.equal(decision.allowed, false);
  assert.equal(decision.redirectTo, '/login?next=/admin');
});

test('access denied behavior triggers when module is unavailable', async () => {
  const persisted = createPersistedSession({ principal, auth: { provider: 'local' }, activeTenantId: 'ten_acme_customer', activeWorkspaceId: 'wrk_acme_service' });
  const response = await toSessionResponse(persisted);
  const decision = evaluateRouteAuthorization('/admin', response);
  assert.equal(decision.allowed, false);
  assert.equal(decision.redirectTo, '/access-denied');
});
