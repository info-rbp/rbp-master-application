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
    const data = await service.listTasks(context, {
      status: searchParams.get('status') ?? undefined,
      priority: searchParams.get('priority') ?? undefined,
      sourceSystem: searchParams.get('sourceSystem') ?? undefined,
      relatedEntityType: searchParams.get('relatedEntityType') ?? undefined,
      relatedEntityId: searchParams.get('relatedEntityId') ?? undefined,
      queue: searchParams.get('queue') ?? undefined,
      assignment: (searchParams.get('assignment') as 'mine' | 'team' | 'all' | null) ?? undefined,
      search: searchParams.get('search') ?? undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
    });
    return ok(data, correlationId, data.warnings, { degraded: data.meta.degraded });
  } catch (error) {
    return fail(error, correlationId);
  }
}
