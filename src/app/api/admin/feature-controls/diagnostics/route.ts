import { FeatureFlagService, buildFeatureEvaluationContext } from '@/lib/feature-flags/service';
import { fail, ok } from '@/lib/bff/utils/http';
import { getBffRequestContext, requirePermission } from '@/lib/bff/utils/request-context';
import type { NextRequest } from 'next/server';

const service = new FeatureFlagService();

export async function GET(request: NextRequest) {
  let correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    correlationId = context.correlationId;
    requirePermission(context, 'feature_flags', 'read');
    const featureContext = buildFeatureEvaluationContext({ session: context.session, internalUser: context.internalUser, correlationId: context.correlationId });
    return ok(await service.getControlPlaneDiagnostics(featureContext), correlationId);
  } catch (error) {
    return fail(error, correlationId);
  }
}
