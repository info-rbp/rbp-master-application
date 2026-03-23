import { NextRequest } from 'next/server';
import { getBffRequestContext } from '@/lib/bff/utils/request-context';
import { fail, ok } from '@/lib/bff/utils/http';
import { NotificationService } from '@/lib/notifications-center/service';

const service = new NotificationService();

export async function GET(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    const data = await service.getUnreadCount({ tenantId: context.session.activeTenant.id, userId: context.session.user.id });
    return ok(data, correlationId);
  } catch (error) {
    return fail(error, correlationId);
  }
}
