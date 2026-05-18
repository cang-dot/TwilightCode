import { ProviderAdapter } from './base';
import type { ChatRequest, ChatResponse, StreamChunk, ProviderConfig, Message, ModelInfo } from '../../../types';

export class AnthropicAdapter extends ProviderAdapter {
  constructor(config: ProviderConfig, apiKey: string) {
    super(config, apiKey);
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      const url = `${this.config.baseUrl}/v1/models`;
      const resp = await this.fetchJSON(url, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
      });

      if (resp.data && Array.isArray(resp.data)) {
        return resp.data.map((m: any) => ({
          id: m.id,
          name: m.display_name || m.id,
          providerId: this.config.id,
          contextLength: m.context_length,
        }));
      }

      return [];
    } catch {
      return [];
    }
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const url = `${this.config.baseUrl}${this.config.chatEndpoint}`;
    const body = this.buildBody(req);

    const resp = await this.fetchJSON(url, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return this.parseResponse(resp);
  }

  async *chatStream(req: ChatRequest): AsyncIterable<StreamChunk> {
    const url = `${this.config.baseUrl}${this.config.chatEndpoint}`;
    const body = { ...this.buildBody(req), stream: true };

    for await (const data of this.fetchStream(url, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    })) {
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'content_block_delta') {
          yield {
            delta: parsed.delta?.text || undefined,
            reasoningDelta: parsed.delta?.thinking || undefined,
            done: false,
          };
        }
        if (parsed.type === 'message_stop') {
          yield { done: true };
        }
      } catch {
        // Skip malformed chunks
      }
    }
  }

  private buildBody(req: ChatRequest): Record<string, any> {
    const system = req.messages.find((m) => m.role === 'system');
    const nonSystem = req.messages.filter((m) => m.role !== 'system');

    return {
      model: req.model,
      max_tokens: req.maxTokens || 4096,
      system: system?.content,
      messages: nonSystem.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    };
  }

  private parseResponse(resp: any): ChatResponse {
    const content = resp.content?.map((c: any) => c.text || '').join('') || '';
    const thinking = resp.content?.find((c: any) => c.type === 'thinking')?.thinking;

    return {
      content,
      reasoningContent: thinking,
      usage: {
        promptTokens: resp.usage?.input_tokens || 0,
        completionTokens: resp.usage?.output_tokens || 0,
      },
    };
  }
}
