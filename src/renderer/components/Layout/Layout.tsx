import React from 'react';
import { Sidebar } from '../Sidebar/Sidebar';
import { MainArea } from './MainArea';
import { SettingsModal } from '../Settings/SettingsModal';
import { useAppStore } from '../../stores/appStore';
import './Layout.css';

export function Layout() {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);

  return (
    <div className="layout">
      <div className="titlebar">
        <div className="titlebar-drag" />
        <div className="titlebar-controls">
          <button onClick={() => window.api.minimize()} className="titlebar-btn">-</button>
          <button onClick={() => window.api.maximize()} className="titlebar-btn">□</button>
          <button onClick={() => window.api.close()} className="titlebar-btn close">×</button>
        </div>
      </div>
      <div className="layout-body">
        <Sidebar collapsed={sidebarCollapsed} />
        <MainArea />
      </div>
      <SettingsModal />
    </div>
  );
}
