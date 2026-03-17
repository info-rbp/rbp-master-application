
import { NextRequest, NextResponse } from 'next/server';
import { trackUserTouchpoint } from '@/lib/attribution-service';
import { getServerAuthContext } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  const auth = await getServerAuthContext();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { source, partnerId } = await request.json();

  if (!source) {
    return NextResponse.json({ error: 'Missing source' }, { status: 400 });
  }

  try {
    await trackUserTouchpoint(auth.userId, source, partnerId);
    return NextResponse.json({ message: 'Touchpoint tracked' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to track touchpoint' }, { status: 500 });
  }
}
