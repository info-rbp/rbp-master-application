import { NextRequest } from 'next/server';
import { CommercialBffService } from '@/lib/bff/services/commercial-bff-service';
import { getBffRequestContext } from '@/lib/bff/utils/request-context';
import { ok, fail } from '@/lib/bff/utils/http';

const service = new CommercialBffService();

export async function GET(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    const customerId = request.nextUrl.searchParams.get('customerId') ?? undefined;
    const status = request.nextUrl.searchParams.get('status') ?? undefined;
    const limit = request.nextUrl.searchParams.get('limit') ? Number(request.nextUrl.searchParams.get('limit')) : undefined;
    const data = await service.listInvoices({ customerId, status, limit }, context);
    return ok(data, correlationId);
  } catch (error) {
    return fail(error, correlationId);
  }
}
