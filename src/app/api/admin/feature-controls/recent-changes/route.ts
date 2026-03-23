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
    return ok(await service.getRecentChanges(context, Number(request.nextUrl.searchParams.get('limit') ?? '20')), correlationId);
  } catch (error) {
    return fail(error, correlationId);
  }
}
