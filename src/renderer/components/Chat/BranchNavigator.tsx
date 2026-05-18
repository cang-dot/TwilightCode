import React from 'react';
import type { Branch } from '../../../types';
import './BranchNavigator.css';

interface BranchNavigatorProps {
  branches: Branch[];
  activeBranchId: string;
  onSwitch: (branchId: string) => void;
}

export function BranchNavigator({ branches, activeBranchId, onSwitch }: BranchNavigatorProps) {
  const activeIndex = branches.findIndex((b) => b.id === activeBranchId);
  const currentIdx = activeIndex >= 0 ? activeIndex : 0;

  const goPrev = () => {
    if (currentIdx > 0) {
      onSwitch(branches[currentIdx - 1].id);
    }
  };

  const goNext = () => {
    if (currentIdx < branches.length - 1) {
      onSwitch(branches[currentIdx + 1].id);
    }
  };

  return (
    <div className="branch-navigator">
      <button className="branch-nav-btn" onClick={goPrev} disabled={currentIdx <= 0}>
        {'<'}
      </button>
      <span className="branch-indicator">
        {branches.map((b, i) => (
          <span
            key={b.id}
            className={`branch-dot ${i === currentIdx ? 'active' : ''}`}
            onClick={() => onSwitch(b.id)}
            title={`Branch ${b.name}`}
          >
            {b.name}
          </span>
        ))}
      </span>
      <button className="branch-nav-btn" onClick={goNext} disabled={currentIdx >= branches.length - 1}>
        {'>'}
      </button>
    </div>
  );
}
