import type { OdooAdapterConfig } from '../../integrations/config';
import { validateLiveConfig } from '../../integrations/config';

export function createOdooAuthHeaders(config: OdooAdapterConfig) {
  validateLiveConfig('odoo', config, [
    ['ODOO_BASE_URL', config.baseUrl],
    ['ODOO_USERNAME', config.username],
    ['ODOO_PASSWORD or ODOO_API_KEY', config.password ?? config.apiKey],
  ]);

  if (config.mode !== 'live') {
    return {};
  }

  if (config.apiKey) {
    return {
      Authorization: `Bearer ${config.apiKey}`,
      'x-odoo-db': config.database ?? '',
      'x-odoo-username': config.username ?? '',
    };
  }

  const basic = Buffer.from(`${config.username}:${config.password}`).toString('base64');
  return {
    Authorization: `Basic ${basic}`,
    'x-odoo-db': config.database ?? '',
  };
}
