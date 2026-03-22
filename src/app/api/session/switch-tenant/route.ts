import { NextRequest } from 'next/server';
import { switchTenantContext } from '@/lib/platform/session';
import { ok, fail } from '@/lib/bff/utils/http';
import { BffApiError } from '@/lib/bff/utils/request-context';
import { toSessionDto } from '@/lib/bff/dto/common';

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  const body = (await request.json().catch(() => null)) as { tenantId?: string; workspaceId?: string } | null;
  if (!body?.tenantId) {
    return fail(new BffApiError('invalid_request', 'tenantId is required.', 400), correlationId);
  }

  try {
    const session = await switchTenantContext({ tenantId: body.tenantId, workspaceId: body.workspaceId });
    if (!session) {
      throw new BffApiError('unauthenticated', 'Authentication is required for this endpoint.', 401);
    }
    return ok(toSessionDto(session), correlationId);
  } catch (error) {
    return fail(error, correlationId);
  }
}
