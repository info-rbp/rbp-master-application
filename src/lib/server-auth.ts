import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import * as admin from 'firebase-admin';
import { firestore } from '@/firebase/server';
import { getPersistedPlatformSession, resolveSessionResponse } from '@/lib/platform/session';
import { evaluateActionPolicyAccess } from '@/lib/access/evaluators';

export const AUTH_COOKIE_NAME = 'rbp_id_token';

export type AuthRole = 'owner' | 'admin' | 'member' | 'viewer' | 'support' | 'content_admin' | 'super_admin';

export type AuthContext = {
  userId: string;
  role: AuthRole;
  email?: string;
  emailVerified?: boolean;
  tenantId?: string;
  workspaceId?: string;
  permissions?: Array<{ resource: string; actions: string[]; scope: string }>;
};

export class AuthorizationError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = 'AuthorizationError';
    this.status = status;
  }
}

async function getBearerToken(request: NextRequest) {
  const header = request.headers.get('authorization') ?? request.headers.get('Authorization');
  if (header?.startsWith('Bearer ')) {
    return header.slice('Bearer '.length).trim();
  }

  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  return cookieToken ?? null;
}

async function getAuthContextFromIdToken(token: string): Promise<AuthContext | null> {
  if (!token) return null;

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const adminDoc = await firestore.collection('roles_admin').doc(decoded.uid).get();
    const userDoc = await firestore.collection('users').doc(decoded.uid).get();
    const user = userDoc.data();

    let role: AuthRole = 'member';

    if (adminDoc.exists) {
      role = 'admin';
    }

    if (user && user.role) {
      role = user.role;
    }

    return {
      userId: decoded.uid,
      role,
      email: decoded.email,
      emailVerified: Boolean(decoded.email_verified),
    };
  } catch {
    return null;
  }
}

function deriveRoleFromPlatformSession(session: Awaited<ReturnType<typeof getPersistedPlatformSession>>) {
  if (!session) return null;
  const response = session.roleAssignments.some((assignment) => !assignment.tenantId)
    ? 'super_admin'
    : session.roleAssignments.some((assignment) => assignment.roleId === 'role_tenant_admin')
      ? 'admin'
      : session.roleAssignments.some((assignment) => assignment.roleId === 'role_support_agent')
        ? 'support'
        : 'member';
  return response as AuthRole;
}

export async function verifyIdToken(token: string) {
  return admin.auth().verifyIdToken(token);
}

export async function getRequestAuthContext(request: NextRequest): Promise<AuthContext | null> {
  const sessionResponse = await resolveSessionResponse();
  if (sessionResponse.authenticated) {
    return {
      userId: sessionResponse.session.user.id,
      role: deriveRoleFromPlatformSession(await getPersistedPlatformSession()) ?? 'member',
      email: sessionResponse.session.user.email,
      emailVerified: true,
      tenantId: sessionResponse.session.activeTenant.id,
      workspaceId: sessionResponse.session.activeWorkspace?.id,
      permissions: sessionResponse.session.effectivePermissions,
    };
  }

  const token = await getBearerToken(request);
  if (!token) return null;
  return getAuthContextFromIdToken(token);
}

export async function getServerAuthContext(): Promise<AuthContext | null> {
  const sessionResponse = await resolveSessionResponse();
  if (sessionResponse.authenticated) {
    return {
      userId: sessionResponse.session.user.id,
      role: deriveRoleFromPlatformSession(await getPersistedPlatformSession()) ?? 'member',
      email: sessionResponse.session.user.email,
      emailVerified: true,
      tenantId: sessionResponse.session.activeTenant.id,
      workspaceId: sessionResponse.session.activeWorkspace?.id,
      permissions: sessionResponse.session.effectivePermissions,
    };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return getAuthContextFromIdToken(token);
}

export async function requireAdminServerContext() {
  const auth = await getServerAuthContext();
  if (!auth) {
    throw new AuthorizationError('Unauthorized', 401);
  }
  if (auth.role !== 'admin' && auth.role !== 'super_admin') {
    throw new AuthorizationError('Forbidden', 403);
  }

  return auth;
}


function buildPlatformAccessContext(sessionResponse: Awaited<ReturnType<typeof resolveSessionResponse>>) {
  if (!sessionResponse.authenticated) return null;
  const session = sessionResponse.session;
  const internalUser = session.activeTenant.tenantType === 'internal' || session.availableTenants.some((tenant) => tenant.tenantType === 'internal');
  return {
    environment: process.env.NODE_ENV ?? 'development',
    tenantId: session.activeTenant.id,
    workspaceId: session.activeWorkspace?.id,
    userId: session.user.id,
    roleCodes: session.roles.map((role) => role.code),
    enabledModules: session.enabledModules as string[],
    effectiveFlags: session.featureFlags,
    effectivePermissions: session.effectivePermissions,
    internalUser,
    correlationId: session.sessionId,
  };
}

export async function requireAdminActionRequestContext(request: NextRequest, actionKey: string) {
  const sessionResponse = await resolveSessionResponse();
  if (sessionResponse.authenticated) {
    const accessContext = buildPlatformAccessContext(sessionResponse);
    if (!accessContext || !evaluateActionPolicyAccess(actionKey, accessContext).result.allowed) {
      throw new AuthorizationError('Forbidden', 403);
    }

    return {
      userId: sessionResponse.session.user.id,
      role: deriveRoleFromPlatformSession(await getPersistedPlatformSession()) ?? 'member',
      email: sessionResponse.session.user.email,
      emailVerified: true,
      tenantId: sessionResponse.session.activeTenant.id,
      workspaceId: sessionResponse.session.activeWorkspace?.id,
      permissions: sessionResponse.session.effectivePermissions,
    } satisfies AuthContext;
  }

  const auth = await requireAdminRequestContext(request);
  return auth;
}

export async function requireAdminRequestContext(request: NextRequest) {
  const auth = await getRequestAuthContext(request);
  if (!auth) {
    throw new AuthorizationError('Unauthorized', 401);
  }
  if (auth.role !== 'admin' && auth.role !== 'super_admin') {
    throw new AuthorizationError('Forbidden', 403);
  }

  return auth;
}
