import * as admin from 'firebase-admin';

function normalizePrivateKey(value: string): string {
  const trimmed = value.trim();
  const withoutWrappingQuotes =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1)
      : trimmed;

  const normalized = withoutWrappingQuotes.replace(/\\n/g, '\n').trim();

  if (!normalized.includes('-----BEGIN PRIVATE KEY-----') || !normalized.includes('-----END PRIVATE KEY-----')) {
    throw new Error('Invalid FIREBASE_PRIVATE_KEY configuration: expected a PEM key with BEGIN/END PRIVATE KEY markers.');
  }

  return normalized;
}

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    const normalizedPrivateKey = normalizePrivateKey(privateKey);

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey: normalizedPrivateKey,
        clientEmail,
      }),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  } else {
    admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'demo-project',
    });
  }
}

export const firestore = admin.firestore();
