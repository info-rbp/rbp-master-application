import { FeatureControlsBffService } from '@/lib/bff/services/feature-controls-bff-service';
import { fail, ok } from '@/lib/bff/utils/http';
import { getBffRequestContext, requirePermission } from '@/lib/bff/utils/request-context';
import type { NextRequest } from 'next/server';

const service = new FeatureControlsBffService();

export async function GET(request: NextRequest) {
  let correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    correlationId = context.correlationId;
    requirePermission(context, 'feature_flags', 'read');
    const flagKey = request.nextUrl.searchParams.get('flagKey') ?? undefined;
    const catalog = await service.getCatalog();
    const assignments = await service.getAssignments(flagKey);
    return ok({ ...catalog, assignments }, correlationId);
  } catch (error) {
    return fail(error, correlationId);
  }
}
