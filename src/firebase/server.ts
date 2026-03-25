import '@/lib/server-only';

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

function getFirebaseCredential(): admin.credential.Credential | undefined {
  const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: normalizePrivateKey(privateKey),
    });
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT) {
    return admin.credential.applicationDefault();
  }

  return undefined;
}

export function getAdminApp(): admin.app.App {
  const existingApp = admin.apps.find((app): app is admin.app.App => Boolean(app));
  if (existingApp) {
    return existingApp;
  }

  const credential = getFirebaseCredential();
  const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (credential) {
    return admin.initializeApp({
      credential,
      projectId,
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  return admin.initializeApp({
    projectId: projectId ?? 'demo-project',
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export const db = new Proxy({} as FirebaseFirestore.Firestore, {
  get(_target, prop) {
    const instance = getFirestore(getAdminApp()) as unknown as Record<PropertyKey, unknown>;
    const value = instance[prop];

    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(instance) : value;
  },
});

export const firestore = db;

export const auth = new Proxy({} as ReturnType<typeof getAuth>, {
  get(_target, prop) {
    const instance = getAuth(getAdminApp()) as unknown as Record<PropertyKey, unknown>;
    const value = instance[prop];

    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(instance) : value;
  },
});
