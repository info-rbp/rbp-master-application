import { NextRequest } from 'next/server';
import { TaskInboxBffService } from '@/lib/bff/services/task-inbox-bff-service';
import { getBffRequestContext } from '@/lib/bff/utils/request-context';
import { fail, ok } from '@/lib/bff/utils/http';

const service = new TaskInboxBffService();

export async function GET(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    const { searchParams } = new URL(request.url);
    const data = await service.getSummary(context, {
      status: searchParams.get('status') ?? undefined,
      priority: searchParams.get('priority') ?? undefined,
      sourceSystem: searchParams.get('sourceSystem') ?? undefined,
      assignment: searchParams.get('assignment') ?? undefined,
    });
    return ok(data, correlationId);
  } catch (error) {
    return fail(error, correlationId);
  }
}
