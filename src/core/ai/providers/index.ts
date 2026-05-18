import { ProviderAdapter } from './base';
import { OpenAICompatAdapter } from './openai-compat';
import { DeepSeekAdapter } from './deepseek';
import { AnthropicAdapter } from './anthropic';
import { PROVIDER_DEFAULTS } from '../../config/defaults';
import { getApiKey } from '../../config/keys';
import type { ProviderConfig } from '../../../types';

const adapterCache = new Map<string, ProviderAdapter>();

export function getAdapter(providerId: string): ProviderAdapter | null {
  if (adapterCache.has(providerId)) {
    return adapterCache.get(providerId)!;
  }

  const config = PROVIDER_DEFAULTS[providerId];
  if (!config) return null;

  const apiKey = getApiKey(providerId);
  if (!apiKey && config.type !== 'search') return null;

  const adapter = createAdapter(config, apiKey || '');
  adapterCache.set(providerId, adapter);
  return adapter;
}

function createAdapter(config: ProviderConfig, apiKey: string): ProviderAdapter {
  switch (config.id) {
    case 'deepseek':
      return new DeepSeekAdapter(config, apiKey);
    case 'anthropic':
      return new AnthropicAdapter(config, apiKey);
    default:
      if (config.apiFormat === 'openai') {
        return new OpenAICompatAdapter(config, apiKey);
      }
      return new OpenAICompatAdapter(config, apiKey);
  }
}

export function clearAdapterCache(): void {
  adapterCache.clear();
}

export function listAvailableProviders(): string[] {
  return Object.keys(PROVIDER_DEFAULTS).filter((id) => {
    const config = PROVIDER_DEFAULTS[id];
    if (config.type === 'search') return true;
    return getApiKey(id) !== null;
  });
}

export async function listModelsForProvider(providerId: string): Promise<any[]> {
  const adapter = getAdapter(providerId);
  if (!adapter) return [];
  return adapter.listModels();
}

export async function listAllModels(): Promise<any[]> {
  const providers = listAvailableProviders();
  const results = await Promise.all(
    providers.map(async (id) => {
      const adapter = getAdapter(id);
      if (!adapter) return { provider: id, models: [] };
      const models = await adapter.listModels();
      return { provider: id, models };
    })
  );
  return results;
}
