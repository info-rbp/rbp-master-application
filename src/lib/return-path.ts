export const DEFAULT_AUTH_RETURN_PATH = '/account';

export function sanitizeReturnPath(value: string | null | undefined): string {
  if (!value) return DEFAULT_AUTH_RETURN_PATH;
  if (!value.startsWith('/')) return DEFAULT_AUTH_RETURN_PATH;
  if (value.startsWith('//')) return DEFAULT_AUTH_RETURN_PATH;
  if (value.includes('://')) return DEFAULT_AUTH_RETURN_PATH;
  return value;
}

export function buildAuthRedirectPath(basePath: '/login' | '/signup', returnTo: string): string {
  const safeReturn = sanitizeReturnPath(returnTo);
  const query = new URLSearchParams({ returnTo: safeReturn });
  return `${basePath}?${query.toString()}`;
}

export function resolvePostAuthPath(returnTo: string | null | undefined): string {
  return sanitizeReturnPath(returnTo);
}
