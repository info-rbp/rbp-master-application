export type AdapterHealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
export type AdapterAuthStatus = 'valid' | 'invalid' | 'unknown';

export type AdapterHealth = {
  adapterKey: string;
  status: AdapterHealthStatus;
  checkedAt: string;
  latencyMs?: number;
  authStatus: AdapterAuthStatus;
  mode?: 'live' | 'mock' | 'disabled';
  criticality?: 'launch_critical' | 'internal_accelerator' | 'optional';
  details?: Record<string, unknown>;
};
