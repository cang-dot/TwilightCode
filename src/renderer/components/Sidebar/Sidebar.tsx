import React, { useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useSessionStore } from '../../stores/sessionStore';
import { useI18n } from '../../stores/i18n';
import logoUrl from '../../assets/logo.png';
import './Sidebar.css';

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const sessions = useSessionStore((s) => s.sessions);
  const currentSessionId = useSessionStore((s) => s.currentSessionId);
  const setCurrentSession = useSessionStore((s) => s.setCurrentSession);
  const setSessions = useSessionStore((s) => s.setSessions);
  const { t } = useI18n();

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const list = await window.api.listSessions();
        setSessions(list);
      } catch (err) {
        console.error(t('error.loadSessions'), err);
      }
    };
    loadSessions();
  }, []);

  const handleNewSession = async () => {
    try {
      const session = await window.api.createSession();
      if (session) {
        useSessionStore.getState().addSession(session);
        setCurrentSession(session.id);
      }
    } catch (err) {
      console.error(t('error.createSession'), err);
    }
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t('confirm.delete'))) return;
    try {
      await window.api.deleteSession(id);
      useSessionStore.getState().removeSession(id);
    } catch (err) {
      console.error(t('error.deleteSession'), err);
    }
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-top">
        <div className="sidebar-logo-area">
          <img className="sidebar-logo" src={logoUrl} alt="TwilightCode" />
          {!collapsed && <span className="sidebar-dir-initial">TwilightCode</span>}
        </div>
        <button className="sidebar-menu-btn" onClick={toggleSidebar}>
          {collapsed ? '>' : '<'}
        </button>
      </div>

      <button className="sidebar-new-chat" onClick={handleNewSession}>
        {collapsed ? '+' : t('sidebar.new')}
      </button>

      <div className="sidebar-sessions">
        {!collapsed && <div className="sidebar-section-title">{t('sidebar.sessions')}</div>}
        {sessions.filter(s => !s.archived).map((session) => (
          <div
            key={session.id}
            className={`sidebar-session ${session.id === currentSessionId ? 'active' : ''}`}
            onClick={() => setCurrentSession(session.id)}
            title={session.name}
          >
            <span className="session-name">
              {collapsed ? session.name.charAt(0).toUpperCase() : session.name}
            </span>
            {!collapsed && (
              <button className="session-delete" onClick={(e) => handleDeleteSession(session.id, e)} title="Delete">
                x
              </button>
            )}
          </div>
        ))}
        {sessions.filter(s => !s.archived).length === 0 && !collapsed && (
          <div className="sidebar-empty">{t('sidebar.empty')}</div>
        )}
      </div>

      <div className="sidebar-bottom">
        <button className="sidebar-bottom-btn" onClick={() => setSettingsOpen(true)} title={t('sidebar.settings')}>
          {collapsed ? '?' : t('sidebar.settings')}
        </button>
      </div>
    </aside>
  );
}
