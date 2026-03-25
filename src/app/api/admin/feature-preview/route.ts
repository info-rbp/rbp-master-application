import { FeatureControlsBffService } from '@/lib/bff/services/feature-controls-bff-service';
import { fail, ok } from '@/lib/bff/utils/http';
import { getBffRequestContext } from '@/lib/bff/utils/request-context';
import { readJsonBody } from '@/lib/http';
import { requireActionPolicyAccess } from '@/lib/access/evaluators';
import type { NextRequest } from 'next/server';

let service: FeatureControlsBffService | undefined;

function getService() {
  service ??= new FeatureControlsBffService();
  return service;
}

export async function GET(request: NextRequest) {
  let correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    correlationId = context.correlationId;
    await requireActionPolicyAccess('admin.rollout.preview', context);
    return ok(await getService().preview(context, { tenantId: request.nextUrl.searchParams.get('tenantId') ?? undefined, workspaceId: request.nextUrl.searchParams.get('workspaceId') ?? undefined, currentModule: request.nextUrl.searchParams.get('moduleKey') ?? undefined, currentRoute: request.nextUrl.searchParams.get('route') ?? undefined, userId: request.nextUrl.searchParams.get('userId') ?? undefined, roleCodes: request.nextUrl.searchParams.get('roleCodes')?.split(',').filter(Boolean), featureKeys: request.nextUrl.searchParams.get('featureKeys')?.split(',').filter(Boolean), includeReasoning: request.nextUrl.searchParams.get('includeReasoning') !== 'false', includeBucketDetails: request.nextUrl.searchParams.get('includeBucketDetails') !== 'false' }), correlationId);
  } catch (error) { return fail(error, correlationId); }
}

export async function POST(request: NextRequest) {
  let correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    correlationId = context.correlationId;
    await requireActionPolicyAccess('admin.rollout.preview', context);
    const body = await readJsonBody<any>(request);
    if (!body.ok) return body.response;
    return ok(await getService().preview(context, body.data ?? {}), correlationId);
  } catch (error) { return fail(error, correlationId); }
}
