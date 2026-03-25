const test = require('node:test');
const assert = require('node:assert/strict');
require('ts-node/register/transpile-only');
require('../../../scripts/register-alias.cjs');

const { getIntegrationRuntimePolicy, listIntegrationRuntimePolicies } = require('../../../src/lib/platform/integrations/policy');
const { IntegrationError, UpstreamUnavailableError, toIntegrationWarning, toNormalizedAdapterError } = require('../../../src/lib/platform/integrations/errors');
const { tryOrWarn } = require('../../../src/lib/bff/services/shared');
const { createPlatformAdapters } = require('../../../src/lib/platform/adapters/factory');
const { getIntegrationEnv } = require('../../../src/lib/platform/integrations/config');

test('policy registry classifies launch-critical and optional engines consistently', () => {
  const policies = listIntegrationRuntimePolicies(getIntegrationEnv());
  assert.equal(policies.odoo.criticality, 'launch_critical');
  assert.equal(policies.lending.criticality, 'launch_critical');
  assert.equal(policies.marble.criticality, 'launch_critical');
  assert.equal(policies.docspell.criticality, 'optional');
  assert.equal(policies.metabase.criticality, 'optional');
});

test('policy includes fail-open/fail-closed defaults and rollout flags', () => {
  const authentik = getIntegrationRuntimePolicy({ adapterKey: 'authentik' });
  const odoo = getIntegrationRuntimePolicy({ adapterKey: 'odoo' });
  assert.equal(authentik.defaultFailureMode, 'fail_closed');
  assert.equal(odoo.defaultFailureMode, 'fail_open');
  assert.equal(typeof odoo.rolloutFlag, 'string');
  assert.ok(odoo.rolloutFlag.length > 0);
});

test('normalized adapter error preserves code and retryability', () => {
  const error = new UpstreamUnavailableError({
    message: 'odoo unavailable',
    sourceSystem: 'odoo',
    operation: 'odoo.listInvoices',
    correlationId: 'corr-1',
  });
  const normalized = toNormalizedAdapterError(error);
  assert.equal(normalized.code, 'upstream_unavailable_error');
  assert.equal(normalized.retryable, true);
  assert.equal(normalized.sourceSystem, 'odoo');
  assert.equal(normalized.operation, 'odoo.listInvoices');
});

test('integration warning helper maps integration error context', () => {
  const warning = toIntegrationWarning(
    new IntegrationError('upstream_timeout_error', {
      message: 'timed out',
      sourceSystem: 'lending',
      operation: 'lending.getLoan',
      retryable: true,
      correlationId: 'corr-timeout',
    }),
    {
      code: 'loan_unavailable',
      message: 'Loan data unavailable',
      sourceSystem: 'lending',
    },
  );
  assert.equal(warning.code, 'loan_unavailable');
  assert.equal(warning.retryable, true);
  assert.equal(warning.operation, 'lending.getLoan');
  assert.equal(warning.correlationId, 'corr-timeout');
});

test('tryOrWarn uses normalized warning contract on adapter failure', async () => {
  const result = await tryOrWarn(
    async () => {
      throw new UpstreamUnavailableError({
        message: 'marble unavailable',
        sourceSystem: 'marble',
        operation: 'marble.getRiskSummary',
        retryable: true,
        correlationId: 'corr-risk',
      });
    },
    {
      code: 'compliance_unavailable',
      message: 'Compliance unavailable',
      sourceSystem: 'marble',
      retryable: true,
    },
  );

  assert.ok(result.warning);
  assert.equal(result.warning.code, 'compliance_unavailable');
  assert.equal(result.warning.retryable, true);
  assert.equal(result.warning.operation, 'marble.getRiskSummary');
  assert.equal(result.warning.correlationId, 'corr-risk');
});

test('all active adapters expose runtime policy through shared adapter base contract', async () => {
  const adapters = createPlatformAdapters();
  const [odooPolicy, lendingPolicy, marblePolicy, n8nPolicy] = await Promise.all([
    adapters.odoo.getRuntimePolicy(),
    adapters.lending.getRuntimePolicy(),
    adapters.marble.getRuntimePolicy(),
    adapters.n8n.getRuntimePolicy(),
  ]);

  [odooPolicy, lendingPolicy, marblePolicy, n8nPolicy].forEach((policy) => {
    assert.ok(policy.adapterKey);
    assert.ok(['live', 'mock', 'disabled'].includes(policy.mode));
    assert.equal(typeof policy.timeoutMs, 'number');
    assert.equal(typeof policy.retryCount, 'number');
  });
});
