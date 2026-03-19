import { NextResponse } from 'next/server';
import { exportJWK } from 'jose';

export async function GET() {
  const publicKey = process.env.TOOL_LAUNCH_PUBLIC_KEY;
  if (!publicKey) {
    return new NextResponse(JSON.stringify({ error: 'TOOL_LAUNCH_PUBLIC_KEY is not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  try {
    const jwk = await exportJWK(publicKey as any);
    return NextResponse.json({ keys: [jwk] });
  } catch (error) {
    console.error('Failed to export public key to JWK', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to export public key' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
