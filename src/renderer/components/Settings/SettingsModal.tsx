import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useI18n } from '../../stores/i18n';
import './SettingsModal.css';

type SettingsTab = 'general' | 'providers' | 'models' | 'themes' | 'sounds' | 'mcp' | 'network';

export function SettingsModal() {
  const settingsOpen = useAppStore((s) => s.settingsOpen);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const { t, locale, setLocale } = useI18n();

  if (!settingsOpen) return null;

  return (
    <div className="settings-overlay" onClick={() => setSettingsOpen(false)}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-sidebar">
          <div className="settings-nav-section">
            <div className="settings-nav-label">Desktop</div>
            <button className={`settings-nav-item ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>{t('settings.general')}</button>
          </div>
          <div className="settings-nav-section">
            <div className="settings-nav-label">Server</div>
            <button className={`settings-nav-item ${activeTab === 'providers' ? 'active' : ''}`} onClick={() => setActiveTab('providers')}>{t('settings.providers')}</button>
            <button className={`settings-nav-item ${activeTab === 'models' ? 'active' : ''}`} onClick={() => setActiveTab('models')}>{t('settings.models')}</button>
          </div>
          <div className="settings-nav-section">
            <div className="settings-nav-label">Customize</div>
            <button className={`settings-nav-item ${activeTab === 'themes' ? 'active' : ''}`} onClick={() => setActiveTab('themes')}>{t('settings.themes')}</button>
            <button className={`settings-nav-item ${activeTab === 'sounds' ? 'active' : ''}`} onClick={() => setActiveTab('sounds')}>{t('settings.sounds')}</button>
          </div>
          <div className="settings-nav-section">
            <div className="settings-nav-label">Extensions</div>
            <button className={`settings-nav-item ${activeTab === 'mcp' ? 'active' : ''}`} onClick={() => setActiveTab('mcp')}>{t('settings.mcp')}</button>
            <button className={`settings-nav-item ${activeTab === 'network' ? 'active' : ''}`} onClick={() => setActiveTab('network')}>{t('settings.network')}</button>
          </div>
          <div className="settings-version">{t('settings.version')}</div>
        </div>
        <div className="settings-content">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'providers' && <ProvidersSettings />}
          {activeTab === 'models' && <ModelsSettings />}
          {activeTab === 'themes' && <ThemesSettings />}
          {activeTab === 'sounds' && <SoundsSettings />}
          {activeTab === 'mcp' && <MCPSettings />}
          {activeTab === 'network' && <NetworkSettings />}
        </div>
      </div>
    </div>
  );
}

function GeneralSettings() {
  const { t, locale, setLocale } = useI18n();
  const [autoAccept, setAutoAccept] = useState(false);
  const [showReasoning, setShowReasoning] = useState(true);
  const [showProgress, setShowProgress] = useState(true);

  const handleSave = async (key: string, value: any) => {
    try {
      await window.api.setConfig(key, value);
    } catch (err) {
      console.error(t('error.saveConfig'), err);
    }
  };

  return (
    <div className="settings-section">
      <h2>{t('settings.general')}</h2>
      <div className="settings-item">
        <div className="settings-item-info">
          <div className="settings-item-title">{t('settings.language')}</div>
          <div className="settings-item-desc">{t('settings.language.desc')}</div>
        </div>
        <select className="settings-select" value={locale} onChange={(e) => { setLocale(e.target.value as any); handleSave('language', e.target.value); }}>
          <option value="zh-CN">简体中文</option>
          <option value="en">English</option>
        </select>
      </div>
      <div className="settings-item">
        <div className="settings-item-info">
          <div className="settings-item-title">{t('settings.autoAccept')}</div>
          <div className="settings-item-desc">{t('settings.autoAccept.desc')}</div>
        </div>
        <label className="settings-toggle">
          <input type="checkbox" checked={autoAccept} onChange={(e) => { setAutoAccept(e.target.checked); handleSave('autoAcceptPermissions', e.target.checked); }} />
          <span className="settings-toggle-slider"></span>
        </label>
      </div>
      <div className="settings-item">
        <div className="settings-item-info">
          <div className="settings-item-title">{t('settings.showReasoning')}</div>
          <div className="settings-item-desc">{t('settings.showReasoning.desc')}</div>
        </div>
        <label className="settings-toggle">
          <input type="checkbox" checked={showReasoning} onChange={(e) => { setShowReasoning(e.target.checked); handleSave('showReasoningSummary', e.target.checked); }} />
          <span className="settings-toggle-slider"></span>
        </label>
      </div>
      <div className="settings-item">
        <div className="settings-item-info">
          <div className="settings-item-title">{t('settings.showProgress')}</div>
          <div className="settings-item-desc">{t('settings.showProgress.desc')}</div>
        </div>
        <label className="settings-toggle">
          <input type="checkbox" checked={showProgress} onChange={(e) => { setShowProgress(e.target.checked); handleSave('showProgressBar', e.target.checked); }} />
          <span className="settings-toggle-slider"></span>
        </label>
      </div>
    </div>
  );
}

function ProvidersSettings() {
  const { t } = useI18n();
  const [providers, setProviders] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const list = await window.api.listProviders();
      setProviders(list);
    } catch (err) {
      console.error('Failed to load providers:', err);
    }
  };

  const handleTest = async (providerId: string) => {
    try {
      const result = await window.api.testProvider(providerId);
      alert(result.ok ? `OK (${result.latencyMs}ms)` : 'Failed');
    } catch (err) {
      alert('Test failed');
    }
  };

  const handleSaveKey = async () => {
    if (!selectedProvider || !newApiKey) return;
    try {
      await window.api.saveProvider(selectedProvider, { apiKey: newApiKey });
      setNewApiKey('');
      setShowAddModal(false);
      loadProviders();
    } catch (err) {
      console.error('Failed to save key:', err);
    }
  };

  const handleRemove = async (providerId: string) => {
    if (!confirm(t('confirm.delete'))) return;
    try {
      await window.api.removeProvider(providerId);
      loadProviders();
    } catch (err) {
      console.error('Failed to remove provider:', err);
    }
  };

  const handleImportKeys = async () => {
    try {
      const filePath = await window.api.openFile({
        filters: [{ name: 'Text Files', extensions: ['txt'] }],
      });
      if (filePath) {
        await window.api.importKeys(filePath);
        loadProviders();
        alert('Keys imported successfully');
      }
    } catch (err) {
      alert(t('error.importKeys'));
    }
  };

  return (
    <div className="settings-section">
      <h2>{t('settings.providers')}</h2>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button className="settings-btn primary" onClick={() => setShowAddModal(true)}>{t('settings.addProvider')}</button>
        <button className="settings-btn" onClick={handleImportKeys}>{t('settings.importKeys')}</button>
      </div>
      <div className="settings-list">
        {providers.map((p) => (
          <div key={p.id} className="settings-list-item">
            <span className={`provider-status ${p.hasKey ? 'ok' : 'empty'}`}>{p.hasKey ? 'OK' : '--'}</span>
            <span className="provider-name">{p.name}</span>
            <span className="provider-url">{p.baseUrl}</span>
            <span className="provider-keys">{p.hasKey ? `${p.keyCount} key(s)` : 'not set'}</span>
            <button className="settings-btn small" onClick={() => handleTest(p.id)}>{t('settings.test')}</button>
            <button className="settings-btn small" onClick={() => { setSelectedProvider(p.id); setShowAddModal(true); }}>
              {p.hasKey ? 'Edit' : t('settings.configure')}
            </button>
            {p.hasKey && <button className="settings-btn small" onClick={() => handleRemove(p.id)}>{t('settings.remove')}</button>}
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="settings-overlay" onClick={() => setShowAddModal(false)}>
          <div className="settings-modal" style={{ width: '400px', height: 'auto', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <h3>Add API Key</h3>
            <div className="settings-item" style={{ flexDirection: 'column', gap: '8px' }}>
              <select className="settings-select" value={selectedProvider} onChange={(e) => setSelectedProvider(e.target.value)}>
                <option value="">Select provider...</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <input
                className="settings-search"
                type="password"
                placeholder="API Key"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="settings-btn" onClick={() => setShowAddModal(false)}>{t('settings.cancel')}</button>
                <button className="settings-btn primary" onClick={handleSaveKey}>{t('settings.save')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModelsSettings() {
  const { t } = useI18n();
  const [providerModels, setProviderModels] = useState<{ id: string; name: string; models: string[] }[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const list = await window.api.listProviders();
      const withKeys = list.filter((p: any) => p.hasKey);
      const results = await Promise.all(
        withKeys.map(async (p: any) => {
          try {
            const models = await window.api.listModels(p.id);
            return { id: p.id, name: p.name, models: models.map((m: any) => m.id) };
          } catch {
            return { id: p.id, name: p.name, models: [] };
          }
        })
      );
      setProviderModels(results.filter((p) => p.models.length > 0));
    } catch (err) {
      console.error('Failed to load models:', err);
    }
  };

  const filtered = providerModels.map((p) => ({
    ...p,
    models: p.models.filter((m) => m.toLowerCase().includes(search.toLowerCase())),
  })).filter((p) => p.models.length > 0);

  return (
    <div className="settings-section">
      <h2>{t('settings.models')}</h2>
      <input className="settings-search" placeholder={t('model.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="settings-list">
        {filtered.map((p) => (
          <div key={p.id} className="model-group">
            <div className="model-group-header">{p.name}</div>
            {p.models.map((model) => (
              <div key={model} className="model-item">
                <span className="model-name">{model}</span>
              </div>
            ))}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="settings-list-item empty">{t('model.empty')}</div>
        )}
      </div>
    </div>
  );
}

function ThemesSettings() {
  const { t } = useI18n();
  const [currentTheme, setCurrentTheme] = useState('dark');

  const handleSetTheme = async (themeId: string) => {
    try {
      await window.api.setTheme(themeId);
      setCurrentTheme(themeId);
      document.documentElement.setAttribute('data-theme', themeId);
    } catch (err) {
      console.error('Failed to set theme:', err);
    }
  };

  return (
    <div className="settings-section">
      <h2>{t('settings.themes')}</h2>
      <div className="theme-list">
        <div className={`theme-item ${currentTheme === 'dark' ? 'active' : ''}`} onClick={() => handleSetTheme('dark')}>
          <div className="theme-preview dark"></div>
          <span className="theme-name">{t('settings.dark')}</span>
        </div>
        <div className={`theme-item ${currentTheme === 'light' ? 'active' : ''}`} onClick={() => handleSetTheme('light')}>
          <div className="theme-preview light"></div>
          <span className="theme-name">{t('settings.light')}</span>
        </div>
      </div>
    </div>
  );
}

function SoundsSettings() {
  const { t } = useI18n();
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(50);

  const handleSave = async (key: string, value: any) => {
    try {
      await window.api.setConfig(key, value);
    } catch (err) {
      console.error(t('error.saveConfig'), err);
    }
  };

  return (
    <div className="settings-section">
      <h2>{t('settings.sounds')}</h2>
      <div className="settings-item">
        <div className="settings-item-info">
          <div className="settings-item-title">{t('settings.enableSounds')}</div>
          <div className="settings-item-desc">{t('settings.enableSounds.desc')}</div>
        </div>
        <label className="settings-toggle">
          <input type="checkbox" checked={enabled} onChange={(e) => { setEnabled(e.target.checked); handleSave('soundEnabled', e.target.checked); }} />
          <span className="settings-toggle-slider"></span>
        </label>
      </div>
      <div className="settings-item">
        <div className="settings-item-info">
          <div className="settings-item-title">{t('settings.volume')}</div>
        </div>
        <input type="range" min="0" max="100" value={volume} onChange={(e) => { setVolume(Number(e.target.value)); handleSave('soundVolume', Number(e.target.value) / 100); }} className="settings-range" />
      </div>
    </div>
  );
}

function MCPSettings() {
  const { t } = useI18n();
  const [servers, setServers] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      const list = await window.api.listMCP();
      setServers(list);
    } catch (err) {
      console.error('Failed to load MCP servers:', err);
    }
  };

  const handleAdd = async () => {
    if (!newName || !newUrl) return;
    try {
      await window.api.addMCP({ id: Date.now().toString(), name: newName, url: newUrl, enabled: true, connected: false });
      setNewName('');
      setNewUrl('');
      setShowAdd(false);
      loadServers();
    } catch (err) {
      console.error('Failed to add MCP server:', err);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await window.api.removeMCP(id);
      loadServers();
    } catch (err) {
      console.error('Failed to remove MCP server:', err);
    }
  };

  return (
    <div className="settings-section">
      <h2>{t('settings.mcp')}</h2>
      <button className="settings-btn primary" onClick={() => setShowAdd(true)}>Add Server</button>
      <div className="settings-list">
        {servers.length === 0 ? (
          <div className="settings-list-item empty">No MCP servers configured</div>
        ) : (
          servers.map((s) => (
            <div key={s.id} className="settings-list-item">
              <span className="provider-name">{s.name}</span>
              <span className="provider-url">{s.url}</span>
              <button className="settings-btn small" onClick={() => handleRemove(s.id)}>{t('settings.remove')}</button>
            </div>
          ))
        )}
      </div>

      {showAdd && (
        <div className="settings-overlay" onClick={() => setShowAdd(false)}>
          <div className="settings-modal" style={{ width: '400px', height: 'auto', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <h3>Add MCP Server</h3>
            <input className="settings-search" placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <input className="settings-search" placeholder="URL" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="settings-btn" onClick={() => setShowAdd(false)}>{t('settings.cancel')}</button>
              <button className="settings-btn primary" onClick={handleAdd}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NetworkSettings() {
  const { t } = useI18n();
  const [searchProvider, setSearchProvider] = useState('bocha');
  const [clawbotEnabled, setClawbotEnabled] = useState(false);

  const handleSave = async (key: string, value: any) => {
    try {
      await window.api.setConfig(key, value);
    } catch (err) {
      console.error(t('error.saveConfig'), err);
    }
  };

  return (
    <div className="settings-section">
      <h2>{t('settings.network')}</h2>
      <div className="settings-item">
        <div className="settings-item-info">
          <div className="settings-item-title">{t('settings.searchProvider')}</div>
          <div className="settings-item-desc">{t('settings.searchProvider.desc')}</div>
        </div>
        <select className="settings-select" value={searchProvider} onChange={(e) => { setSearchProvider(e.target.value); handleSave('searchProvider', e.target.value); }}>
          <option value="bocha">Bocha AI</option>
          <option value="none">None</option>
        </select>
      </div>
      <div className="settings-item">
        <div className="settings-item-info">
          <div className="settings-item-title">{t('settings.clawbot')}</div>
          <div className="settings-item-desc">{t('settings.clawbot.desc')}</div>
        </div>
        <label className="settings-toggle">
          <input type="checkbox" checked={clawbotEnabled} onChange={(e) => { setClawbotEnabled(e.target.checked); handleSave('clawbotEnabled', e.target.checked); }} />
          <span className="settings-toggle-slider"></span>
        </label>
      </div>
    </div>
  );
}
