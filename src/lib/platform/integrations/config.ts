const bool = (value: string | undefined, fallback = false) => {
  if (value == null) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const numberFromEnv = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export type AdapterRuntimeMode = 'live' | 'mock' | 'disabled';

export type AdapterRuntimeConfig = {
  enabled: boolean;
  mode: AdapterRuntimeMode;
  baseUrl?: string;
  timeoutMs: number;
  retryCount: number;
  debugLogging: boolean;
};

export type OdooAdapterConfig = AdapterRuntimeConfig & {
  database?: string;
  username?: string;
  password?: string;
  apiKey?: string;
};

export type LendingAdapterConfig = AdapterRuntimeConfig & {
  apiKey?: string;
  apiSecret?: string;
  username?: string;
  password?: string;
};

export type MarbleAdapterConfig = AdapterRuntimeConfig & {
  apiKey?: string;
};

export type N8nAdapterConfig = AdapterRuntimeConfig & {
  apiKey?: string;
};

export type PlatformIntegrationEnv = {
  defaultTimeoutMs: number;
  defaultRetryCount: number;
  debugLogging: boolean;
  odoo: OdooAdapterConfig;
  lending: LendingAdapterConfig;
  marble: MarbleAdapterConfig;
  n8n: N8nAdapterConfig;
};

function resolveMode(name: string, baseUrl?: string): AdapterRuntimeMode {
  const explicit = process.env[`${name}_MODE`]?.toLowerCase();
  if (explicit === 'live' || explicit === 'mock' || explicit === 'disabled') {
    return explicit;
  }
  if (bool(process.env[`${name}_MOCK`])) return 'mock';
  if (bool(process.env[`${name}_ENABLED`], Boolean(baseUrl))) return baseUrl ? 'live' : 'mock';
  return baseUrl ? 'live' : 'mock';
}

export function getIntegrationEnv(): PlatformIntegrationEnv {
  const defaultTimeoutMs = numberFromEnv(process.env.PLATFORM_INTEGRATION_TIMEOUT_MS, 8_000);
  const defaultRetryCount = numberFromEnv(process.env.PLATFORM_INTEGRATION_RETRY_COUNT, 2);
  const debugLogging = bool(process.env.PLATFORM_INTEGRATION_DEBUG, process.env.NODE_ENV !== 'production');

  const odooBaseUrl = process.env.ODOO_BASE_URL;
  const odooMode = resolveMode('ODOO', odooBaseUrl);
  const lendingBaseUrl = process.env.LENDING_BASE_URL;
  const lendingMode = resolveMode('LENDING', lendingBaseUrl);
  const marbleBaseUrl = process.env.MARBLE_BASE_URL;
  const marbleMode = resolveMode('MARBLE', marbleBaseUrl);
  const n8nBaseUrl = process.env.N8N_BASE_URL;
  const n8nMode = resolveMode('N8N', n8nBaseUrl);

  return {
    defaultTimeoutMs,
    defaultRetryCount,
    debugLogging,
    odoo: {
      enabled: odooMode !== 'disabled',
      mode: odooMode,
      baseUrl: odooBaseUrl,
      database: process.env.ODOO_DATABASE,
      username: process.env.ODOO_USERNAME,
      password: process.env.ODOO_PASSWORD,
      apiKey: process.env.ODOO_API_KEY,
      timeoutMs: numberFromEnv(process.env.ODOO_TIMEOUT_MS, defaultTimeoutMs),
      retryCount: numberFromEnv(process.env.ODOO_RETRY_COUNT, defaultRetryCount),
      debugLogging,
    },
    lending: {
      enabled: lendingMode !== 'disabled',
      mode: lendingMode,
      baseUrl: lendingBaseUrl,
      apiKey: process.env.LENDING_API_KEY,
      apiSecret: process.env.LENDING_API_SECRET,
      username: process.env.LENDING_USERNAME,
      password: process.env.LENDING_PASSWORD,
      timeoutMs: numberFromEnv(process.env.LENDING_TIMEOUT_MS, defaultTimeoutMs),
      retryCount: numberFromEnv(process.env.LENDING_RETRY_COUNT, defaultRetryCount),
      debugLogging,
    },
    marble: {
      enabled: marbleMode !== 'disabled',
      mode: marbleMode,
      baseUrl: marbleBaseUrl,
      apiKey: process.env.MARBLE_API_KEY,
      timeoutMs: numberFromEnv(process.env.MARBLE_TIMEOUT_MS, defaultTimeoutMs),
      retryCount: numberFromEnv(process.env.MARBLE_RETRY_COUNT, defaultRetryCount),
      debugLogging,
    },
    n8n: {
      enabled: n8nMode !== 'disabled',
      mode: n8nMode,
      baseUrl: n8nBaseUrl,
      apiKey: process.env.N8N_API_KEY,
      timeoutMs: numberFromEnv(process.env.N8N_TIMEOUT_MS, defaultTimeoutMs),
      retryCount: numberFromEnv(process.env.N8N_RETRY_COUNT, defaultRetryCount),
      debugLogging,
    },
  };
}

export function validateLiveConfig(adapterKey: string, config: AdapterRuntimeConfig, requiredFields: Array<[string, unknown]>) {
  if (config.mode !== 'live') return;
  const missing = requiredFields.filter(([, value]) => !value).map(([key]) => key);
  if (missing.length > 0) {
    throw new Error(`${adapterKey}_config_missing:${missing.join(',')}`);
  }
}
