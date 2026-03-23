import { AuditService } from '@/lib/audit/service';
import { FeatureFlagService } from '@/lib/feature-flags/service';
import { readJsonBody } from '@/lib/http';
import { fail, ok } from '@/lib/bff/utils/http';
import { getBffRequestContext, requirePermission } from '@/lib/bff/utils/request-context';
import type { NextRequest } from 'next/server';

const service = new FeatureFlagService();
const audit = new AuditService();

export async function POST(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  let correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request); correlationId = context.correlationId; requirePermission(context, 'feature_flags', 'manage');
    const body = await readJsonBody<any>(request); if (!body.ok) return body.response; const { key } = await params;
    const created = await service.saveRolloutRule({ ...body.data, flagKey: key, createdBy: context.session.user.id, updatedBy: context.session.user.id });
    await audit.record({ eventType: 'feature.rollout_rule.created', action: 'create', category: 'configuration', tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, actorType: 'user', actorId: context.session.user.id, actorDisplay: context.session.user.displayName, subjectEntityType: 'feature_rollout_rule', subjectEntityId: created.id, sourceSystem: 'platform', correlationId, outcome: 'success', severity: created.percentage >= 50 ? 'warning' : 'info', metadata: { flagKey: created.flagKey, scopeType: created.scopeType, scopeId: created.scopeId, percentage: created.percentage, bucketBy: created.bucketBy, salt: Boolean(created.salt) }, sensitivity: 'internal' });
    return ok(created, correlationId);
  } catch (error) { return fail(error, correlationId); }
}
