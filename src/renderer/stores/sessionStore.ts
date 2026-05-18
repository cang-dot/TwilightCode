import { create } from 'zustand';
import type { Session, Message, AiMode, ThinkingLevel } from '../../types';

interface SessionState {
  sessions: Session[];
  currentSessionId: string | null;
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  streamingReasoning: string;

  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  updateSession: (id: string, data: Partial<Session>) => void;
  removeSession: (id: string) => void;
  setCurrentSession: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, data: Partial<Message>) => void;
  setIsStreaming: (streaming: boolean) => void;
  setStreamingContent: (content: string) => void;
  setStreamingReasoning: (reasoning: string) => void;
  appendStreamingContent: (delta: string) => void;
  appendStreamingReasoning: (delta: string) => void;
  getCurrentSession: () => Session | undefined;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  messages: [],
  isStreaming: false,
  streamingContent: '',
  streamingReasoning: '',

  setSessions: (sessions) => set({ sessions }),
  addSession: (session) => set((s) => ({ sessions: [session, ...s.sessions] })),
  updateSession: (id, data) =>
    set((s) => ({
      sessions: s.sessions.map((sess) => (sess.id === id ? { ...sess, ...data } : sess)),
    })),
  removeSession: (id) =>
    set((s) => ({
      sessions: s.sessions.filter((sess) => sess.id !== id),
      currentSessionId: s.currentSessionId === id ? null : s.currentSessionId,
    })),
  setCurrentSession: (id) => set({ currentSessionId: id, messages: [] }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  updateMessage: (id, data) =>
    set((s) => ({
      messages: s.messages.map((msg) => (msg.id === id ? { ...msg, ...data } : msg)),
    })),
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
  setStreamingContent: (content) => set({ streamingContent: content }),
  setStreamingReasoning: (reasoning) => set({ streamingReasoning: reasoning }),
  appendStreamingContent: (delta) => set((s) => ({ streamingContent: s.streamingContent + delta })),
  appendStreamingReasoning: (delta) => set((s) => ({ streamingReasoning: s.streamingReasoning + delta })),
  getCurrentSession: () => {
    const state = get();
    return state.sessions.find((s) => s.id === state.currentSessionId);
  },
}));
