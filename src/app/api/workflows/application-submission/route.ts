import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getBffRequestContext } from '@/lib/bff/utils/request-context';
import { ok, fail } from '@/lib/bff/utils/http';
import { requireRoutePolicyAccess } from '@/lib/access/evaluators';
import { ApplicationSubmissionWorkflowService } from '@/lib/workflows/services/application-submission-workflow-service';
import { WorkflowError } from '@/lib/workflows/utils/errors';

const schema = z.object({ applicationId: z.string().min(1), idempotencyKey: z.string().min(1).optional(), submitOptions: z.record(z.string(), z.unknown()).optional() });
const service = new ApplicationSubmissionWorkflowService();

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    await requireRoutePolicyAccess('/api/workflows/application-submission', context);
    const body = schema.parse(await request.json());
    const data = await service.submit(context, body);
    return ok(data, correlationId, data.warnings);
  } catch (error) {
    return fail(error instanceof z.ZodError ? new WorkflowError({ code: 'invalid_request', message: 'Invalid application submission payload.', status: 400, category: 'validation_failure', details: { issues: error.issues } }) : error, correlationId);
  }
}
