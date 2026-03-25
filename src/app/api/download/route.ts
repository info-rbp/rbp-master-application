import '@/lib/server-only';

import { NextRequest, NextResponse } from 'next/server';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

function ensureStorageAdminApp() {
  if (getApps().length) {
    return getApps()[0];
  }

  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  let credential = applicationDefault();

  if (serviceAccountKey) {
    try {
      credential = cert(JSON.parse(serviceAccountKey));
    } catch (error) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY; falling back to application default credentials.', error);
    }
  }

  return initializeApp({
    credential,
    storageBucket: bucket,
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get('file');
  if (!filePath) {
    return new NextResponse('File path is required', { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
    return NextResponse.json({ error: 'storage_bucket_not_configured' }, { status: 503 });
  }

  try {
    const app = ensureStorageAdminApp();
    const bucket = getStorage(app).bucket();
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
