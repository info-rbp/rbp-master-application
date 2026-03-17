
import { NextResponse } from 'next/server';
import { getRequestAuthContext } from '@/lib/server-auth';

export async function GET(request: Request) {
  const authContext = await getRequestAuthContext(new (require('next/server').NextRequest)(request));

  return NextResponse.json(authContext);
}
