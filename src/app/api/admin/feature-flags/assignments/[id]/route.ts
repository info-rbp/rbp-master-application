import { AuditService } from '@/lib/audit/service';
import { requireActionPolicyAccess } from '@/lib/access/evaluators';
import { FeatureFlagService } from '@/lib/feature-flags/service';
import { toFeatureControlApiError } from '@/lib/feature-flags/http-errors';
import { readJsonBody } from '@/lib/http';
import { fail, ok } from '@/lib/bff/utils/http';
import { getBffRequestContext } from '@/lib/bff/utils/request-context';
import type { NextRequest } from 'next/server';

const service = new FeatureFlagService();
const audit = new AuditService();

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    correlationId = context.correlationId;
    await requireActionPolicyAccess('admin.feature_assignment.update', context);
    const body = await readJsonBody<any>(request);
    if (!body.ok) return body.response;
    const { id } = await params;
    const updated = await service.updateAssignment(id, { ...body.data, updatedBy: context.session.user.id, expectedVersion: body.data?.expectedVersion });
    await audit.record({ eventType: updated.flagKey.startsWith('feature.kill_switch') && updated.value === false ? 'feature.kill_switch.deactivated' : 'feature.assignment.updated', action: 'update', category: 'configuration', tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, actorType: 'user', actorId: context.session.user.id, actorDisplay: context.session.user.displayName, subjectEntityType: 'feature_flag_assignment', subjectEntityId: id, sourceSystem: 'platform', correlationId, outcome: 'success', severity: updated.flagKey.startsWith('feature.kill_switch') ? 'warning' : 'info', metadata: { flagKey: updated.flagKey, value: updated.value, enabled: updated.enabled }, sensitivity: 'internal' });
    return ok(updated, correlationId);
  } catch (error) {
    return fail(toFeatureControlApiError(error), correlationId);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    correlationId = context.correlationId;
    await requireActionPolicyAccess('admin.feature_assignment.disable', context);
    const { id } = await params;
    const expectedVersion = request.nextUrl.searchParams.get('expectedVersion');
    const updated = await service.disableAssignment(id, { updatedBy: context.session.user.id, expectedVersion: expectedVersion ? Number(expectedVersion) : undefined });
    await audit.record({ eventType: 'feature.assignment.disabled', action: 'disable', category: 'configuration', tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, actorType: 'user', actorId: context.session.user.id, actorDisplay: context.session.user.displayName, subjectEntityType: 'feature_flag_assignment', subjectEntityId: id, sourceSystem: 'platform', correlationId, outcome: 'success', severity: 'warning', metadata: { flagKey: updated.flagKey }, sensitivity: 'internal' });
    return ok(updated, correlationId);
  } catch (error) {
    return fail(toFeatureControlApiError(error), correlationId);
  }
}
