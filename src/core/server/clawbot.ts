import type { ClawbotInbound, ClawbotOutbound, AiMode } from '../../types';

export function parseCommand(text: string): { command: string; args: string } | null {
  const match = text.match(/^\/(\w+)\s*(.*)?$/s);
  if (!match) return null;
  return { command: match[1], args: match[2]?.trim() || '' };
}

export function handleModeSwitch(args: string): { mode: AiMode; reply: string } | null {
  const mode = args.toLowerCase() as AiMode;
  if (['chat', 'plan', 'action'].includes(mode)) {
    return { mode, reply: `[OK] Switched to ${mode} mode` };
  }
  return null;
}

export function formatModelList(providers: Record<string, string[]>): string {
  let result = 'Select model:\n';
  let index = 1;
  for (const [provider, models] of Object.entries(providers)) {
    for (const model of models) {
      result += `${index}. ${provider}/${model}\n`;
      index++;
    }
  }
  return result;
}
