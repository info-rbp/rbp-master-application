import type { AdapterHealth } from '../../integrations/health';
import { PlatformHttpClient } from '../../integrations/http';
import { getIntegrationRuntimePolicy, type IntegrationAdapterKey } from '../../integrations/policy';
import { toIntegrationWarning } from '../../integrations/errors';
import type { AdapterResponseEnvelope, AdapterSourceInfo, IntegrationRuntimePolicy, IntegrationWarning } from '../../integrations/types';
import { createTracingHeaders, logAdapterEvent, resolveCorrelationId, type AdapterRequestContext } from '../../integrations/tracing';

export abstract class BasePlatformAdapter {
  protected readonly httpClient: PlatformHttpClient;

  constructor(
    private readonly sourceInfo: AdapterSourceInfo,
    httpClient: PlatformHttpClient,
    private readonly defaultCapabilities: Array<{ key: string; label: string; supportsWrite: boolean; description: string }>,
  ) {
    this.httpClient = httpClient;
  }

  getSourceInfo(): AdapterSourceInfo {
    return this.sourceInfo;
  }

  async getCapabilities() {
    return this.defaultCapabilities;
  }

  async getRuntimePolicy(): Promise<IntegrationRuntimePolicy> {
    return getIntegrationRuntimePolicy({ adapterKey: this.sourceInfo.adapterKey as IntegrationAdapterKey, overrides: { mode: this.sourceInfo.mode } });
  }

  protected async withEnvelope<T>(
    context: AdapterRequestContext | undefined,
    operation: string,
    resolver: (correlationId: string) => Promise<T>,
  ): Promise<AdapterResponseEnvelope<T>> {
    const correlationId = resolveCorrelationId(context);
    const data = await resolver(correlationId);
    return {
      data,
      meta: {
        correlationId,
        source: this.getSourceInfo(),
        receivedAt: new Date().toISOString(),
      },
    };
  }

  protected async basicHealthCheck(context: AdapterRequestContext | undefined, path: string, operation = 'health.check'): Promise<AdapterHealth> {
    const correlationId = resolveCorrelationId(context);
    const startedAt = Date.now();
    try {
      await this.httpClient.requestJson<unknown>({
        path,
        operation,
        method: 'GET',
        correlationId,
        retryable: true,
        headers: createTracingHeaders({ ...context, correlationId }),
      });
      return {
        adapterKey: this.sourceInfo.adapterKey,
        status: 'healthy',
        authStatus: this.sourceInfo.mode === 'mock' ? 'unknown' : 'valid',
        checkedAt: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      logAdapterEvent({
        level: 'warn',
        sourceSystem: this.sourceInfo.adapterKey,
        operation,
        correlationId,
        message: 'Adapter health check degraded',
        metadata: { error: error instanceof Error ? error.message : String(error) },
      });
      return {
        adapterKey: this.sourceInfo.adapterKey,
        status: this.sourceInfo.mode === 'mock' ? 'healthy' : 'degraded',
        authStatus: 'unknown',
        checkedAt: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
        details: {
          reason: error instanceof Error ? error.message : String(error),
          mode: this.sourceInfo.mode,
        },
      };
    }
  }

  protected createWarning(error: unknown, fallback: Omit<IntegrationWarning, 'retryable'> & { retryable?: boolean }): IntegrationWarning {
    return toIntegrationWarning(error, fallback);
  }
}
