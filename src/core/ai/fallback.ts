import { getAdapter, listAvailableProviders } from './providers';
import { PROVIDER_DEFAULTS } from '../config/defaults';
import type { ProviderAdapter } from './providers/base';

export function getFallbackAdapter(preferredProviderId: string): ProviderAdapter | null {
  const primary = getAdapter(preferredProviderId);
  if (primary) return primary;

  const fallbackOrder = [
    'deepseek',
    'xiaomi_mimo',
    'openai',
    'anthropic',
    'openrouter',
    'siliconflow',
    'moonshot',
    'groq',
  ];

  for (const id of fallbackOrder) {
    if (id === preferredProviderId) continue;
    const adapter = getAdapter(id);
    if (adapter) return adapter;
  }

  return null;
}

export async function testProvider(providerId: string): Promise<{ ok: boolean; latencyMs: number }> {
  const adapter = getAdapter(providerId);
  if (!adapter) return { ok: false, latencyMs: 0 };
  return adapter.healthCheck();
}
