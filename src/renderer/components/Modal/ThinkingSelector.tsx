import React, { useState, useRef, useEffect } from 'react';
import './ThinkingSelector.css';

interface ThinkingSelectorProps {
  currentLevel: string;
  onSelect: (level: string) => void;
}

const THINKING_LEVELS = [
  { id: 'low', label: 'Low', desc: 'Fast responses' },
  { id: 'medium', label: 'Medium', desc: 'Balanced' },
  { id: 'high', label: 'High', desc: 'Full reasoning' },
];

export function ThinkingSelector({ currentLevel, onSelect }: ThinkingSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = THINKING_LEVELS.find(l => l.id === currentLevel) || THINKING_LEVELS[2];

  return (
    <div className="thinking-selector" ref={ref}>
      <button className="thinking-selector-trigger" onClick={() => setIsOpen(!isOpen)}>
        {current.label}
        <span className="thinking-selector-arrow">v</span>
      </button>

      {isOpen && (
        <div className="thinking-selector-dropdown">
          {THINKING_LEVELS.map(level => (
            <button
              key={level.id}
              className={`thinking-option ${level.id === currentLevel ? 'active' : ''}`}
              onClick={() => { onSelect(level.id); setIsOpen(false); }}
            >
              <span className="thinking-option-label">{level.label}</span>
              <span className="thinking-option-desc">{level.desc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
