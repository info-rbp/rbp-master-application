import { FeatureControlsBffService } from '@/lib/bff/services/feature-controls-bff-service';
import { fail, ok } from '@/lib/bff/utils/http';
import { getBffRequestContext, requirePermission } from '@/lib/bff/utils/request-context';
import type { NextRequest } from 'next/server';

let service: FeatureControlsBffService | undefined;

function getService() {
  service ??= new FeatureControlsBffService();
  return service;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  let correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    correlationId = context.correlationId;
    requirePermission(context, 'feature_flags', 'read');
    const { key } = await params;
    const data = await getService().evaluateFlag(context, key);
    const assignments = await getService().getAssignments(key);
    return ok({ definition: (await getService().getCatalog()).items.find((item) => item.flagKey === key), evaluation: data, assignments }, correlationId);
  } catch (error) {
    return fail(error, correlationId);
  }
}
