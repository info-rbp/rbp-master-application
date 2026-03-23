import { NextRequest } from 'next/server';
import { ApplicationBffService } from '@/lib/bff/services/application-bff-service';
import { getBffRequestContext } from '@/lib/bff/utils/request-context';
import { fail, ok } from '@/lib/bff/utils/http';
import { requireRoutePolicyAccess } from '@/lib/access/evaluators';

const service = new ApplicationBffService();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    const { id } = await params;
    await requireRoutePolicyAccess(`/api/applications/${id}`, context);
    const data = await service.getApplication(id, context);
    return ok(data, correlationId, data.warnings);
  } catch (error) {
    return fail(error, correlationId);
  }
}
