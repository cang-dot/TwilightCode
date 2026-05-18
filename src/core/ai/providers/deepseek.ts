import { OpenAICompatAdapter } from './openai-compat';
import type { ChatRequest, ProviderConfig } from '../../../types';

export class DeepSeekAdapter extends OpenAICompatAdapter {
  constructor(config: ProviderConfig, apiKey: string) {
    super(config, apiKey);
  }

  protected buildBody(req: ChatRequest): Record<string, any> {
    const body = super.buildBody(req);

    if (this.config.supportsThinking) {
      body.thinking = { type: req.thinking ?? 'enabled' };
      body.reasoning_effort = req.reasoningEffort ?? 'high';
    }

    return body;
  }
}
