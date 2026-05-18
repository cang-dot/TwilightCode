import { BrowserWindow, app } from 'electron';
import path from 'path';
import { getAdapter } from './providers';
import { createMessage, listMessages } from '../storage/messages';
import { getSession } from '../storage/sessions';
import { getToolsForMode } from './modes';
import { executeTool } from './tools';
import type { ChatRequest, ToolCall, Message, AiMode } from '../../types';

export class AIEngine {
  private mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  async chat(sessionId: string, content: string): Promise<void> {
    const session = getSession(sessionId);
    if (!session) {
      this.sendError(sessionId, 'Session not found');
      return;
    }

    const adapter = getAdapter(session.providerId);
    if (!adapter) {
      this.sendError(sessionId, `Provider "${session.providerId}" not available. Please configure an API key in Settings > Providers.`);
      return;
    }

    const userMessage = createMessage({
      sessionId,
      role: 'user',
      content,
    });
    this.sendToRenderer('message:new', userMessage);

    const cwd = path.resolve(app.getPath('home'));

    const tools = getToolsForMode(session.mode);
    const systemPrompt = this.getSystemPrompt(session.mode);

    for (let round = 0; round < 5; round++) {
      const messages = listMessages(sessionId);
      const allMessages: Message[] = [
        { id: 'system', sessionId, role: 'system', content: systemPrompt, branchId: '', createdAt: 0 },
        ...messages,
      ];

      const req: ChatRequest = {
        model: session.modelId,
        messages: allMessages,
        stream: true,
        tools: tools.length > 0 ? tools : undefined,
        thinking: session.mode !== 'chat' ? 'enabled' : 'disabled',
        reasoningEffort: 'high',
        maxTokens: 4096,
      };

      try {
        const { text, reasoning, toolCalls, usage } = await this.doStream(sessionId, req, adapter);

        if (!toolCalls || toolCalls.length === 0) {
          const assistantMessage = createMessage({
            sessionId,
            role: 'assistant',
            content: text,
            reasoningContent: reasoning || undefined,
            usage,
          });
          this.sendToRenderer('message:new', assistantMessage);
          this.sendToRenderer('ai:stream-done', sessionId);
          return;
        }

        const assistantMessage = createMessage({
          sessionId,
          role: 'assistant',
          content: text,
          reasoningContent: reasoning || undefined,
          toolCalls,
          usage,
        });
        this.sendToRenderer('message:new', assistantMessage);
        this.sendToRenderer('ai:stream-done', sessionId);

        for (const tc of toolCalls) {
          const argsStr = tc.function.arguments;
          this.sendToRenderer('tool:call-start', {
            sessionId,
            callId: tc.id,
            toolName: tc.function.name,
            args: argsStr,
          });

          let result: string;
          try {
            result = await executeTool(tc, cwd);
          } catch (err: any) {
            result = `Error: ${err.message}`;
          }

          this.sendToRenderer('tool:call-end', {
            sessionId,
            callId: tc.id,
            success: !result.startsWith('Error:'),
            result,
          });

          createMessage({
            sessionId,
            role: 'tool',
            content: result,
            toolCalls: [{ ...tc, type: 'function' as const }],
          });
        }
      } catch (err: any) {
        console.error('AI chat error:', err);
        this.sendError(sessionId, err.message || 'Unknown error occurred');
        return;
      }
    }

    this.sendError(sessionId, 'Max tool call rounds reached (5). Please try a simpler request.');
  }

  private async doStream(
    sessionId: string,
    req: ChatRequest,
    adapter: any
  ): Promise<{ text: string; reasoning: string; toolCalls: ToolCall[] | null; usage?: { promptTokens: number; completionTokens: number; totalTokens?: number } }> {
    let text = '';
    let reasoning = '';
    let toolCallAcc: any[] = [];
    let usage: { promptTokens: number; completionTokens: number; totalTokens?: number } | undefined;

    for await (const chunk of adapter.chatStream(req)) {
      if (chunk.delta) {
        text += chunk.delta;
        this.sendToRenderer('ai:stream-chunk', sessionId, { delta: chunk.delta, reasoningDelta: undefined });
      }
      if (chunk.reasoningDelta) {
        reasoning += chunk.reasoningDelta;
        this.sendToRenderer('ai:stream-chunk', sessionId, { delta: undefined, reasoningDelta: chunk.reasoningDelta });
      }
      if (chunk.toolCalls) {
        toolCallAcc = this.mergeToolCallDeltas(toolCallAcc, chunk.toolCalls);
      }
      if (chunk.usage) {
        usage = chunk.usage;
      }
    }

    const completeToolCalls = toolCallAcc
      .filter((tc: any) => tc.id && tc.function?.name)
      .map((tc: any) => ({
        id: tc.id,
        type: 'function' as const,
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      }));

    return {
      text,
      reasoning,
      toolCalls: completeToolCalls.length > 0 ? completeToolCalls : null,
      usage,
    };
  }

  private mergeToolCallDeltas(acc: any[], incoming: any[]): any[] {
    const result = [...acc];
    for (const tc of incoming) {
      const idx = tc.index;
      if (idx === undefined) {
        result.push(tc);
        continue;
      }
      if (!result[idx]) {
        result[idx] = { id: '', function: { name: '', arguments: '' } };
      }
      if (tc.id) result[idx].id = tc.id;
      if (tc.function?.name) result[idx].function.name = tc.function.name;
      if (tc.function?.arguments) result[idx].function.arguments = (result[idx].function.arguments || '') + tc.function.arguments;
    }
    return result;
  }

  async cancelChat(sessionId: string): Promise<void> {
    // Cancel streaming - implementation depends on abort controller
  }

  private sendError(sessionId: string, message: string): void {
    this.sendToRenderer('ai:error', sessionId, message);
  }

  private getSystemPrompt(mode: AiMode): string {
    switch (mode) {
      case 'chat':
        return 'You are a helpful assistant. Answer questions based on your knowledge. Do not attempt to read files, execute commands, or search the web.';
      case 'plan':
        return `You are a planning assistant running on Windows. You have access to the following tools via function calling.

Available tools:
- read_file: Read file contents (path)
- list_files: List directory contents (path)  
- run_command: Execute a shell command (command, shell: "cmd"|"powershell")
- web_search: Search the web (query)

Rules:
1. Use run_command with shell="cmd" for general commands, shell="powershell" for PowerShell-specific tasks.
2. Read files before making suggestions about them.
3. Create detailed, actionable plans. Ask clarifying questions when needed.`;
      case 'action':
        return `You are an action assistant running on Windows. You have full file read/write access and can execute commands. Use function calling to accomplish tasks.

Available tools:
- read_file: Read file contents (path)
- write_file: Create or overwrite a file (path, content)
- edit_file: Replace text in a file (path, old_text, new_text)
- delete_file: Delete a file (path)
- list_files: List directory contents (path)
- run_command: Execute a shell command (command, shell: "cmd"|"powershell")
- web_search: Search the web (query)

Rules:
1. Always read a file before editing it.
2. When writing a file, provide the COMPLETE file content — not placeholders or truncated code.
3. Use run_command with shell="cmd" for general commands, shell="powershell" for PowerShell-specific tasks.
4. After completing all tool calls, summarize what was done.
5. If a tool call fails, report the error and suggest alternatives.`;
      default:
        return 'You are a helpful assistant.';
    }
  }

  private sendToRenderer(channel: string, ...args: any[]): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, ...args);
    }
  }
}
