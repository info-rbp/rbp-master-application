import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getBffRequestContext } from '@/lib/bff/utils/request-context';
import { fail, ok } from '@/lib/bff/utils/http';
import { NotificationService } from '@/lib/notifications-center/service';
import { WorkflowError } from '@/lib/workflows/utils/errors';

const schema = z.object({ notificationType: z.string().optional(), category: z.string().optional(), channelPreferences: z.object({ in_app: z.boolean().optional(), email: z.boolean().optional(), sms: z.boolean().optional(), chat: z.boolean().optional() }).partial().optional(), muted: z.boolean().optional(), digestMode: z.enum(['instant', 'daily', 'weekly']).optional() });
const service = new NotificationService();

export async function GET(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    const data = await service.getPreferences(context.session.user.id, context.session.activeTenant.id);
    return ok(data, correlationId);
  } catch (error) {
    return fail(error, correlationId);
  }
}

export async function PUT(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    const body = schema.parse(await request.json());
    const data = await service.updatePreferences(context.session.user.id, context.session.activeTenant.id, body);
    return ok(data, correlationId);
  } catch (error) {
    return fail(error instanceof z.ZodError ? new WorkflowError({ code: 'invalid_request', message: 'Invalid notification preference payload.', status: 400, category: 'validation_failure', details: { issues: error.issues } }) : error, correlationId);
  }
}
