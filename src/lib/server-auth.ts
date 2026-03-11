import { NextRequest } from 'next/server';
import * as admin from 'firebase-admin';
import { firestore } from '@/firebase/server';

export type AuthContext = {
  userId: string;
  role: 'admin' | 'member';
  email?: string;
};

async function getBearerToken(request: NextRequest) {
  const header = request.headers.get('authorization') ?? request.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
}

export async function getRequestAuthContext(request: NextRequest): Promise<AuthContext | null> {
  const token = await getBearerToken(request);
  if (!token) return null;

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const adminDoc = await firestore.collection('roles_admin').doc(decoded.uid).get();
    return {
      userId: decoded.uid,
      role: adminDoc.exists ? 'admin' : 'member',
      email: decoded.email,
    };
  } catch {
    return null;
  }
}
