import { NextRequest } from 'next/server';
import { NotificationBffService } from '@/lib/bff/services/notification-bff-service';
import { getBffRequestContext } from '@/lib/bff/utils/request-context';
import { fail, ok } from '@/lib/bff/utils/http';

const service = new NotificationBffService();

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    const { id } = await params;
    const data = await service.markRead(context, id);
    return ok(data, correlationId);
  } catch (error) {
    return fail(error, correlationId);
  }
}
