import { getPersistedPlatformSession, resolveSessionResponse } from '@/lib/platform/session';
import { canPermission } from '@/lib/platform/permissions';
import type { ModuleDefinition, PlatformSession } from '@/lib/platform/types';
import type { NextRequest } from 'next/server';

export type BffRequestContext = {
  correlationId: string;
  session: PlatformSession;
  internalUser: boolean;
};

export class BffApiError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;
  retryable?: boolean;

  constructor(code: string, message: string, status: number, details?: Record<string, unknown>, retryable?: boolean) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
    this.retryable = retryable;
  }
}

export async function getBffRequestContext(request: NextRequest): Promise<BffRequestContext> {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  const response = await resolveSessionResponse();
  if (!response.authenticated) {
    throw new BffApiError('unauthenticated', 'Authentication is required for this endpoint.', 401);
  }
  const persisted = await getPersistedPlatformSession();
  if (!persisted) {
    throw new BffApiError('unauthenticated', 'Authentication is required for this endpoint.', 401);
  }

  return {
    correlationId,
    session: response.session,
    internalUser: response.session.activeTenant.tenantType === 'internal' || persisted.availableTenantIds.includes('ten_rbp_internal'),
  };
}

export function requireModule(context: BffRequestContext, moduleKey: ModuleDefinition['key']) {
  if (!context.session.enabledModules.includes(moduleKey)) {
    throw new BffApiError('module_disabled', `The ${moduleKey} module is not available in the active tenant context.`, 403, { moduleKey });
  }
}

export function requirePermission(context: BffRequestContext, resource: string, action: string) {
  if (!canPermission(context.session.effectivePermissions, resource, action)) {
    throw new BffApiError('forbidden', 'You do not have permission to perform this action.', 403, { resource, action });
  }
}
