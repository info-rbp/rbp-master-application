
import { NextRequest, NextResponse } from "next/server";
import { handleGoogleCallback } from "@/lib/google-api-broker";

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code")!;
    const state = req.nextUrl.searchParams.get("state")!;

    await handleGoogleCallback(code, state);

    return NextResponse.redirect("/settings/integrations?status=success");
}
