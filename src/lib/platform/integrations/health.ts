export type AdapterHealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
export type AdapterAuthStatus = 'valid' | 'invalid' | 'unknown';

export type AdapterHealth = {
  adapterKey: string;
  status: AdapterHealthStatus;
  checkedAt: string;
  latencyMs?: number;
  authStatus: AdapterAuthStatus;
  details?: Record<string, unknown>;
};
