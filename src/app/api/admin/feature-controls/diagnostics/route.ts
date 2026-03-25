import { FeatureFlagService, buildFeatureEvaluationContext } from '@/lib/feature-flags/service';
import { fail, ok } from '@/lib/bff/utils/http';
import { getBffRequestContext, requirePermission } from '@/lib/bff/utils/request-context';
import type { NextRequest } from 'next/server';

let service: FeatureFlagService | undefined;

function getService() {
  service ??= new FeatureFlagService();
  return service;
}

export async function GET(request: NextRequest) {
  let correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    correlationId = context.correlationId;
    requirePermission(context, 'feature_flags', 'read');
    const featureContext = buildFeatureEvaluationContext({ session: context.session, internalUser: context.internalUser, correlationId: context.correlationId });
    return ok(await getService().getControlPlaneDiagnostics(featureContext), correlationId);
  } catch (error) {
    return fail(error, correlationId);
  }
}
