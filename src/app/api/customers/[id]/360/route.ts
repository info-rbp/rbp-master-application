import { NextRequest } from 'next/server';
import { Customer360BffService } from '@/lib/bff/services/customer-360-bff-service';
import { getBffRequestContext } from '@/lib/bff/utils/request-context';
import { fail, ok } from '@/lib/bff/utils/http';

const service = new Customer360BffService();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    const { id } = await params;
    const data = await service.getCustomer360(id, context);
    return ok(data, correlationId, data.warnings);
  } catch (error) {
    return fail(error, correlationId);
  }
}
