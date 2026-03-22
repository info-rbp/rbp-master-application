import {
  AuthenticationError,
  AuthorizationError,
  IntegrationError,
  UpstreamConflictError,
  UpstreamMalformedResponseError,
  UpstreamNotFoundError,
  UpstreamRateLimitError,
  UpstreamTimeoutError,
  UpstreamUnavailableError,
  UpstreamValidationError,
  UpstreamUnknownError,
  toIntegrationError,
} from './errors';
import { logAdapterEvent } from './tracing';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type HttpRequestOptions = {
  path: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  timeoutMs?: number;
  retryCount?: number;
  retryable?: boolean;
  operation: string;
  correlationId?: string;
  authHeaders?: Record<string, string>;
};

export type HttpClientOptions = {
  sourceSystem: string;
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  timeoutMs: number;
  retryCount: number;
  fetchImpl?: typeof fetch;
  onBeforeRequest?: (options: HttpRequestOptions) => Promise<Record<string, string> | undefined> | Record<string, string> | undefined;
};

const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function createUrl(baseUrl: string | undefined, path: string, query?: HttpRequestOptions['query']) {
  if (!baseUrl) {
    throw new Error('base_url_missing');
  }
  const url = new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });
  return url;
}

function mapStatusToError(input: {
  sourceSystem: string;
  operation: string;
  status: number;
  message: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
  body?: unknown;
}): IntegrationError {
  const shared = {
    message: input.message,
    sourceSystem: input.sourceSystem,
    operation: input.operation,
    upstreamStatus: input.status,
    correlationId: input.correlationId,
    metadata: { ...input.metadata, body: input.body },
  };

  if (input.status === 401) return new AuthenticationError(shared);
  if (input.status === 403) return new AuthorizationError(shared);
  if (input.status === 404) return new UpstreamNotFoundError(shared);
  if (input.status === 409) return new UpstreamConflictError(shared);
  if (input.status === 422 || input.status === 400) return new UpstreamValidationError(shared);
  if (input.status === 429) return new UpstreamRateLimitError(shared);
  if (input.status >= 500) return new UpstreamUnavailableError(shared);
  return new UpstreamUnknownError(shared);
}

export class PlatformHttpClient {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: HttpClientOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async requestJson<T>(request: HttpRequestOptions): Promise<T> {
    const attempts = Math.max(0, request.retryable === false ? 0 : request.retryCount ?? this.options.retryCount);
    let currentAttempt = 0;
    let lastError: IntegrationError | undefined;

    while (currentAttempt <= attempts) {
      const startedAt = Date.now();
      const controller = new AbortController();
      const timeoutMs = request.timeoutMs ?? this.options.timeoutMs;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const url = createUrl(this.options.baseUrl, request.path, request.query);
        const beforeHeaders = await this.options.onBeforeRequest?.(request);
        const response = await this.fetchImpl(url, {
          method: request.method ?? 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...this.options.defaultHeaders,
            ...beforeHeaders,
            ...request.authHeaders,
            ...request.headers,
          },
          body: request.body === undefined ? undefined : JSON.stringify(request.body),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const latencyMs = Date.now() - startedAt;
        const text = await response.text();
        const parsed = text ? safeJsonParse(text) : undefined;

        if (!response.ok) {
          throw mapStatusToError({
            sourceSystem: this.options.sourceSystem,
            operation: request.operation,
            status: response.status,
            message: `${this.options.sourceSystem} returned HTTP ${response.status}`,
            correlationId: request.correlationId,
            metadata: { latencyMs, url: url.toString() },
            body: parsed ?? text,
          });
        }

        logAdapterEvent({
          level: 'info',
          sourceSystem: this.options.sourceSystem,
          operation: request.operation,
          correlationId: request.correlationId,
          message: 'Upstream request succeeded',
          metadata: { latencyMs, attempt: currentAttempt + 1 },
        });

        return parsed as T;
      } catch (error) {
        clearTimeout(timeoutId);
        const integrationError = normalizeHttpError(this.options.sourceSystem, request.operation, error, request.correlationId);
        lastError = integrationError;
        const shouldRetry = currentAttempt < attempts && integrationError.retryable && (request.retryable ?? isSafeMethod(request.method));
        logAdapterEvent({
          level: shouldRetry ? 'warn' : 'error',
          sourceSystem: this.options.sourceSystem,
          operation: request.operation,
          correlationId: request.correlationId,
          message: shouldRetry ? 'Retrying upstream request' : 'Upstream request failed',
          metadata: { attempt: currentAttempt + 1, code: integrationError.code, retryable: integrationError.retryable },
        });
        if (!shouldRetry) {
          throw integrationError;
        }
        await delay(100 * 2 ** currentAttempt);
        currentAttempt += 1;
      }
    }

    throw lastError ?? new UpstreamUnknownError({
      message: `${this.options.sourceSystem} request failed`,
      sourceSystem: this.options.sourceSystem,
      operation: request.operation,
    });
  }
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new UpstreamMalformedResponseError({
      message: 'Upstream returned malformed JSON',
      sourceSystem: 'unknown',
      operation: 'parse_json',
      cause: error,
      metadata: { bodyPreview: value.slice(0, 200) },
    });
  }
}

function isSafeMethod(method?: string) {
  return !method || method === 'GET';
}

function normalizeHttpError(sourceSystem: string, operation: string, error: unknown, correlationId?: string) {
  if (error instanceof IntegrationError) {
    if (error instanceof UpstreamMalformedResponseError && error.sourceSystem === 'unknown') {
      return new UpstreamMalformedResponseError({
        ...error,
        message: error.message,
        sourceSystem,
        operation,
        correlationId,
        metadata: error.metadata,
        cause: error.cause,
      });
    }
    return error;
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return new UpstreamTimeoutError({
      message: `${sourceSystem} request timed out during ${operation}`,
      sourceSystem,
      operation,
      correlationId,
      cause: error,
    });
  }

  return toIntegrationError({ sourceSystem, operation, error, correlationId });
}
