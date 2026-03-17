
import { NextResponse } from "next/server";
import { exportJWK } from "jose";

// This is a simplified example. In a real application, you would
// load the public key from a secure location.
const PUBLIC_KEY_PEM = process.env.TOOL_LAUNCH_PUBLIC_KEY;

export async function GET() {
  if (!PUBLIC_KEY_PEM) {
    throw new Error("TOOL_LAUNCH_PUBLIC_KEY is not set");
  }
  const jwk = await exportJWK(PUBLIC_KEY_PEM);
  return NextResponse.json({ keys: [jwk] });
}
