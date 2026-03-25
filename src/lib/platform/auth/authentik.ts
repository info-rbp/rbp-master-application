import { createHash, randomBytes } from 'crypto';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { isAuthentikConfigured, platformEnv } from '../config';

type OidcDiscoveryDocument = {
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint?: string;
  jwks_uri: string;
  issuer: string;
};

export type OidcTokenResponse = {
  access_token: string;
  expires_in?: number;
  id_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

let discoveryCache: OidcDiscoveryDocument | null = null;

export async function discoverOidcConfiguration(): Promise<OidcDiscoveryDocument> {
  if (discoveryCache) return discoveryCache;
  if (!isAuthentikConfigured() || !platformEnv.authentikIssuerUrl) {
    throw new Error('authentik_not_configured');
  }
  const url = new URL('/.well-known/openid-configuration', platformEnv.authentikIssuerUrl);
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error('oidc_discovery_failed');
  discoveryCache = (await response.json()) as OidcDiscoveryDocument;
  return discoveryCache;
}

export function createPkceVerifier() {
  const verifier = randomBytes(48).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

export function createNonce() {
  return randomBytes(18).toString('base64url');
}

export function createState() {
  return randomBytes(18).toString('base64url');
}

export async function buildAuthentikLoginUrl(input: {
  state: string;
  nonce: string;
  codeChallenge: string;
  returnTo: string;
}) {
  const discovery = await discoverOidcConfiguration();
  const url = new URL(discovery.authorization_endpoint);
  url.searchParams.set('client_id', platformEnv.authentikClientId!);
  url.searchParams.set('redirect_uri', platformEnv.authentikRedirectUri!);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid profile email offline_access');
  url.searchParams.set('state', input.state);
  url.searchParams.set('nonce', input.nonce);
  url.searchParams.set('code_challenge', input.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('prompt', 'login');
  url.searchParams.set('ui_locales', 'en');
  return { url: url.toString(), returnTo: input.returnTo };
}

export async function exchangeCodeForTokens(code: string, codeVerifier: string): Promise<OidcTokenResponse> {
  const discovery = await discoverOidcConfiguration();
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: platformEnv.authentikRedirectUri!,
    client_id: platformEnv.authentikClientId!,
    code_verifier: codeVerifier,
  });

  if (platformEnv.authentikClientSecret) {
    body.set('client_secret', platformEnv.authentikClientSecret);
  }

  const response = await fetch(discovery.token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });

  if (!response.ok) throw new Error('oidc_code_exchange_failed');
  return (await response.json()) as OidcTokenResponse;
}

export async function refreshTokens(refreshToken: string): Promise<OidcTokenResponse> {
  const discovery = await discoverOidcConfiguration();
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: platformEnv.authentikClientId!,
  });

  if (platformEnv.authentikClientSecret) {
    body.set('client_secret', platformEnv.authentikClientSecret);
  }

  const response = await fetch(discovery.token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });

  if (!response.ok) throw new Error('oidc_refresh_failed');
  return (await response.json()) as OidcTokenResponse;
}

export async function validateIdToken(idToken: string, nonce: string) {
  const discovery = await discoverOidcConfiguration();
  const jwks = createRemoteJWKSet(new URL(discovery.jwks_uri));
  const result = await jwtVerify(idToken, jwks, {
    issuer: discovery.issuer,
    audience: platformEnv.authentikClientId,
  });
  if (result.payload.nonce !== nonce) {
    throw new Error('oidc_nonce_mismatch');
  }
  return result.payload;
}

export async function buildLogoutUrl(idTokenHint?: string) {
  const discovery = await discoverOidcConfiguration();
  if (!discovery.end_session_endpoint) {
    return platformEnv.authentikPostLogoutRedirectUri;
  }
  const url = new URL(discovery.end_session_endpoint);
  url.searchParams.set('post_logout_redirect_uri', platformEnv.authentikPostLogoutRedirectUri);
  if (idTokenHint) {
    url.searchParams.set('id_token_hint', idTokenHint);
  }
  return url.toString();
}

export type AuthentikClaims = JWTPayload & {
  email?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  groups?: string[];
  sub: string;
  picture?: string;
};
