import { ProviderAdapter } from './base';
import type { ChatRequest, ChatResponse, StreamChunk, ProviderConfig, Message } from '../../../types';

export class OpenAICompatAdapter extends ProviderAdapter {
  constructor(config: ProviderConfig, apiKey: string) {
    super(config, apiKey);
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const url = `${this.config.baseUrl}${this.config.chatEndpoint}`;
    const body = this.buildBody(req);

    const resp = await this.fetchJSON(url, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    });

    return this.parseResponse(resp);
  }

  async *chatStream(req: ChatRequest): AsyncIterable<StreamChunk> {
    const url = `${this.config.baseUrl}${this.config.chatEndpoint}`;
    const body = { ...this.buildBody(req), stream: true };

    for await (const data of this.fetchStream(url, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    })) {
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta;
        const usage = parsed.usage;
        const finishReason = parsed.choices?.[0]?.finish_reason;

        if (!delta && !usage) continue;

        yield {
          delta: delta?.content || undefined,
          reasoningDelta: delta?.reasoning_content || undefined,
          toolCalls: delta?.tool_calls || undefined,
          usage: usage ? {
            promptTokens: usage.prompt_tokens || 0,
            completionTokens: usage.completion_tokens || 0,
            totalTokens: usage.total_tokens,
          } : undefined,
          done: finishReason === 'stop' || finishReason === 'tool_calls',
        };
      } catch {
        // Skip malformed chunks
      }
    }

    yield { done: true };
  }

  protected buildBody(req: ChatRequest): Record<string, any> {
    return {
      model: req.model,
      messages: this.formatMessages(req.messages),
      temperature: req.temperature,
      max_tokens: req.maxTokens,
      stream: req.stream ?? false,
      tools: req.tools?.length ? req.tools : undefined,
    };
  }

  protected formatMessages(messages: Message[]): any[] {
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      ...(msg.role === 'assistant' && msg.reasoningContent ? { reasoning_content: msg.reasoningContent } : {}),
      ...(msg.toolCalls?.length ? { tool_calls: msg.toolCalls } : {}),
      ...(msg.role === 'tool' ? { tool_call_id: msg.toolCalls?.[0]?.id } : {}),
    }));
  }

  protected parseResponse(resp: any): ChatResponse {
    const choice = resp.choices?.[0];
    if (!choice) throw new Error('No response choice');

    return {
      content: choice.message?.content || '',
      reasoningContent: choice.message?.reasoning_content,
      toolCalls: choice.message?.tool_calls,
      usage: {
        promptTokens: resp.usage?.prompt_tokens || 0,
        completionTokens: resp.usage?.completion_tokens || 0,
      },
    };
  }
}
