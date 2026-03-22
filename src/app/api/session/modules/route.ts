import { NextResponse } from 'next/server';
import { resolveSessionResponse } from '@/lib/platform/session';
import { createNavigationContextFromSession } from '@/lib/platform/navigation-context';
import { getModuleAccessSummary } from '@/lib/platform/modules';

export async function GET() {
  const response = await resolveSessionResponse();
  if (!response.authenticated) {
    return NextResponse.json({ authenticated: false, modules: [] }, { status: 401 });
  }

  const context = createNavigationContextFromSession(response.session);
  return NextResponse.json({ authenticated: true, modules: getModuleAccessSummary(context) });
}
