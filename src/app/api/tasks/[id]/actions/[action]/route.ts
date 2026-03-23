import { NextRequest } from 'next/server';
import { TaskInboxBffService } from '@/lib/bff/services/task-inbox-bff-service';
import { getBffRequestContext } from '@/lib/bff/utils/request-context';
import { fail, ok } from '@/lib/bff/utils/http';

const service = new TaskInboxBffService();

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; action: string }> }) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  try {
    const context = await getBffRequestContext(request);
    const { id, action } = await params;
    const payload = await request.json().catch(() => ({}));
    const data = await service.runAction(context, id, action, payload);
    return ok(data, correlationId, data.warnings);
  } catch (error) {
    return fail(error, correlationId);
  }
}
