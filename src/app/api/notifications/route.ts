import { NextRequest } from 'next/server';
import { NotificationBffService } from '@/lib/bff/services/notification-bff-service';
import { getBffRequestContext } from '@/lib/bff/utils/request-context';
import { fail, ok } from '@/lib/bff/utils/http';

const service = new NotificationBffService();

export async function GET(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    const { searchParams } = new URL(request.url);
    const data = await service.listNotifications(context, {
      status: (searchParams.get('status') as 'read' | 'unread' | null) ?? undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
    });
    return ok(data, correlationId);
  } catch (error) {
    return fail(error, correlationId);
  }
}
