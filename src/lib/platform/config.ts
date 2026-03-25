const bool = (value: string | undefined, fallback = false) => {
  if (value == null) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

export const platformEnv = {
  appBaseUrl: process.env.APP_BASE_URL ?? 'http://localhost:3000',
  apiBaseUrl: process.env.API_BASE_URL ?? process.env.APP_BASE_URL ?? 'http://localhost:3000',
  sessionSecret: process.env.SESSION_SECRET ?? 'development-session-secret-change-me',
  authentikIssuerUrl: process.env.AUTHENTIK_ISSUER_URL,
  authentikClientId: process.env.AUTHENTIK_CLIENT_ID,
  authentikClientSecret: process.env.AUTHENTIK_CLIENT_SECRET,
  authentikRedirectUri: process.env.AUTHENTIK_REDIRECT_URI,
  authentikPostLogoutRedirectUri:
    process.env.AUTHENTIK_POST_LOGOUT_REDIRECT_URI ?? process.env.APP_BASE_URL ?? 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  localAuthEnabled:
    bool(process.env.LOCAL_AUTH_ENABLED, process.env.NODE_ENV !== 'production') ||
    !process.env.AUTHENTIK_ISSUER_URL ||
    !process.env.AUTHENTIK_CLIENT_ID ||
    !process.env.AUTHENTIK_REDIRECT_URI,
};

export function isAuthentikConfigured() {
  return Boolean(
    platformEnv.authentikIssuerUrl &&
      platformEnv.authentikClientId &&
      platformEnv.authentikRedirectUri,
  );
}
