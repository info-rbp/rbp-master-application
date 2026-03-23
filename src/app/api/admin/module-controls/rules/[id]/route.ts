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
    await requireActionPolicyAccess('admin.module_rule.update', context);
    const body = await readJsonBody<any>(request);
    if (!body.ok) return body.response;
    const { id } = await params;
    const updated = await service.updateModuleRule(id, { ...body.data, updatedBy: context.session.user.id, expectedVersion: body.data?.expectedVersion });
    await audit.record({ eventType: 'module.control.updated', action: 'update', category: 'configuration', tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, actorType: 'user', actorId: context.session.user.id, actorDisplay: context.session.user.displayName, subjectEntityType: 'module_control', subjectEntityId: id, sourceSystem: 'platform', correlationId, outcome: 'success', severity: 'warning', metadata: { moduleKey: updated.moduleKey, enabled: updated.enabled, visible: updated.visible }, sensitivity: 'internal' });
    return ok(updated, correlationId);
  } catch (error) { return fail(toFeatureControlApiError(error), correlationId); }
}


export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    correlationId = context.correlationId;
    await requireActionPolicyAccess('admin.module_rule.disable', context);
    const { id } = await params;
    const expectedVersion = request.nextUrl.searchParams.get('expectedVersion');
    const updated = await service.disableModuleRule(id, { updatedBy: context.session.user.id, expectedVersion: expectedVersion ? Number(expectedVersion) : undefined });
    await audit.record({ eventType: 'module.control.disabled', action: 'disable', category: 'configuration', tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, actorType: 'user', actorId: context.session.user.id, actorDisplay: context.session.user.displayName, subjectEntityType: 'module_control', subjectEntityId: id, sourceSystem: 'platform', correlationId, outcome: 'success', severity: 'warning', metadata: { moduleKey: updated.moduleKey, enabled: updated.enabled, visible: updated.visible }, sensitivity: 'internal' });
    return ok(updated, correlationId);
  } catch (error) { return fail(toFeatureControlApiError(error), correlationId); }
}


export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    correlationId = context.correlationId;
    requirePermission(context, 'module_controls', 'manage');
    const { id } = await params;
    const updated = await service.disableModuleRule(id, { updatedBy: context.session.user.id });
    await audit.record({ eventType: 'module.control.disabled', action: 'disable', category: 'configuration', tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, actorType: 'user', actorId: context.session.user.id, actorDisplay: context.session.user.displayName, subjectEntityType: 'module_control', subjectEntityId: id, sourceSystem: 'platform', correlationId, outcome: 'success', severity: 'warning', metadata: { moduleKey: updated.moduleKey, enabled: updated.enabled, visible: updated.visible }, sensitivity: 'internal' });
    return ok(updated, correlationId);
  } catch (error) { return fail(error, correlationId); }
}
