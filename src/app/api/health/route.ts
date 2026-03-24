import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'rbp-master-application', timestamp: new Date().toISOString() });
}
