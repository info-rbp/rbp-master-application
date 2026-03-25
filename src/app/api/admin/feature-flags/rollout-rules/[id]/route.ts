import { AuditService } from '@/lib/audit/service';
import { requireActionPolicyAccess } from '@/lib/access/evaluators';
import { FeatureFlagService } from '@/lib/feature-flags/service';
import { toFeatureControlApiError } from '@/lib/feature-flags/http-errors';
import { readJsonBody } from '@/lib/http';
import { fail, ok } from '@/lib/bff/utils/http';
import { getBffRequestContext } from '@/lib/bff/utils/request-context';
import type { NextRequest } from 'next/server';

let service: FeatureFlagService | undefined;
let audit: AuditService | undefined;

function getService() {
  service ??= new FeatureFlagService();
  return service;
}

function getAudit() {
  audit ??= new AuditService();
  return audit;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request); correlationId = context.correlationId; await requireActionPolicyAccess('admin.rollout_rule.update', context);
    const body = await readJsonBody<any>(request); if (!body.ok) return body.response; const { id } = await params;
    const updated = await getService().updateRolloutRule(id, { ...body.data, updatedBy: context.session.user.id, expectedVersion: body.data?.expectedVersion });
    await getAudit().record({ eventType: 'feature.rollout_rule.updated', action: 'update', category: 'configuration', tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, actorType: 'user', actorId: context.session.user.id, actorDisplay: context.session.user.displayName, subjectEntityType: 'feature_rollout_rule', subjectEntityId: id, sourceSystem: 'platform', correlationId, outcome: 'success', severity: updated.percentage >= 50 ? 'warning' : 'info', metadata: { flagKey: updated.flagKey, percentage: updated.percentage, bucketBy: updated.bucketBy, salt: Boolean(updated.salt) }, sensitivity: 'internal' });
    return ok(updated, correlationId);
  } catch (error) { return fail(toFeatureControlApiError(error), correlationId); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request); correlationId = context.correlationId; await requireActionPolicyAccess('admin.rollout_rule.disable', context); const { id } = await params;
    const expectedVersion = request.nextUrl.searchParams.get('expectedVersion');
    const updated = await getService().disableRolloutRule(id, { updatedBy: context.session.user.id, expectedVersion: expectedVersion ? Number(expectedVersion) : undefined });
    await getAudit().record({ eventType: 'feature.rollout_rule.disabled', action: 'disable', category: 'configuration', tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, actorType: 'user', actorId: context.session.user.id, actorDisplay: context.session.user.displayName, subjectEntityType: 'feature_rollout_rule', subjectEntityId: id, sourceSystem: 'platform', correlationId, outcome: 'success', severity: 'warning', metadata: { flagKey: updated.flagKey, percentage: updated.percentage, bucketBy: updated.bucketBy }, sensitivity: 'internal' });
    return ok(updated, correlationId);
  } catch (error) { return fail(toFeatureControlApiError(error), correlationId); }
}
