import type { MarbleAdapterConfig } from '../../integrations/config';
import { validateLiveConfig } from '../../integrations/config';

export function createMarbleAuthHeaders(config: MarbleAdapterConfig) {
  validateLiveConfig('marble', config, [
    ['MARBLE_BASE_URL', config.baseUrl],
    ['MARBLE_API_KEY', config.apiKey],
  ]);

  if (config.mode !== 'live') {
    return {};
  }

  return {
    Authorization: `Bearer ${config.apiKey}`,
  };
}
