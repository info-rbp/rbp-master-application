import { NextRequest } from 'next/server';
import { getBffRequestContext } from '@/lib/bff/utils/request-context';
import { ok, fail } from '@/lib/bff/utils/http';
import { SearchBffService } from '@/lib/bff/services/search-bff-service';

const service = new SearchBffService();

export async function GET(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    const data = await service.searchAll(context, new URL(request.url).searchParams);
    return ok(data, correlationId, data.warnings, { degraded: data.meta.degraded });
  } catch (error) {
    return fail(error, correlationId);
  }
}
