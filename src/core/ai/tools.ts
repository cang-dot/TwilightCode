import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import type { ToolCall } from '../../types';

export async function executeTool(toolCall: ToolCall, cwd: string): Promise<string> {
  const { name, arguments: argsStr } = toolCall.function;
  const args = JSON.parse(argsStr);

  switch (name) {
    case 'read_file':
      return readFile(args.path);
    case 'write_file':
      return writeFile(args.path, args.content);
    case 'edit_file':
      return editFile(args.path, args.old_text, args.new_text);
    case 'delete_file':
      return deleteFile(args.path);
    case 'list_files':
      return listFiles(args.path);
    case 'run_command':
      return runCommand(args.command, cwd, args.shell || 'cmd');
    case 'web_search':
      return `Web search not implemented yet: ${args.query}`;
    default:
      return `Unknown tool: ${name}`;
  }
}

function readFile(filePath: string): string {
  try {
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) return `File not found: ${resolved}`;
    return fs.readFileSync(resolved, 'utf-8');
  } catch (err: any) {
    return `Error reading file: ${err.message}`;
  }
}

function writeFile(filePath: string, content: string): string {
  try {
    const resolved = path.resolve(filePath);
    const dir = path.dirname(resolved);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(resolved, content, 'utf-8');
    return `File written: ${resolved}`;
  } catch (err: any) {
    return `Error writing file: ${err.message}`;
  }
}

function editFile(filePath: string, oldText: string, newText: string): string {
  try {
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) return `File not found: ${resolved}`;
    const content = fs.readFileSync(resolved, 'utf-8');
    if (!content.includes(oldText)) return `Text not found in file`;
    const newContent = content.replace(oldText, newText);
    fs.writeFileSync(resolved, newContent, 'utf-8');
    return `File edited: ${resolved}`;
  } catch (err: any) {
    return `Error editing file: ${err.message}`;
  }
}

function deleteFile(filePath: string): string {
  try {
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) return `File not found: ${resolved}`;
    fs.unlinkSync(resolved);
    return `File deleted: ${resolved}`;
  } catch (err: any) {
    return `Error deleting file: ${err.message}`;
  }
}

function listFiles(dirPath: string): string {
  try {
    const resolved = path.resolve(dirPath);
    if (!fs.existsSync(resolved)) return `Directory not found: ${resolved}`;
    const items = fs.readdirSync(resolved, { withFileTypes: true });
    return items
      .map((item) => {
        const prefix = item.isDirectory() ? 'd' : 'f';
        return `[${prefix}] ${item.name}`;
      })
      .join('\n');
  } catch (err: any) {
    return `Error listing files: ${err.message}`;
  }
}

function runCommand(command: string, cwd: string, shell: 'cmd' | 'powershell' = 'cmd'): string {
  try {
    let result: string;
    if (shell === 'powershell') {
      result = execSync(command, {
        cwd,
        encoding: 'utf-8',
        timeout: 30000,
        maxBuffer: 1024 * 1024,
        shell: 'powershell.exe',
      });
    } else {
      result = execSync(command, {
        cwd,
        encoding: 'utf-8',
        timeout: 30000,
        maxBuffer: 1024 * 1024,
        shell: 'cmd.exe',
      });
    }
    return result || '(no output)';
  } catch (err: any) {
    if (err.stdout) return err.stdout;
    return `Error: ${err.message}`;
  }
}
