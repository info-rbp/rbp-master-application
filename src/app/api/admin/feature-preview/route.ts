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
    requirePermission(context, 'rollout', 'preview');
    return ok(await service.preview(context, { tenantId: request.nextUrl.searchParams.get('tenantId') ?? undefined, workspaceId: request.nextUrl.searchParams.get('workspaceId') ?? undefined, currentModule: request.nextUrl.searchParams.get('moduleKey') ?? undefined, currentRoute: request.nextUrl.searchParams.get('route') ?? undefined }), correlationId);
  } catch (error) { return fail(error, correlationId); }
}
