import React, { useRef, useEffect, useState } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { MessageBubble } from './MessageBubble';
import { MarkdownRenderer } from './MarkdownRenderer';
import { InputArea } from './InputArea';
import { BranchNavigator } from './BranchNavigator';
import './ChatView.css';

interface ToolExecution {
  id: string;
  toolName: string;
  args: string;
  status: 'running' | 'done' | 'error';
  result?: string;
}

export function ChatView() {
  const messages = useSessionStore((s) => s.messages);
  const currentSessionId = useSessionStore((s) => s.currentSessionId);
  const currentSession = useSessionStore((s) => s.getCurrentSession());
  const isStreaming = useSessionStore((s) => s.isStreaming);
  const streamingContent = useSessionStore((s) => s.streamingContent);
  const streamingReasoning = useSessionStore((s) => s.streamingReasoning);
  const addMessage = useSessionStore((s) => s.addMessage);
  const setMessages = useSessionStore((s) => s.setMessages);
  const setIsStreaming = useSessionStore((s) => s.setIsStreaming);
  const appendStreamingContent = useSessionStore((s) => s.appendStreamingContent);
  const appendStreamingReasoning = useSessionStore((s) => s.appendStreamingReasoning);
  const setStreamingContent = useSessionStore((s) => s.setStreamingContent);
  const setStreamingReasoning = useSessionStore((s) => s.setStreamingReasoning);
  const updateSession = useSessionStore((s) => s.updateSession);
  const [error, setError] = useState<string | null>(null);
  const [toolExecs, setToolExecs] = useState<ToolExecution[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, toolExecs]);

  useEffect(() => {
    if (!currentSessionId) return;

    const loadMessages = async () => {
      try {
        const msgs = await window.api.listMessages(currentSessionId);
        setMessages(msgs);
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    };
    loadMessages();
    setError(null);
    setToolExecs([]);

    const cleanupMessageNew = window.api.onMessageNew((message) => {
      if (message.sessionId === currentSessionId) {
        addMessage(message);
      }
    });

    const cleanupStreamChunk = window.api.onStreamChunk((sessionId, chunk) => {
      if (sessionId === currentSessionId) {
        setIsStreaming(true);
        if (chunk.delta) {
          appendStreamingContent(chunk.delta);
        }
        if (chunk.reasoningDelta) {
          appendStreamingReasoning(chunk.reasoningDelta);
        }
      }
    });

    const cleanupStreamDone = window.api.onStreamDone((sessionId) => {
      if (sessionId === currentSessionId) {
        setIsStreaming(false);
        setStreamingContent('');
        setStreamingReasoning('');
      }
    });

    const cleanupError = window.api.onError((sessionId, error) => {
      if (sessionId === currentSessionId) {
        setIsStreaming(false);
        setStreamingContent('');
        setStreamingReasoning('');
        setError(error);
      }
    });

    const cleanupToolStart = window.api.onToolCallStart?.((data) => {
      if (data.sessionId === currentSessionId) {
        setToolExecs((prev) => [
          ...prev,
          {
            id: data.callId,
            toolName: data.toolName,
            args: data.args,
            status: 'running',
          },
        ]);
      }
    });

    const cleanupToolEnd = window.api.onToolCallEnd?.((data) => {
      if (data.sessionId === currentSessionId) {
        setToolExecs((prev) =>
          prev.map((t) =>
            t.id === data.callId
              ? { ...t, status: data.success ? 'done' : 'error', result: data.result }
              : t
          )
        );
      }
    });

    return () => {
      cleanupMessageNew();
      cleanupStreamChunk();
      cleanupStreamDone();
      cleanupError();
      cleanupToolStart?.();
      cleanupToolEnd?.();
    };
  }, [currentSessionId]);

  const handleEditStart = (messageId: string, content: string) => {
    setEditingId(messageId);
    setEditValue(content);
  };

  const handleEditChange = (value: string) => {
    setEditValue(value);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleEditSubmit = async () => {
    if (!currentSessionId || !editingId || !editValue.trim()) return;

    try {
      const { messages: newMessages, branchId } = await window.api.editMessage(
        currentSessionId,
        editingId,
        editValue.trim()
      );
      setMessages(newMessages);
      setEditingId(null);
      setEditValue('');

      updateSession(currentSessionId, { activeBranchId: branchId } as any);

      await window.api.chat(currentSessionId, editValue.trim());
    } catch (err) {
      console.error('Failed to edit message:', err);
    }
  };

  const handleSwitchBranch = async (branchId: string) => {
    if (!currentSessionId) return;
    try {
      const msgs = await window.api.switchBranch(currentSessionId, branchId);
      setMessages(msgs);
      updateSession(currentSessionId, { activeBranchId: branchId } as any);
    } catch (err) {
      console.error('Failed to switch branch:', err);
    }
  };

  const branches = currentSession?.branches || [];
  const activeBranchId = currentSession?.activeBranchId || '';

  return (
    <div className="chat-view">
      <div className="chat-header">
        <span className="chat-title">{currentSession?.name || 'New Chat'}</span>
        <span className="chat-mode">{currentSession?.mode?.toUpperCase() || 'CHAT'}</span>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            sessionId={currentSessionId || undefined}
            onEdit={handleEditStart}
            editing={editingId === msg.id}
            editValue={editingId === msg.id ? editValue : undefined}
            onEditChange={handleEditChange}
            onEditSubmit={handleEditSubmit}
            onEditCancel={handleEditCancel}
          />
        ))}

        {toolExecs.map((t) => (
          <div key={t.id} className={`tool-execution ${t.status}`}>
            <div className="tool-exec-header">
              <span className="tool-exec-icon">
                {t.status === 'running' ? '⚡' : t.status === 'done' ? '✓' : '✗'}
              </span>
              <span className="tool-exec-name">{t.toolName}</span>
            </div>
            {t.args && t.args.length < 200 && (
              <div className="tool-exec-args">{t.args}</div>
            )}
            {t.result && (
              <div className="tool-exec-result">{t.result.slice(0, 500)}</div>
            )}
          </div>
        ))}

        {isStreaming && (
          <div className="message assistant">
            {streamingReasoning && (
              <div className="message-reasoning">
                <div className="reasoning-header">thought</div>
                <div className="reasoning-content">{streamingReasoning}</div>
              </div>
            )}
            <div className="message-content">
              <MarkdownRenderer content={streamingContent || 'Thinking...'} />
            </div>
          </div>
        )}

        {error && (
          <div className="message system error">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {branches.length > 1 && (
        <BranchNavigator
          branches={branches}
          activeBranchId={activeBranchId}
          onSwitch={handleSwitchBranch}
        />
      )}

      <InputArea />
    </div>
  );
}
