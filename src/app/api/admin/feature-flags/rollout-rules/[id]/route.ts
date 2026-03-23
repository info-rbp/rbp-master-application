import { AuditService } from '@/lib/audit/service';
import { FeatureFlagService } from '@/lib/feature-flags/service';
import { readJsonBody } from '@/lib/http';
import { fail, ok } from '@/lib/bff/utils/http';
import { getBffRequestContext, requirePermission } from '@/lib/bff/utils/request-context';
import type { NextRequest } from 'next/server';

const service = new FeatureFlagService();
const audit = new AuditService();

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request); correlationId = context.correlationId; requirePermission(context, 'feature_flags', 'manage');
    const body = await readJsonBody<any>(request); if (!body.ok) return body.response; const { id } = await params;
    const updated = await service.updateRolloutRule(id, { ...body.data, updatedBy: context.session.user.id, expectedVersion: body.data?.expectedVersion });
    await audit.record({ eventType: 'feature.rollout_rule.updated', action: 'update', category: 'configuration', tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, actorType: 'user', actorId: context.session.user.id, actorDisplay: context.session.user.displayName, subjectEntityType: 'feature_rollout_rule', subjectEntityId: id, sourceSystem: 'platform', correlationId, outcome: 'success', severity: updated.percentage >= 50 ? 'warning' : 'info', metadata: { flagKey: updated.flagKey, percentage: updated.percentage, bucketBy: updated.bucketBy, salt: Boolean(updated.salt) }, sensitivity: 'internal' });
    return ok(updated, correlationId);
  } catch (error) { return fail(error, correlationId); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request); correlationId = context.correlationId; requirePermission(context, 'feature_flags', 'manage'); const { id } = await params;
    const updated = await service.disableRolloutRule(id, { updatedBy: context.session.user.id });
    await audit.record({ eventType: 'feature.rollout_rule.disabled', action: 'disable', category: 'configuration', tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, actorType: 'user', actorId: context.session.user.id, actorDisplay: context.session.user.displayName, subjectEntityType: 'feature_rollout_rule', subjectEntityId: id, sourceSystem: 'platform', correlationId, outcome: 'success', severity: 'warning', metadata: { flagKey: updated.flagKey, percentage: updated.percentage, bucketBy: updated.bucketBy }, sensitivity: 'internal' });
    return ok(updated, correlationId);
  } catch (error) { return fail(error, correlationId); }
}
