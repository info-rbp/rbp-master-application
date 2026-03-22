import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import type { PersistedPlatformSession } from './types';
import { platformEnv } from './config';

export const PLATFORM_SESSION_COOKIE = 'rbp_platform_session';
export const PLATFORM_AUTH_FLOW_COOKIE = 'rbp_platform_auth_flow';

function keyFromSecret() {
  return createHash('sha256').update(platformEnv.sessionSecret).digest();
}

export function seal<T>(value: T) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyFromSecret(), iv);
  const plaintext = Buffer.from(JSON.stringify(value), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64url');
}

export function unseal<T>(value?: string | null): T | null {
  if (!value) return null;
  try {
    const buffer = Buffer.from(value, 'base64url');
    const iv = buffer.subarray(0, 12);
    const authTag = buffer.subarray(12, 28);
    const encrypted = buffer.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', keyFromSecret(), iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
    return JSON.parse(decrypted) as T;
  } catch {
    return null;
  }
}

export function isExpired(session: Pick<PersistedPlatformSession, 'expiresAt'>) {
  return new Date(session.expiresAt).getTime() <= Date.now();
}
