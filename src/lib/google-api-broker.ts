import { firestore } from '@/firebase/server';
import { UserGoogleCredentials } from '@/lib/definitions';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

export async function getGoogleAuthUrl(userId: string, scopes: string[]): Promise<string> {
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state,
  });
}

export async function handleGoogleCallback(code: string, state: string): Promise<void> {
  const { userId } = JSON.parse(Buffer.from(state, 'base64').toString('ascii'));
  const { tokens } = await oauth2Client.getToken(code);

  const credentials: UserGoogleCredentials = {
    userId,
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token!,
    expiryDate: tokens.expiry_date!,
    scopes: (tokens.scope || '').split(' '),
  };

  await firestore.collection('user_google_credentials').doc(userId).set(credentials);
}

export async function getGoogleAccessToken(userId: string, scopes: string[]): Promise<string> {
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
    const newCreds: UserGoogleCredentials = {
      ...creds,
      accessToken: credentials.access_token!,
      expiryDate: credentials.expiry_date!,
    };
    await firestore.collection('user_google_credentials').doc(userId).set(newCreds);
    return credentials.access_token!;
  }

  return creds.accessToken;
}
