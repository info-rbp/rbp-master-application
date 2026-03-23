import { NextRequest } from 'next/server';
import { getBffRequestContext } from '@/lib/bff/utils/request-context';
import { ok, fail } from '@/lib/bff/utils/http';
import { WorkflowStatusQueryService } from '@/lib/workflows/services/status-query-service';
import { requireRoutePolicyAccess } from '@/lib/access/evaluators';

const service = new WorkflowStatusQueryService();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    const { id } = await params;
    await requireRoutePolicyAccess(`/api/workflows/${id}`, context);
    const data = await service.getWorkflowStatus(context, id);
    return ok(data, correlationId, data.warnings);
  } catch (error) {
    return fail(error, correlationId);
  }
}
