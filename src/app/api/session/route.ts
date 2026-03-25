import { SessionBffService } from '@/lib/bff/services/session-bff-service';
import { ok } from '@/lib/bff/utils/http';
import { NextRequest } from 'next/server';

const service = new SessionBffService();

export async function GET(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  const data = await service.getSession();
  return ok(data, correlationId);
}
