import { FeatureControlsBffService } from '@/lib/bff/services/feature-controls-bff-service';
import { fail, ok } from '@/lib/bff/utils/http';
import { getBffRequestContext, requirePermission } from '@/lib/bff/utils/request-context';
import type { NextRequest } from 'next/server';

const service = new FeatureControlsBffService();

export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  let correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    correlationId = context.correlationId;
    requirePermission(context, 'feature_flags', 'read');
    const { key } = await params;
    const data = await service.evaluateFlag(context, key);
    const assignments = await service.getAssignments(key);
    return ok({ definition: (await service.getCatalog()).items.find((item) => item.flagKey === key), evaluation: data, assignments }, correlationId);
  } catch (error) {
    return fail(error, correlationId);
  }
}
