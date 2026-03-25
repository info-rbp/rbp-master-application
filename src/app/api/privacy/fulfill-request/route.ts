
import { NextRequest, NextResponse } from 'next/server';
import { fulfillDataRequest } from '@/lib/privacy-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Missing verification token' }, { status: 400 });
  }

  try {
    await fulfillDataRequest(token);
    return NextResponse.json({ message: 'Data request fulfilled successfully' });
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fulfill data request';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
