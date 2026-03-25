import { NextResponse } from 'next/server';
import { resolveSessionResponse } from '@/lib/platform/session';

export async function GET() {
  return NextResponse.json(await resolveSessionResponse());
}
