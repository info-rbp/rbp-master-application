import type { LendingAdapterConfig } from '../../integrations/config';
import { validateLiveConfig } from '../../integrations/config';

export function createLendingAuthHeaders(config: LendingAdapterConfig) {
  validateLiveConfig('lending', config, [
    ['LENDING_BASE_URL', config.baseUrl],
    ['LENDING_API_KEY or credentials', config.apiKey ?? config.username],
    ['LENDING_API_SECRET or password', config.apiSecret ?? config.password],
  ]);

  if (config.mode !== 'live') {
    return {};
  }

  if (config.apiKey && config.apiSecret) {
    return {
      Authorization: `token ${config.apiKey}:${config.apiSecret}`,
    };
  }

  const basic = Buffer.from(`${config.username}:${config.password}`).toString('base64');
  return {
    Authorization: `Basic ${basic}`,
  };
}
