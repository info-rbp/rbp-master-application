import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin SDK if not already initialized
import { initializeApp, cert, getApps } from 'firebase-admin/app';
if (!getApps().length) {
    initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!)),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get('file');

    if (!filePath) {
        return new NextResponse('File path is required', { status: 400 });
    }

    // In a real-world scenario, you would validate the user's access to the file here.
    // For this example, we will assume the user has access.

    try {
        const bucket = getStorage().bucket();
        const file = bucket.file(filePath);
        const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        });

        return NextResponse.redirect(signedUrl);
    } catch (error) {
        console.error(error);
        return new NextResponse('Error generating signed URL', { status: 500 });
    }
}
