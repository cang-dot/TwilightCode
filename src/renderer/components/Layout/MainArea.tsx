import React from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { WelcomeScreen } from '../Chat/WelcomeScreen';
import { ChatView } from '../Chat/ChatView';
import './MainArea.css';

export function MainArea() {
  const currentSessionId = useSessionStore((s) => s.currentSessionId);

  return (
    <main className="main-area">
      {currentSessionId ? <ChatView /> : <WelcomeScreen />}
    </main>
  );
}
