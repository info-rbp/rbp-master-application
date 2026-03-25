import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getBffRequestContext } from '@/lib/bff/utils/request-context';
import { ok, fail } from '@/lib/bff/utils/http';
import { requireRoutePolicyAccess } from '@/lib/access/evaluators';
import { ReviewApprovalWorkflowService } from '@/lib/workflows/services/review-approval-workflow-service';
import { WorkflowError } from '@/lib/workflows/utils/errors';

const schema = z.object({ action: z.enum(['approve', 'reject', 'request_more_information', 'assign', 'escalate', 'cancel']), comment: z.string().optional(), assigneeId: z.string().optional(), idempotencyKey: z.string().optional() });
const service = new ReviewApprovalWorkflowService();

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    const body = schema.parse(await request.json());
    const { id } = await params;
    await requireRoutePolicyAccess(`/api/workflows/review-approval/${id}/action`, context);
    const data = await service.act(context, id, body);
    return ok(data, correlationId, data.warnings);
  } catch (error) {
    return fail(error instanceof z.ZodError ? new WorkflowError({ code: 'invalid_request', message: 'Invalid review approval action payload.', status: 400, category: 'validation_failure', details: { issues: error.issues } }) : error, correlationId);
  }
}
