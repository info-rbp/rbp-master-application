import { NextRequest } from 'next/server';
import { getBffRequestContext } from '@/lib/bff/utils/request-context';
import { ok, fail } from '@/lib/bff/utils/http';
import { SearchBffService } from '@/lib/bff/services/search-bff-service';

const service = new SearchBffService();

export async function GET(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    const params = new URL(request.url).searchParams;
    params.set('mode', 'quick');
    params.set('pageSize', params.get('pageSize') ?? '5');
    const data = await service.searchAll(context, params);
    return ok({ items: data.items, suggestions: data.suggestions ?? [] }, correlationId, data.warnings, { degraded: data.meta.degraded });
  } catch (error) {
    return fail(error, correlationId);
  }
}
