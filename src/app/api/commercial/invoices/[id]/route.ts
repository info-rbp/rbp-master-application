import { NextRequest } from 'next/server';
import { CommercialBffService } from '@/lib/bff/services/commercial-bff-service';
import { getBffRequestContext } from '@/lib/bff/utils/request-context';
import { ok, fail } from '@/lib/bff/utils/http';

const service = new CommercialBffService();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    const { id } = await params;
    const data = await service.getInvoiceDetail(id, context);
    return ok(data, correlationId);
  } catch (error) {
    return fail(error, correlationId);
  }
}
