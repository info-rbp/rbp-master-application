import { NextRequest } from 'next/server';
import { getBffRequestContext } from '@/lib/bff/utils/request-context';
import { fail, ok } from '@/lib/bff/utils/http';
import { AuditQueryService } from '@/lib/audit/query-service';

const service = new AuditQueryService();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    const { id } = await params;
    const data = await service.getById(context, id);
    return ok(data, correlationId);
  } catch (error) {
    return fail(error, correlationId);
  }
}
