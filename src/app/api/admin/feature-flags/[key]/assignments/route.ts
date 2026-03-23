import { AuditService } from '@/lib/audit/service';
import { requireActionPolicyAccess } from '@/lib/access/evaluators';
import { FeatureFlagService } from '@/lib/feature-flags/service';
import { toFeatureControlApiError } from '@/lib/feature-flags/http-errors';
import { readJsonBody } from '@/lib/http';
import { NotificationService } from '@/lib/notifications-center/service';
import { fail, ok } from '@/lib/bff/utils/http';
import { BffApiError, getBffRequestContext, requirePermission } from '@/lib/bff/utils/request-context';
import type { NextRequest } from 'next/server';

const service = new FeatureFlagService();
const audit = new AuditService();
const notifications = new NotificationService();

export async function POST(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  let correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    correlationId = context.correlationId;
    const { key } = await params;
    const body = await readJsonBody<any>(request);
    if (!body.ok) return body.response;
    await requireActionPolicyAccess('admin.feature_assignment.create', context);
    if (key.startsWith('feature.kill_switch') && !context.internalUser) throw new BffApiError('forbidden', 'Only internal operators may manage kill switches.', 403);
    if (key.startsWith('feature.kill_switch')) requirePermission(context, 'kill_switch', 'manage');
    const created = await service.saveAssignment({ ...body.data, flagKey: key, createdBy: context.session.user.id, updatedBy: context.session.user.id });
    await audit.record({ eventType: key.startsWith('feature.kill_switch') && created.value === true ? 'feature.kill_switch.activated' : 'feature.assignment.created', action: 'create', category: 'configuration', tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, actorType: 'user', actorId: context.session.user.id, actorDisplay: context.session.user.displayName, subjectEntityType: 'feature_flag', subjectEntityId: key, sourceSystem: 'platform', correlationId, outcome: 'success', severity: key.startsWith('feature.kill_switch') ? 'warning' : 'info', metadata: { assignmentId: created.id, scopeType: created.scopeType, scopeId: created.scopeId, value: created.value, reason: created.reason }, sensitivity: 'internal' });
    if (key.startsWith('feature.kill_switch')) {
      await notifications.create({ tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, recipientType: 'tenant_admins', recipientId: 'role_tenant_admin', notificationType: 'system.alert', category: 'admin', title: `${key} updated`, body: `Kill switch changed for ${key}.`, severity: created.value === true ? 'critical' : 'info', sourceSystem: 'platform', sourceEventType: 'feature.kill_switch.changed', actions: [{ key: 'open_feature_controls', label: 'Open controls', type: 'navigate', route: '/admin/system/feature-controls', requiresConfirmation: false, isPrimary: true, enabled: true }], channels: ['in_app'], metadata: { correlationId }, sourceRefs: [], dedupeKey: `kill-switch:${key}:${created.value}` });
    }
    return ok(created, correlationId);
  } catch (error) {
    return fail(toFeatureControlApiError(error), correlationId);
  }
}
