import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

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

export function getAdminApp(): admin.app.App {
  const existingApp = admin.apps.find((app): app is admin.app.App => Boolean(app));
  if (existingApp) {
    return existingApp;
  }

  if (process.env.NODE_ENV === 'production') {
    return admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    const normalizedPrivateKey = normalizePrivateKey(privateKey);

    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey: normalizedPrivateKey,
        clientEmail,
      }),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  }

  return admin.initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'demo-project',
  });
}

export const db = new Proxy({} as FirebaseFirestore.Firestore, {
  get(_target, prop, _receiver) {
    const instance = getFirestore(getAdminApp()) as unknown as Record<PropertyKey, unknown>;
    const value = instance[prop];

    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(instance) : value;
  },
});

export const firestore = db;

export const auth = new Proxy({} as ReturnType<typeof getAuth>, {
  get(_target, prop, _receiver) {
    const instance = getAuth(getAdminApp()) as unknown as Record<PropertyKey, unknown>;
    const value = instance[prop];

    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(instance) : value;
  },
});
