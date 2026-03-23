import { NextRequest } from 'next/server';
import { getBffRequestContext } from '@/lib/bff/utils/request-context';
import { fail, ok } from '@/lib/bff/utils/http';
import { AuditQueryService } from '@/lib/audit/query-service';

const service = new AuditQueryService();

export async function GET(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    const { searchParams } = new URL(request.url);
    const data = await service.query(context, {
      workspaceId: searchParams.get('workspaceId') ?? undefined,
      actorId: searchParams.get('actorId') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      eventType: searchParams.get('eventType') ?? undefined,
      subjectEntityType: searchParams.get('subjectEntityType') ?? undefined,
      subjectEntityId: searchParams.get('subjectEntityId') ?? undefined,
      targetEntityType: searchParams.get('targetEntityType') ?? undefined,
      targetEntityId: searchParams.get('targetEntityId') ?? undefined,
      outcome: searchParams.get('outcome') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      cursor: searchParams.get('cursor') ?? undefined,
    } as any);
    return ok(data, correlationId);
  } catch (error) {
    return fail(error, correlationId);
  }
}
