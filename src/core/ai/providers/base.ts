import type { ChatRequest, ChatResponse, StreamChunk, ProviderConfig, ToolDef, ModelInfo } from '../../../types';

export abstract class ProviderAdapter {
  protected config: ProviderConfig;
  protected apiKey: string;

  constructor(config: ProviderConfig, apiKey: string) {
    this.config = config;
    this.apiKey = apiKey;
  }

  abstract chat(req: ChatRequest): Promise<ChatResponse>;
  abstract chatStream(req: ChatRequest): AsyncIterable<StreamChunk>;

  async listModels(): Promise<ModelInfo[]> {
    try {
      const base = this.config.baseUrl.replace(/\/+$/, '');
      const url = `${base}/models`;
      const resp = await this.fetchJSON(url, {
        method: 'GET',
        headers: this.buildHeaders(),
      });

      const items = resp.data || resp.models || resp;
      if (Array.isArray(items)) {
        return items.map((m: any) => ({
          id: m.id,
          name: m.name || m.display_name || m.id,
          providerId: this.config.id,
          contextLength: m.context_length || m.contextLength,
          maxOutput: m.max_output || m.maxOutput,
        }));
      }

      return [];
    } catch (err) {
      console.error('Failed to list models:', err);
      return [];
    }
  }

  async healthCheck(): Promise<{ ok: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      const models = await this.listModels();
      const model = models[0]?.id || 'test-model';
      await this.chat({
        model,
        messages: [{ id: 'test', sessionId: 'test', role: 'user', content: 'Hi', branchId: '', createdAt: Date.now() }],
        maxTokens: 5,
        stream: false,
      });
      return { ok: true, latencyMs: Date.now() - start };
    } catch (err) {
      return { ok: false, latencyMs: Date.now() - start };
    }
  }

  protected buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey && this.config.authHeader) {
      const authValue = this.config.authHeader.replace('${KEY}', this.apiKey);
      const [key, value] = authValue.split(': ');
      if (key && value) {
        headers[key] = value;
      }
    }

    return headers;
  }

  protected async fetchJSON(url: string, init: RequestInit): Promise<any> {
    const resp = await fetch(url, init);
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`API error ${resp.status}: ${text}`);
    }
    return resp.json();
  }

  protected async *fetchStream(url: string, init: RequestInit): AsyncIterable<string> {
    const resp = await fetch(url, init);
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`API error ${resp.status}: ${text}`);
    }

    const reader = resp.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const data = trimmed.slice(6);
          if (data === '[DONE]') return;
          yield data;
        }
      }
    }
  }
}
