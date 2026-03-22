import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getBffRequestContext } from '@/lib/bff/utils/request-context';
import { ok, fail } from '@/lib/bff/utils/http';
import { ReviewApprovalWorkflowService } from '@/lib/workflows/services/review-approval-workflow-service';
import { WorkflowError } from '@/lib/workflows/utils/errors';

const schema = z.object({ relatedEntityType: z.enum(['application', 'loan', 'invoice', 'support_ticket']), relatedEntityId: z.string().min(1), reviewType: z.string().min(1), requestedReviewers: z.array(z.string()).optional(), idempotencyKey: z.string().min(1).optional() });
const service = new ReviewApprovalWorkflowService();

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    const body = schema.parse(await request.json());
    const data = await service.start(context, body);
    return ok(data, correlationId, data.warnings);
  } catch (error) {
    return fail(error instanceof z.ZodError ? new WorkflowError({ code: 'invalid_request', message: 'Invalid review approval start payload.', status: 400, category: 'validation_failure', details: { issues: error.issues } }) : error, correlationId);
  }
}
