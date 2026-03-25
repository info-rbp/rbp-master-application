
import { NextRequest, NextResponse } from 'next/server';
import { createDataRequest } from '@/lib/privacy-service';
import { getServerAuthContext } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  const auth = await getServerAuthContext();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { type } = await request.json();

  if (type !== 'export' && type !== 'deletion') {
    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
  }

  try {
    const dataRequest = await createDataRequest(auth.userId, type);
    // In a real application, you would now send an email to the user
    // with a link to /api/privacy/fulfill-request?token=${dataRequest.verificationToken}
    return NextResponse.json(dataRequest);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create data request' }, { status: 500 });
  }
}
