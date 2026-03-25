/**
 * CSRF double-submit cookie protection.
 *
 * Strategy:
 * - On session creation we set a `rbp_csrf` cookie (not httpOnly so JS can read it).
 * - Cookie-mutating endpoints (POST) must receive the token back in an
 *   `x-csrf-token` header. We compare the header value with the cookie value.
 * - Because the cookie is SameSite=Lax + Secure in production, a cross-origin
 *   attacker cannot read it, making the double-submit check effective.
 */
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';

export const CSRF_COOKIE = 'rbp_csrf';
const CSRF_HEADER = 'x-csrf-token';

export function generateCsrfToken(): string {
  return randomBytes(24).toString('base64url');
}

export async function setCsrfCookie(token?: string) {
  const store = await cookies();
  const value = token ?? generateCsrfToken();
  store.set(CSRF_COOKIE, value, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
  return value;
}

export async function validateCsrf(request: Request): Promise<{ valid: boolean; reason?: string }> {
  if (process.env.NODE_ENV !== 'production' && process.env.CSRF_ENFORCE !== 'true') {
    return { valid: true };
  }

  const headerToken = request.headers.get(CSRF_HEADER);
  if (!headerToken) {
    return { valid: false, reason: 'missing_csrf_header' };
  }

  const store = await cookies();
  const cookieToken = store.get(CSRF_COOKIE)?.value;
  if (!cookieToken) {
    return { valid: false, reason: 'missing_csrf_cookie' };
  }

  if (headerToken !== cookieToken) {
    return { valid: false, reason: 'csrf_mismatch' };
  }

  return { valid: true };
}
