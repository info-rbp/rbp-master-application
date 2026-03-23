import { AuditService } from '@/lib/audit/service';
import { FeatureControlsBffService } from '@/lib/bff/services/feature-controls-bff-service';
import { fail, ok } from '@/lib/bff/utils/http';
import { getBffRequestContext, requirePermission } from '@/lib/bff/utils/request-context';
import { FeatureFlagService } from '@/lib/feature-flags/service';
import { readJsonBody } from '@/lib/http';
import type { NextRequest } from 'next/server';

const bff = new FeatureControlsBffService();
const service = new FeatureFlagService();
const audit = new AuditService();

export async function GET(request: NextRequest) {
  let correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    correlationId = context.correlationId;
    requirePermission(context, 'module_controls', 'read');
    const moduleKey = request.nextUrl.searchParams.get('moduleKey') ?? undefined;
    return ok({ items: await bff.getModuleRules(moduleKey) }, correlationId);
  } catch (error) {
    return fail(error, correlationId);
  }
}

export async function POST(request: NextRequest) {
  let correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    correlationId = context.correlationId;
    requirePermission(context, 'module_controls', 'manage');
    const body = await readJsonBody<any>(request);
    if (!body.ok) return body.response;
    const created = await service.saveModuleRule({ ...body.data, createdBy: context.session.user.id, updatedBy: context.session.user.id });
    await audit.record({ eventType: 'module.control.created', action: 'create', category: 'configuration', tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, actorType: 'user', actorId: context.session.user.id, actorDisplay: context.session.user.displayName, subjectEntityType: 'module_control', subjectEntityId: created.id, sourceSystem: 'platform', correlationId, outcome: 'success', severity: 'info', metadata: { moduleKey: created.moduleKey, enabled: created.enabled, visible: created.visible, scopeType: created.scopeType, scopeId: created.scopeId }, sensitivity: 'internal' });
    return ok(created, correlationId);
  } catch (error) { return fail(error, correlationId); }
}
