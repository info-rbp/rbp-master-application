import { getIntegrationEnv, type AdapterRuntimeConfig, type PlatformIntegrationEnv } from './config';
import type { IntegrationCriticality, IntegrationFailureMode, IntegrationRuntimePolicy } from './types';

export type IntegrationAdapterKey = 'authentik' | 'odoo' | 'lending' | 'marble' | 'n8n' | 'docspell' | 'metabase';

type IntegrationPolicyDefinition = {
  criticality: IntegrationCriticality;
  defaultFailureMode: IntegrationFailureMode;
  rolloutFlag: string;
};

const POLICY_DEFINITIONS: Record<IntegrationAdapterKey, IntegrationPolicyDefinition> = {
  authentik: {
    criticality: 'launch_critical',
    defaultFailureMode: 'fail_closed',
    rolloutFlag: 'integration.authentik.enabled',
  },
  odoo: {
    criticality: 'launch_critical',
    defaultFailureMode: 'fail_open',
    rolloutFlag: 'integration.odoo.enabled',
  },
  lending: {
    criticality: 'launch_critical',
    defaultFailureMode: 'fail_open',
    rolloutFlag: 'integration.lending.enabled',
  },
  marble: {
    criticality: 'launch_critical',
    defaultFailureMode: 'fail_open',
    rolloutFlag: 'integration.marble.enabled',
  },
  n8n: {
    criticality: 'internal_accelerator',
    defaultFailureMode: 'fail_open',
    rolloutFlag: 'integration.n8n.enabled',
  },
  docspell: {
    criticality: 'optional',
    defaultFailureMode: 'fail_open',
    rolloutFlag: 'integration.docspell.enabled',
  },
  metabase: {
    criticality: 'optional',
    defaultFailureMode: 'fail_open',
    rolloutFlag: 'integration.metabase.enabled',
  },
};

function resolveFailureMode(adapterKey: IntegrationAdapterKey, fallback: IntegrationFailureMode): IntegrationFailureMode {
  const explicit = process.env[`INTEGRATION_${adapterKey.toUpperCase()}_FAILURE_MODE`]?.toLowerCase();
  if (explicit === 'fail_open' || explicit === 'fail_closed') return explicit;
  return fallback;
}

function resolveRolloutFlag(adapterKey: IntegrationAdapterKey, fallback: string) {
  return process.env[`INTEGRATION_${adapterKey.toUpperCase()}_ROLLOUT_FLAG`] || fallback;
}

function toPolicy(adapterKey: IntegrationAdapterKey, config: AdapterRuntimeConfig): IntegrationRuntimePolicy {
  const definition = POLICY_DEFINITIONS[adapterKey];
  const failureMode = resolveFailureMode(adapterKey, definition.defaultFailureMode);
  const rolloutFlag = resolveRolloutFlag(adapterKey, definition.rolloutFlag);
  const enabled = config.enabled && config.mode !== 'disabled' && process.env[`INTEGRATION_${adapterKey.toUpperCase()}_DISABLED`] !== '1';

  return {
    adapterKey,
    mode: config.mode,
    enabled,
    criticality: definition.criticality,
    defaultFailureMode: failureMode,
    timeoutMs: config.timeoutMs,
    retryCount: config.retryCount,
    rolloutFlag,
  };
}

function mergePolicy(input: IntegrationRuntimePolicy, overrides?: Partial<IntegrationRuntimePolicy>) {
  return {
    ...input,
    ...overrides,
    adapterKey: input.adapterKey,
  };
}

export function getIntegrationRuntimePolicy(input: {
  adapterKey: IntegrationAdapterKey;
  env?: PlatformIntegrationEnv;
  overrides?: Partial<IntegrationRuntimePolicy>;
}): IntegrationRuntimePolicy {
  const env = input.env ?? getIntegrationEnv();
  if (input.adapterKey === 'authentik') {
    return mergePolicy(
      {
        adapterKey: 'authentik',
        mode: process.env.AUTHENTIK_ISSUER_URL ? 'live' : 'mock',
        enabled: Boolean(process.env.AUTHENTIK_ISSUER_URL),
        criticality: POLICY_DEFINITIONS.authentik.criticality,
        defaultFailureMode: resolveFailureMode('authentik', POLICY_DEFINITIONS.authentik.defaultFailureMode),
        timeoutMs: env.defaultTimeoutMs,
        retryCount: env.defaultRetryCount,
        rolloutFlag: resolveRolloutFlag('authentik', POLICY_DEFINITIONS.authentik.rolloutFlag),
      },
      input.overrides,
    );
  }

  if (input.adapterKey === 'odoo') return mergePolicy(toPolicy('odoo', env.odoo), input.overrides);
  if (input.adapterKey === 'lending') return mergePolicy(toPolicy('lending', env.lending), input.overrides);
  if (input.adapterKey === 'marble') return mergePolicy(toPolicy('marble', env.marble), input.overrides);
  if (input.adapterKey === 'n8n') return mergePolicy(toPolicy('n8n', env.n8n), input.overrides);

  // Placeholder policy records for later milestone adapters (not yet wired into the factory).
  const placeholder: AdapterRuntimeConfig = {
    enabled: false,
    mode: 'disabled',
    timeoutMs: env.defaultTimeoutMs,
    retryCount: env.defaultRetryCount,
    debugLogging: env.debugLogging,
  };
  if (input.adapterKey === 'docspell') return mergePolicy(toPolicy('docspell', placeholder), input.overrides);
  return mergePolicy(toPolicy('metabase', placeholder), input.overrides);
}

export function listIntegrationRuntimePolicies(env: PlatformIntegrationEnv = getIntegrationEnv()) {
  return {
    authentik: getIntegrationRuntimePolicy({ adapterKey: 'authentik', env }),
    odoo: getIntegrationRuntimePolicy({ adapterKey: 'odoo', env }),
    lending: getIntegrationRuntimePolicy({ adapterKey: 'lending', env }),
    marble: getIntegrationRuntimePolicy({ adapterKey: 'marble', env }),
    n8n: getIntegrationRuntimePolicy({ adapterKey: 'n8n', env }),
    docspell: getIntegrationRuntimePolicy({ adapterKey: 'docspell', env }),
    metabase: getIntegrationRuntimePolicy({ adapterKey: 'metabase', env }),
  };
}

