import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import * as admin from 'firebase-admin';
import { firestore } from '@/firebase/server';

export const AUTH_COOKIE_NAME = 'rbp_id_token';

export type AuthRole = 'owner' | 'admin' | 'member' | 'viewer' | 'support' | 'content_admin' | 'super_admin';

export type AuthContext = {
  userId: string;
  role: AuthRole;
  email?: string;
  emailVerified?: boolean;
};

export class AuthorizationError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = 'AuthorizationError';
    this.status = status;
  }
}

async function getBearerToken(request: NextRequest) {
  const header = request.headers.get('authorization') ?? request.headers.get('Authorization');
  if (header?.startsWith('Bearer ')) {
    return header.slice('Bearer '.length).trim();
  }

  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  return cookieToken ?? null;
}

async function getAuthContextFromIdToken(token: string): Promise<AuthContext | null> {
  if (!token) return null;

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const adminDoc = await firestore.collection('roles_admin').doc(decoded.uid).get();
    const userDoc = await firestore.collection('users').doc(decoded.uid).get();
    const user = userDoc.data();

    let role: AuthRole = 'member'; // Default role

    if (adminDoc.exists) {
        role = 'admin';
    }

    if (user && user.role) {
        role = user.role;
    }

    return {
      userId: decoded.uid,
      role: role,
      email: decoded.email,
      emailVerified: Boolean(decoded.email_verified),
    };
  } catch {
    return null;
  }
}

export async function verifyIdToken(token: string) {
  return admin.auth().verifyIdToken(token);
}

export async function getRequestAuthContext(request: NextRequest): Promise<AuthContext | null> {
  const token = await getBearerToken(request);
  if (!token) return null;
  return getAuthContextFromIdToken(token);
}

export async function getServerAuthContext(): Promise<AuthContext | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return getAuthContextFromIdToken(token);
}

export async function requireAdminServerContext() {
  const auth = await getServerAuthContext();
  if (!auth) {
    throw new AuthorizationError('Unauthorized', 401);
  }
  if (auth.role !== 'admin') {
    throw new AuthorizationError('Forbidden', 403);
  }

  return auth;
}

export async function requireAdminRequestContext(request: NextRequest) {
  const auth = await getRequestAuthContext(request);
  if (!auth) {
    throw new AuthorizationError('Unauthorized', 401);
  }
  if (auth.role !== 'admin') {
    throw new AuthorizationError('Forbidden', 403);
  }

  return auth;
}
