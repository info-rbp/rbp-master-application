import { NextRequest } from 'next/server';
import { TaskInboxBffService } from '@/lib/bff/services/task-inbox-bff-service';
import { getBffRequestContext } from '@/lib/bff/utils/request-context';
import { fail, ok } from '@/lib/bff/utils/http';
import { requireRoutePolicyAccess } from '@/lib/access/evaluators';

const service = new TaskInboxBffService();

export async function GET(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    await requireRoutePolicyAccess('/api/tasks/summary', context);
    const data = await service.listTasks(context, { limit: 10 });
    return ok(data.summary, correlationId);
  } catch (error) {
    return fail(error, correlationId);
  }
}
