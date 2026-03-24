import { getPlatformAdapters } from '../adapters/factory';
import { listIntegrationRuntimePolicies } from './policy';
import type { AdapterRequestContext } from './tracing';

export async function getPlatformIntegrationSnapshot(context?: AdapterRequestContext) {
  const adapters = getPlatformAdapters();
  const [odooHealth, lendingHealth, marbleHealth, n8nHealth] = await Promise.all([
    adapters.odoo.getHealth(context),
    adapters.lending.getHealth(context),
    adapters.marble.getHealth(context),
    adapters.n8n.getHealth(context),
  ]);

  return {
    health: {
      odoo: odooHealth,
      lending: lendingHealth,
      marble: marbleHealth,
      n8n: n8nHealth,
    },
    runtimePolicy: listIntegrationRuntimePolicies(),
    capabilities: {
      odoo: await adapters.odoo.getCapabilities(context),
      lending: await adapters.lending.getCapabilities(context),
      marble: await adapters.marble.getCapabilities(context),
      n8n: await adapters.n8n.getCapabilities(context),
    },
  };
}

export async function getCustomerOperationsOverview(context?: AdapterRequestContext) {
  const adapters = getPlatformAdapters();
  const [customers, invoices, tickets] = await Promise.all([
    adapters.odoo.findCustomers({ limit: 5 }, context),
    adapters.odoo.listInvoices({ limit: 5 }, context),
    adapters.odoo.listSupportTickets({ limit: 5 }, context),
  ]);

  return {
    customers,
    invoices,
    tickets,
  };
}
