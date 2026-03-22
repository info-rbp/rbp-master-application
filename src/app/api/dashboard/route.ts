import { NextRequest } from 'next/server';
import { DashboardBffService } from '@/lib/bff/services/dashboard-bff-service';
import { getBffRequestContext } from '@/lib/bff/utils/request-context';
import { fail, ok } from '@/lib/bff/utils/http';

const service = new DashboardBffService();

export async function GET(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    const data = await service.getDashboard(context);
    return ok(data, correlationId, data.warnings);
  } catch (error) {
    return fail(error, correlationId);
  }
}
