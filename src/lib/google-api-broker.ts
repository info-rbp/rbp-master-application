import '@/lib/server-only';

import { firestore } from '@/firebase/server';
import { UserGoogleCredentials } from '@/lib/definitions';
import { google } from 'googleapis';

function getRequiredEnv(name: 'GOOGLE_CLIENT_ID' | 'GOOGLE_CLIENT_SECRET' | 'GOOGLE_REDIRECT_URI'): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name.toLowerCase()}_not_configured`);
  }

  return value;
}

function createOAuth2Client() {
  return new google.auth.OAuth2(
    getRequiredEnv('GOOGLE_CLIENT_ID'),
    getRequiredEnv('GOOGLE_CLIENT_SECRET'),
    getRequiredEnv('GOOGLE_REDIRECT_URI'),
  );
}

function decodeGoogleState(state: string): { userId: string } {
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64').toString('utf8')) as { userId?: unknown };

    if (typeof parsed.userId !== 'string' || !parsed.userId.trim()) {
      throw new Error('missing_user_id');
    }

    return { userId: parsed.userId };
  } catch {
    throw new Error('invalid_google_oauth_state');
  }
}

export async function getGoogleAuthUrl(userId: string, scopes: string[]): Promise<string> {
  const oauth2Client = createOAuth2Client();
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
    state,
  });
}

export async function handleGoogleCallback(code: string, state: string): Promise<void> {
  const oauth2Client = createOAuth2Client();
  const { userId } = decodeGoogleState(state);
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
    throw new Error('incomplete_google_oauth_tokens');
  }

  const credentials: UserGoogleCredentials = {
    userId,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiryDate: tokens.expiry_date,
    scopes: (tokens.scope || '').split(' ').filter(Boolean),
  };

  await firestore.collection('user_google_credentials').doc(userId).set(credentials);
}

export async function getGoogleAccessToken(userId: string, scopes: string[]): Promise<string> {
  const oauth2Client = createOAuth2Client();
  const credsSnap = await firestore.collection('user_google_credentials').doc(userId).get();

  if (!credsSnap.exists) {
    throw new Error('no_google_credentials');
  }

  const creds = credsSnap.data() as UserGoogleCredentials;

  if (!scopes.every((scope) => creds.scopes.includes(scope))) {
    throw new Error('insufficient_google_scopes');
  }

  oauth2Client.setCredentials({
    access_token: creds.accessToken,
    refresh_token: creds.refreshToken,
    expiry_date: creds.expiryDate,
  });

  if (Date.now() > creds.expiryDate) {
    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token || !credentials.expiry_date) {
      throw new Error('failed_to_refresh_google_access_token');
    }

    const newCreds: UserGoogleCredentials = {
      ...creds,
      accessToken: credentials.access_token,
      expiryDate: credentials.expiry_date,
      refreshToken: credentials.refresh_token ?? creds.refreshToken,
      scopes: credentials.scope ? credentials.scope.split(' ').filter(Boolean) : creds.scopes,
    };

    await firestore.collection('user_google_credentials').doc(userId).set(newCreds);
    return newCreds.accessToken;
  }

  return creds.accessToken;
}
