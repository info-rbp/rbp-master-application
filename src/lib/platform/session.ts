import { cookies } from 'next/headers';
import { PLATFORM_AUTH_FLOW_COOKIE, PLATFORM_SESSION_COOKIE, isExpired, seal, unseal } from './session-store';
import { getTenantById, getWorkspacesForTenant } from './bootstrap';
import { resolveRoles, resolveEffectivePermissions } from './permissions';
import { evaluateEnabledModules } from './modules';
import { buildPrimaryNavigation, buildWorkspaceNavigation, buildUserMenuNavigation, buildAdminNavigation } from './navigation-builder';
import { createNavigationContextFromSession } from './navigation-context';
import { refreshTokens } from './auth/authentik';
import type { AuthenticatedPrincipal, PersistedPlatformSession, PlatformSession, PlatformSessionResponse, RoleAssignment } from './types';

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export type AuthFlowState = {
  state: string;
  nonce: string;
  codeVerifier: string;
  returnTo: string;
};

function expiresInHours(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export function createPersistedSession(input: {
  principal: AuthenticatedPrincipal;
  auth: PersistedPlatformSession['auth'];
  activeTenantId?: string;
  activeWorkspaceId?: string;
}): PersistedPlatformSession {
  const activeTenantId = input.activeTenantId ?? input.principal.defaultTenantId ?? input.principal.availableTenantIds[0];
  return {
    sessionId: crypto.randomUUID(),
    user: input.principal.user,
    availableTenantIds: input.principal.availableTenantIds,
    activeTenantId,
    activeWorkspaceId: input.activeWorkspaceId,
    roleAssignments: input.principal.roleAssignments,
    issuedAt: new Date().toISOString(),
    expiresAt: expiresInHours(8),
    securityContext: {
      mfaVerified: input.principal.mfaVerified,
      impersonating: false,
      sessionStrength: input.principal.mfaVerified ? 'mfa' : 'standard',
      provider: 'authentik',
      lastAuthenticatedAt: input.principal.lastAuthenticatedAt,
    },
    auth: input.auth,
  };
}

export async function buildPlatformSession(persisted: PersistedPlatformSession): Promise<PlatformSession | null> {
  const tenant = getTenantById(persisted.activeTenantId);
  if (!tenant) return null;
  const availableTenants = persisted.availableTenantIds.map((tenantId) => getTenantById(tenantId)).filter((value): value is NonNullable<typeof value> => Boolean(value));
  const availableWorkspaces = getWorkspacesForTenant(tenant.id);
  const activeWorkspace = persisted.activeWorkspaceId ? availableWorkspaces.find((workspace) => workspace.id === persisted.activeWorkspaceId) : undefined;
  const effectivePermissions = resolveEffectivePermissions({
    roleAssignments: persisted.roleAssignments,
    activeTenantId: tenant.id,
    activeWorkspaceId: activeWorkspace?.id,
  });
  const roles = resolveRoles(filterAssignmentsForActiveContext(persisted.roleAssignments, tenant.id, activeWorkspace?.id));
  const enabledModules = evaluateEnabledModules({
    tenant,
    workspace: activeWorkspace,
    permissions: effectivePermissions,
    internalUser: tenant.tenantType === 'internal' || persisted.availableTenantIds.includes('ten_rbp_internal'),
  });

  return {
    sessionId: persisted.sessionId,
    user: persisted.user,
    activeTenant: tenant,
    activeWorkspace,
    availableTenants,
    availableWorkspaces,
    roles,
    roleAssignments: persisted.roleAssignments,
    effectivePermissions,
    enabledModules: enabledModules.map((module) => module.key),
    navigation: (() => {
      const baseSession = {
        sessionId: persisted.sessionId,
        user: persisted.user,
        activeTenant: tenant,
        activeWorkspace,
        availableTenants,
        availableWorkspaces,
        roles,
        roleAssignments: persisted.roleAssignments,
        effectivePermissions,
        enabledModules: enabledModules.map((module) => module.key),
        navigation: [],
        featureFlags: tenant.featureFlags,
        securityContext: persisted.securityContext,
        issuedAt: persisted.issuedAt,
        expiresAt: persisted.expiresAt,
      } as PlatformSession;
      const context = createNavigationContextFromSession(baseSession);
      return [
        ...buildPrimaryNavigation(context),
        ...buildWorkspaceNavigation(context),
        ...buildAdminNavigation(context),
        ...buildUserMenuNavigation(context),
      ];
    })(),
    featureFlags: tenant.featureFlags,
    securityContext: persisted.securityContext,
    issuedAt: persisted.issuedAt,
    expiresAt: persisted.expiresAt,
  };
}

export function filterAssignmentsForActiveContext(assignments: RoleAssignment[], tenantId: string, workspaceId?: string) {
  return assignments.filter((assignment) => {
    if (!assignment.tenantId) return true;
    if (assignment.tenantId !== tenantId) return false;
    if (assignment.workspaceId && workspaceId && assignment.workspaceId !== workspaceId) return false;
    return true;
  });
}

export async function persistPlatformSession(persisted: PersistedPlatformSession) {
  const store = await cookies();
  store.set(PLATFORM_SESSION_COOKIE, seal(persisted), { ...SESSION_COOKIE_OPTIONS, maxAge: 60 * 60 * 8 });
}

export async function clearPlatformSession() {
  const store = await cookies();
  store.set(PLATFORM_SESSION_COOKIE, '', { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
}

export async function persistAuthFlowState(state: AuthFlowState) {
  const store = await cookies();
  store.set(PLATFORM_AUTH_FLOW_COOKIE, seal(state), { ...SESSION_COOKIE_OPTIONS, maxAge: 60 * 10 });
}

export async function consumeAuthFlowState() {
  const store = await cookies();
  const parsed = unseal<AuthFlowState>(store.get(PLATFORM_AUTH_FLOW_COOKIE)?.value);
  store.set(PLATFORM_AUTH_FLOW_COOKIE, '', { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
  return parsed;
}

export async function getPersistedPlatformSession() {
  const store = await cookies();
  const parsed = unseal<PersistedPlatformSession>(store.get(PLATFORM_SESSION_COOKIE)?.value);
  if (!parsed || isExpired(parsed)) {
    return null;
  }
  if (parsed.auth.provider === 'authentik' && parsed.auth.refreshToken && parsed.auth.expiresAt) {
    const expiresAt = new Date(parsed.auth.expiresAt).getTime();
    if (expiresAt < Date.now() + 60_000) {
      try {
        const refreshed = await refreshTokens(parsed.auth.refreshToken);
        parsed.auth.accessToken = refreshed.access_token;
        parsed.auth.idToken = refreshed.id_token ?? parsed.auth.idToken;
        parsed.auth.refreshToken = refreshed.refresh_token ?? parsed.auth.refreshToken;
        parsed.auth.tokenType = refreshed.token_type ?? parsed.auth.tokenType;
        parsed.auth.scope = refreshed.scope ?? parsed.auth.scope;
        parsed.auth.expiresAt = new Date(Date.now() + (refreshed.expires_in ?? 3600) * 1000).toISOString();
        await persistPlatformSession(parsed);
      } catch {
        return null;
      }
    }
  }
  return parsed;
}

export async function toSessionResponse(persisted: PersistedPlatformSession | null): Promise<PlatformSessionResponse> {
  if (!persisted) return { authenticated: false };
  const session = await buildPlatformSession(persisted);
  if (!session) return { authenticated: false };
  return { authenticated: true, session };
}

export async function resolveSessionResponse(): Promise<PlatformSessionResponse> {
  return toSessionResponse(await getPersistedPlatformSession());
}

export function applyTenantSwitch(persisted: PersistedPlatformSession, input: { tenantId: string; workspaceId?: string }) {
  if (!persisted.availableTenantIds.includes(input.tenantId)) {
    throw new Error('tenant_switch_not_allowed');
  }
  const availableWorkspaces = getWorkspacesForTenant(input.tenantId);
  if (input.workspaceId && !availableWorkspaces.some((workspace) => workspace.id === input.workspaceId)) {
    throw new Error('workspace_switch_not_allowed');
  }
  return {
    ...persisted,
    activeTenantId: input.tenantId,
    activeWorkspaceId: input.workspaceId,
    expiresAt: expiresInHours(8),
  };
}

export async function switchTenantContext(input: { tenantId: string; workspaceId?: string }) {
  const persisted = await getPersistedPlatformSession();
  if (!persisted) return null;
  const nextPersisted = applyTenantSwitch(persisted, input);
  await persistPlatformSession(nextPersisted);
  return buildPlatformSession(nextPersisted);
}
