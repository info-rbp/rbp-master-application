
import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google-api-broker";
import { cookies } from "next/headers";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/firebase/server";

export async function GET(req: NextRequest) {
    const sessionCookie = cookies().get("rbp_session")?.value;
    if (!sessionCookie) {
        return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    const auth = getAuth(getAdminApp());
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    const uid = decoded.uid;

    const scopes = req.nextUrl.searchParams.get("scopes")?.split(",") || [];
    const authUrl = await getGoogleAuthUrl(uid, scopes);

    return NextResponse.redirect(authUrl);
}
