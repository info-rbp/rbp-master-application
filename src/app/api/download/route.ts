import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';
import { getApps, initializeApp, cert, applicationDefault } from 'firebase-admin/app';

// Initialize Firebase Admin SDK only once. Use provided service account if available; otherwise fallback to default credentials.
if (!getApps().length) {
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string)),
        storageBucket: bucket,
      });
    } catch (error) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY', error);
      initializeApp({
        credential: applicationDefault(),
        storageBucket: bucket,
      });
    }
  } else {
    initializeApp({
      credential: applicationDefault(),
      storageBucket: bucket,
    });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get('file');
  if (!filePath) {
    return new NextResponse('File path is required', { status: 400 });
  }
  try {
    const bucket = getStorage().bucket();
    const file = bucket.file(filePath);
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000,
    });
    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error('Failed to generate signed URL', error);
    return new NextResponse('Failed to generate signed URL', { status: 500 });
  }
}
