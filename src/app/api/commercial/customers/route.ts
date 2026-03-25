import { NextRequest } from 'next/server';
import { CommercialBffService } from '@/lib/bff/services/commercial-bff-service';
import { getBffRequestContext } from '@/lib/bff/utils/request-context';
import { ok, fail } from '@/lib/bff/utils/http';

const service = new CommercialBffService();

export async function GET(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    const search = request.nextUrl.searchParams.get('search') ?? undefined;
    const limit = request.nextUrl.searchParams.get('limit') ? Number(request.nextUrl.searchParams.get('limit')) : undefined;
    const data = await service.listCustomers({ search, limit }, context);
    return ok(data, correlationId);
  } catch (error) {
    return fail(error, correlationId);
  }
}
