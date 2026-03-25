import type { N8nAdapterConfig } from '../../integrations/config';
import { validateLiveConfig } from '../../integrations/config';

export function createN8nAuthHeaders(config: N8nAdapterConfig) {
  validateLiveConfig('n8n', config, [
    ['N8N_BASE_URL', config.baseUrl],
    ['N8N_API_KEY', config.apiKey],
  ]);

  if (config.mode !== 'live') {
    return {};
  }

  return {
    'x-api-key': config.apiKey ?? '',
  };
}
