import type { AiMode, ToolDef } from '../../types';

export function getToolsForMode(mode: AiMode): ToolDef[] {
  switch (mode) {
    case 'chat':
      return [];
    case 'plan':
      return [
        {
          type: 'function',
          function: {
            name: 'read_file',
            description: 'Read the contents of a file',
            parameters: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'Absolute path to the file' },
              },
              required: ['path'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'list_files',
            description: 'List files and directories in a path',
            parameters: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'Absolute path to the directory' },
              },
              required: ['path'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'run_command',
            description: 'Execute a shell command (use "cmd" for general commands, "powershell" for PowerShell-specific tasks)',
            parameters: {
              type: 'object',
              properties: {
                command: { type: 'string', description: 'Command to execute' },
                shell: { type: 'string', enum: ['cmd', 'powershell'], description: 'Shell to use (default: cmd)' },
              },
              required: ['command'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'web_search',
            description: 'Search the web for information',
            parameters: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' },
              },
              required: ['query'],
            },
          },
        },
      ];
    case 'action':
      return [
        {
          type: 'function',
          function: {
            name: 'read_file',
            description: 'Read the contents of a file',
            parameters: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'Absolute path to the file' },
              },
              required: ['path'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'write_file',
            description: 'Write content to a file (creates or overwrites)',
            parameters: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'Absolute path to the file' },
                content: { type: 'string', description: 'Content to write' },
              },
              required: ['path', 'content'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'edit_file',
            description: 'Edit a file by replacing text',
            parameters: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'Absolute path to the file' },
                old_text: { type: 'string', description: 'Text to find and replace' },
                new_text: { type: 'string', description: 'Replacement text' },
              },
              required: ['path', 'old_text', 'new_text'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'delete_file',
            description: 'Delete a file',
            parameters: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'Absolute path to the file' },
              },
              required: ['path'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'list_files',
            description: 'List files and directories in a path',
            parameters: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'Absolute path to the directory' },
              },
              required: ['path'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'run_command',
            description: 'Execute a shell command (use "cmd" for general commands, "powershell" for PowerShell-specific tasks)',
            parameters: {
              type: 'object',
              properties: {
                command: { type: 'string', description: 'Command to execute' },
                shell: { type: 'string', enum: ['cmd', 'powershell'], description: 'Shell to use (default: cmd)' },
              },
              required: ['command'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'web_search',
            description: 'Search the web for information',
            parameters: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' },
              },
              required: ['query'],
            },
          },
        },
      ];
    default:
      return [];
  }
}
