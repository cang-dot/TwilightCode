import React from 'react';
import type { Message } from '../../../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import './MessageBubble.css';

interface MessageBubbleProps {
  message: Message;
  sessionId?: string;
  onEdit?: (messageId: string, newContent: string) => void;
  editing?: boolean;
  editValue?: string;
  onEditChange?: (value: string) => void;
  onEditSubmit?: () => void;
  onEditCancel?: () => void;
}

export function MessageBubble({ message, onEdit, editing, editValue, onEditChange, onEditSubmit, onEditCancel }: MessageBubbleProps) {
  const handleClick = () => {
    if (message.role === 'user' && !editing && onEdit) {
      onEdit(message.id, message.content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onEditSubmit?.();
    }
    if (e.key === 'Escape') {
      onEditCancel?.();
    }
  };

  return (
    <div className={`message ${message.role} ${editing ? 'editing' : ''}`} onClick={handleClick}>
      {editing ? (
        <div className="message-edit-area" onClick={(e) => e.stopPropagation()}>
          <textarea
            className="message-edit-input"
            value={editValue || ''}
            onChange={(e) => onEditChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <div className="message-edit-actions">
            <button className="edit-btn cancel" onClick={onEditCancel}>Cancel</button>
            <button className="edit-btn save" onClick={onEditSubmit}>Save</button>
          </div>
        </div>
      ) : (
        <>
          {message.reasoningContent && (
            <div className="message-reasoning">
              <div className="reasoning-header">thought</div>
              <div className="reasoning-content">{message.reasoningContent}</div>
            </div>
          )}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="message-tools">
              {message.toolCalls.map((tc, i) => (
                <div key={i} className="tool-call">
                  <span className="tool-call-name">{tc.function.name}</span>
                  <span className="tool-call-args">{tc.function.arguments.slice(0, 100)}</span>
                </div>
              ))}
            </div>
          )}
          {message.toolResult && (
            <div className="tool-result">
              <MarkdownRenderer content={message.toolResult} />
            </div>
          )}
          <div className="message-content">
            <MarkdownRenderer content={message.content} />
          </div>
          {message.usage && (
            <div className="message-usage">
              <span className="usage-tokens">↑{message.usage.completionTokens} ↓{message.usage.promptTokens}</span>
              {message.usage.totalTokens && <span className="usage-total"> T:{message.usage.totalTokens}</span>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
