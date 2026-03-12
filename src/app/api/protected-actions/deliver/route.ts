import { NextRequest, NextResponse } from 'next/server';
import { getSuiteBySlug } from '@/lib/data';
import { evaluateProtectedAction } from '@/lib/protected-actions';
import { getRequestAuthContext } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  }

  const suite = await getSuiteBySlug(slug);
  if (!suite?.actionTarget) {
    return NextResponse.json({ error: 'Resource unavailable' }, { status: 404 });
  }

  const auth = await getRequestAuthContext(request);
  const actionType = suite.contentType === 'documentation-suites' ? 'access_suite' : suite.contentType === 'customisation-service' ? 'launch_tool' : 'download_resource';
  const result = await evaluateProtectedAction({ actionType, slug }, auth);

  if (!result.allowed) {
    return NextResponse.json(result, { status: 403 });
  }

  return NextResponse.redirect(suite.actionTarget, 302);
}
