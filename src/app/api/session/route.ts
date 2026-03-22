import { NextResponse } from 'next/server';
import { resolveSessionResponse } from '@/lib/platform/session';

export async function GET() {
  const response = await resolveSessionResponse();
  return NextResponse.json(response);
}
