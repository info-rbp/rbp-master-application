'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { PlatformSession, PlatformSessionResponse } from '@/lib/platform/types';
import { canPermission } from '@/lib/platform/permissions';

type PlatformSessionContextValue = {
  loading: boolean;
  error: string | null;
  authenticated: boolean;
  session: PlatformSession | null;
  refresh: () => Promise<void>;
  switchTenant: (tenantId: string, workspaceId?: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (resource: string, action: string) => boolean;
  hasModule: (moduleKey: string) => boolean;
};

const PlatformSessionContext = createContext<PlatformSessionContextValue | undefined>(undefined);

async function fetchSession(): Promise<PlatformSessionResponse> {
  const response = await fetch('/api/session', { credentials: 'include', cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Unable to load session');
  }
  return response.json();
}

export function PlatformSessionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<PlatformSession | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSession();
      setSession(result.authenticated ? result.session : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load session');
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const switchTenant = useCallback(async (tenantId: string, workspaceId?: string) => {
    const response = await fetch('/api/session/switch-tenant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ tenantId, workspaceId }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: 'Tenant switch failed' }));
      throw new Error(body.error ?? 'Tenant switch failed');
    }
    const result = (await response.json()) as PlatformSessionResponse;
    setSession(result.authenticated ? result.session : null);
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setSession(null);
    window.location.href = '/';
  }, []);

  const value = useMemo<PlatformSessionContextValue>(() => ({
    loading,
    error,
    authenticated: Boolean(session),
    session,
    refresh,
    switchTenant,
    logout,
    can: (resource: string, action: string) => (session ? canPermission(session.effectivePermissions, resource, action) : false),
    hasModule: (moduleKey: string) => Boolean(session?.enabledModules.includes(moduleKey as never)),
  }), [loading, error, session, refresh, switchTenant, logout]);

  return <PlatformSessionContext.Provider value={value}>{children}</PlatformSessionContext.Provider>;
}

export function usePlatformSession() {
  const context = useContext(PlatformSessionContext);
  if (!context) {
    throw new Error('usePlatformSession must be used within PlatformSessionProvider');
  }
  return context;
}
