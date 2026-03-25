import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getBffRequestContext } from '@/lib/bff/utils/request-context';
import { ok, fail } from '@/lib/bff/utils/http';
import { requireRoutePolicyAccess } from '@/lib/access/evaluators';
import { SupportEscalationWorkflowService } from '@/lib/workflows/services/support-escalation-workflow-service';
import { WorkflowError } from '@/lib/workflows/utils/errors';

const schema = z.object({ ticketId: z.string().min(1), escalationReason: z.string().min(1), severity: z.enum(['low', 'medium', 'high', 'critical']), targetQueue: z.string().optional(), idempotencyKey: z.string().min(1).optional() });
const service = new SupportEscalationWorkflowService();

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    await requireRoutePolicyAccess('/api/workflows/support-escalation', context);
    const body = schema.parse(await request.json());
    const data = await service.escalate(context, body);
    return ok(data, correlationId, data.warnings);
  } catch (error) {
    return fail(error instanceof z.ZodError ? new WorkflowError({ code: 'invalid_request', message: 'Invalid support escalation payload.', status: 400, category: 'validation_failure', details: { issues: error.issues } }) : error, correlationId);
  }
}
