
import { NextRequest, NextResponse } from "next/server";
import { getGoogleAccessToken } from "@/lib/google-api-broker";
import { google } from "googleapis";
import { cookies } from "next/headers";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/firebase/server";

export async function POST(
    req: NextRequest,
    { params }: { params: { provider: string; operation: string } }
) {
    const sessionCookie = cookies().get("rbp_session")?.value;
    if (!sessionCookie) {
        return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    const auth = getAuth(getAdminApp());
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    const uid = decoded.uid;

    const { provider, operation } = params;
    const body = await req.json();

    try {
        const accessToken = await getGoogleAccessToken(uid, body.scopes);
        const apiUrl = `https://www.googleapis.com/${provider}/v3/calendars/${operation}`;

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body.payload),
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
