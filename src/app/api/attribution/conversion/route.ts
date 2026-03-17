
import { NextRequest, NextResponse } from 'next/server';
import { logConversion } from '@/lib/attribution-service';
import { getServerAuthContext } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  const auth = await getServerAuthContext();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { conversionType, revenue } = await request.json();

  if (!conversionType) {
    return NextResponse.json({ error: 'Missing conversion type' }, { status: 400 });
  }

  try {
    const conversionEvent = await logConversion(auth.userId, conversionType, revenue);
    return NextResponse.json(conversionEvent);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to log conversion' }, { status: 500 });
  }
}
