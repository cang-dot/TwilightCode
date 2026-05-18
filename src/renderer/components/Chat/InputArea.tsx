import React, { useState, useRef, useEffect } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { ModelSelector } from '../Modal/ModelSelector';
import { ThinkingSelector } from '../Modal/ThinkingSelector';
import './InputArea.css';

export function InputArea() {
  const [input, setInput] = useState('');
  const [thinkingLevel, setThinkingLevel] = useState('high');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentSessionId = useSessionStore((s) => s.currentSessionId);
  const currentSession = useSessionStore((s) => s.getCurrentSession());
  const isStreaming = useSessionStore((s) => s.isStreaming);
  const updateSession = useSessionStore((s) => s.updateSession);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [currentSessionId]);

  useEffect(() => {
    if (!isStreaming) {
      textareaRef.current?.focus();
    }
  }, [isStreaming]);

  const handleSend = async () => {
    if (!input.trim() || !currentSessionId || isStreaming) return;

    const content = input.trim();
    setInput('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      await window.api.chat(currentSessionId, content);
    } catch (err) {
      console.error('Failed to send:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  };

  const handleModeChange = async (mode: string) => {
    if (!currentSessionId) return;
    try {
      await window.api.setMode(currentSessionId, mode);
      updateSession(currentSessionId, { mode: mode as any });
    } catch (err) {
      console.error('Failed to set mode:', err);
    }
  };

  const handleModelSelect = async (providerId: string, modelId: string) => {
    if (!currentSessionId) return;
    try {
      await window.api.setModel(currentSessionId, providerId, modelId);
      updateSession(currentSessionId, { providerId, modelId });
    } catch (err) {
      console.error('Failed to set model:', err);
    }
  };

  const handleThinkingSelect = async (level: string) => {
    setThinkingLevel(level);
    if (!currentSessionId) return;
    try {
      await window.api.setThinking(currentSessionId, level);
    } catch (err) {
      console.error('Failed to set thinking:', err);
    }
  };

  const handleUpload = async () => {
    try {
      const filePath = await window.api.openFile({
        filters: [
          { name: 'All Files', extensions: ['*'] },
          { name: 'Text', extensions: ['txt', 'md', 'json', 'ts', 'tsx', 'js', 'jsx'] },
        ],
      });
      if (filePath && currentSessionId) {
        const content = await window.api.readFile(filePath);
        setInput(prev => prev + `\n\nFile: ${filePath}\n\`\`\`\n${content}\n\`\`\``);
      }
    } catch (err) {
      console.error('Failed to upload:', err);
    }
  };

  const mode = currentSession?.mode || 'chat';

  return (
    <div className="input-area">
      <textarea
        ref={textareaRef}
        className="input-textarea"
        value={input}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything... 'Generate API docs'"
        rows={1}
        disabled={isStreaming}
      />
      <div className="input-toolbar">
        <button className="toolbar-btn upload-btn" onClick={handleUpload} title="Upload file">+</button>
        <div className="toolbar-center">
          <div className="toolbar-mode">
            <button className={`mode-btn ${mode === 'chat' ? 'active' : ''}`} onClick={() => handleModeChange('chat')}>Chat</button>
            <button className={`mode-btn ${mode === 'plan' ? 'active' : ''}`} onClick={() => handleModeChange('plan')}>Plan</button>
            <button className={`mode-btn ${mode === 'action' ? 'active' : ''}`} onClick={() => handleModeChange('action')}>Action</button>
          </div>
          <ModelSelector
            currentProvider={currentSession?.providerId || 'deepseek'}
            currentModel={currentSession?.modelId || 'deepseek-v4-flash'}
            onSelect={handleModelSelect}
          />
          <ThinkingSelector
            currentLevel={thinkingLevel}
            onSelect={handleThinkingSelect}
          />
        </div>
        <button className="toolbar-btn send-btn" onClick={handleSend} disabled={isStreaming || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}
