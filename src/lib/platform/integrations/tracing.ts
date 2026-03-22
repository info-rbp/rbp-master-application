export type AdapterRequestContext = {
  correlationId?: string;
  tenantId?: string;
  workspaceId?: string;
  actingUserId?: string;
  sourcePreference?: string;
  requestId?: string;
  debug?: boolean;
};

export type AdapterLogLevel = 'debug' | 'info' | 'warn' | 'error';

export function resolveCorrelationId(context?: AdapterRequestContext) {
  return context?.correlationId ?? context?.requestId ?? crypto.randomUUID();
}

export function createTracingHeaders(context?: AdapterRequestContext) {
  const correlationId = resolveCorrelationId(context);
  return {
    'x-correlation-id': correlationId,
    'x-tenant-id': context?.tenantId ?? '',
    'x-workspace-id': context?.workspaceId ?? '',
    'x-acting-user-id': context?.actingUserId ?? '',
  };
}

export function logAdapterEvent(input: {
  level: AdapterLogLevel;
  sourceSystem: string;
  operation: string;
  correlationId?: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  const payload = {
    level: input.level,
    sourceSystem: input.sourceSystem,
    operation: input.operation,
    correlationId: input.correlationId,
    message: input.message,
    metadata: input.metadata,
    loggedAt: new Date().toISOString(),
  };

  if (input.level === 'error') {
    console.error('[platform-adapter]', payload);
    return;
  }

  if (input.level === 'warn') {
    console.warn('[platform-adapter]', payload);
    return;
  }

  console.log('[platform-adapter]', payload);
}
