
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuth } from "firebase-admin/auth";
import { SignJWT, importPKCS8 } from "jose";
import { getAdminApp, firestore } from "@/firebase/server";
import { getEffectiveMembershipTier, canAccessTool } from "@/lib/entitlements";
import { getMembershipAccessGrantsForUser } from "@/lib/data";
import { getToolAdapter } from "@/lib/tool-adapters";

async function ensureToolAccount(userId: string, toolKey: string) {
    const adapter = getToolAdapter(toolKey);
    if (!adapter) {
        throw new Error(`No adapter found for tool: ${toolKey}`);
    }
    const tool = (await firestore.collection('tools_catalog').doc(toolKey).get()).data();
    if (!tool) {
        throw new Error(`Tool not found in catalog: ${toolKey}`);
    }
    return await adapter.ensureAccount(userId, tool as any);
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { toolKey: string } }) {
  const { toolKey } = params;
  const sessionCookie = (cookies()).get("rbp_session")?.value;
  if (!sessionCookie) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const auth = getAuth(getAdminApp());
  const decoded = await auth.verifySessionCookie(sessionCookie, true);
  const uid = decoded.uid;

  const [userSnap, toolSnap, grants] = await Promise.all([
    firestore.collection("users").doc(uid).get(),
    firestore.collection("tools_catalog").doc(toolKey).get(),
    getMembershipAccessGrantsForUser(uid),
  ]);

  if (!userSnap.exists || !toolSnap.exists) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const user = userSnap.data()!;
  const tool = toolSnap.data()!;

  const currentTier = getEffectiveMembershipTier({
    membershipTier: user.membershipTier ?? null,
    membershipStatus: user.membershipStatus ?? null,
    planCode: user.membershipPlanCode ?? null,
    grants,
  });

  const access = canAccessTool({
      currentTier,
      requiredTier: tool.requiredTier,
      isAuthenticated: true,
      accountStatus: user.accountStatus,
  });

  if (!access.allowed) {
    return NextResponse.json({ error: access.reason }, { status: 403 });
  }

  const account = await ensureToolAccount(uid, toolKey);

  const privateKeyPem = process.env.TOOL_LAUNCH_PRIVATE_KEY!;
  const privateKey = await importPKCS8(privateKeyPem, "RS256");

  const token = await new SignJWT({
    email: user.email,
    toolKey,
    membershipTier: currentTier,
    tenantId: account.tenantId,
    workspaceId: account.externalWorkspaceId,
    role: account.role,
    googleBrokerAllowed: true,
    googleScopes: tool.googleBrokerFeatures ?? [],
  })
    .setProtectedHeader({ alg: "RS256", kid: "launch-key-1" })
    .setIssuer(process.env.NEXT_PUBLIC_APP_URL)
    .setAudience(`tool:${toolKey}`)
    .setSubject(uid)
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime("60s")
    .sign(privateKey);

  await firestore.collection("tool_launch_audit").add({
    userId: uid,
    toolKey,
    tenantId: account.tenantId,
    result: "success",
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({
    redirectUrl: `${tool.baseUrl}/auth/launch?token=${encodeURIComponent(token)}`
  });
}
