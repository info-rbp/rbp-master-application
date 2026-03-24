import { getPlatformAdapters } from '@/lib/platform/adapters/factory';
import { toIntegrationWarning } from '@/lib/platform/integrations/errors';
import type { IntegrationWarning, SourceReference } from '@/lib/platform/integrations/types';
import type { AdapterRequestContext } from '@/lib/platform/integrations/tracing';
import type { QuickActionDto, TimelineEventDto, WarningDto } from '@/lib/bff/dto/common';
import { normalizeStatus } from '@/lib/bff/utils/status';
import type { BffRequestContext } from '@/lib/bff/utils/request-context';

export function adapterContext(context: BffRequestContext): AdapterRequestContext {
  return {
    correlationId: context.correlationId,
    tenantId: context.session.activeTenant.id,
    workspaceId: context.session.activeWorkspace?.id,
    actingUserId: context.session.user.id,
  };
}

export function getAdapters() {
  return getPlatformAdapters();
}

export function toWarningDto(warning: IntegrationWarning): WarningDto {
  return {
    code: warning.code,
    message: warning.message,
    sourceSystem: warning.sourceSystem,
    retryable: warning.retryable,
    correlationId: warning.correlationId,
    operation: warning.operation,
  };
}

export async function tryOrWarn<T>(operation: () => Promise<T>, warning: WarningDto): Promise<{ data?: T; warning?: WarningDto }> {
  try {
    return { data: await operation() };
  } catch (error) {
    const normalized = toIntegrationWarning(error, {
      code: warning.code,
      message: warning.message,
      sourceSystem: (warning.sourceSystem ?? 'platform') as IntegrationWarning['sourceSystem'],
      retryable: warning.retryable,
    });
    console.warn('[bff.partial-failure]', { warning: normalized, error });
    return { warning: toWarningDto(normalized) };
  }
}

export function buildQuickAction(input: Partial<QuickActionDto> & Pick<QuickActionDto, 'key' | 'label' | 'type'>): QuickActionDto {
  return {
    requiresConfirmation: false,
    enabled: true,
    ...input,
  };
}

export function buildTimelineEvent(input: {
  id: string;
  eventType: string;
  title: string;
  description?: string;
  timestamp?: string;
  sourceSystem: TimelineEventDto['sourceSystem'];
  relatedEntityType?: string;
  relatedEntityId?: string;
  sourceRefs?: SourceReference[];
  severity?: TimelineEventDto['severity'];
}): TimelineEventDto {
  return {
    id: input.id,
    eventType: input.eventType,
    title: input.title,
    description: input.description,
    timestamp: input.timestamp ?? new Date().toISOString(),
    actorType: 'system',
    sourceSystem: input.sourceSystem,
    relatedEntityType: input.relatedEntityType,
    relatedEntityId: input.relatedEntityId,
    severity: input.severity,
    sourceRefs: input.sourceRefs ?? [],
  };
}

export function makeTask(id: string, title: string, sourceSystem: string, entityType: string, entityId: string, status: string, priority: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
  return {
    id,
    taskType: `${sourceSystem}_${entityType}`,
    title,
    status: normalizeStatus('task', status),
    priority,
    sourceSystem,
    relatedEntityType: entityType,
    relatedEntityId: entityId,
    availableActions: [{ key: 'open', label: 'Open' }],
    sourceRefs: [],
  };
}
