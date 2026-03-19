import { NextResponse } from 'next/server';
import { exportJWK, importSPKI } from 'jose';

export async function GET() {
  const publicKeyPem = process.env.TOOL_LAUNCH_PUBLIC_KEY;
  if (!publicKeyPem) {
    return NextResponse.json({ error: 'TOOL_LAUNCH_PUBLIC_KEY is not set' }, { status: 500 });
  }

  try {
    const publicKey = await importSPKI(publicKeyPem, 'RS256');
    const jwk = await exportJWK(publicKey);
    return NextResponse.json({ keys: [jwk] });
  } catch (error) {
    console.error('Failed to export public key to JWK', error);
    return NextResponse.json({ error: 'Failed to export public key' }, { status: 500 });
  }
}
