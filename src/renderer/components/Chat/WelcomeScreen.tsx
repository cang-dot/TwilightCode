import React, { useState, useEffect } from 'react';
import logo from '../../assets/logo.png';
import { useI18n } from '../../stores/i18n';
import './WelcomeScreen.css';

export function WelcomeScreen() {
  const [directory, setDirectory] = useState('');
  const { t } = useI18n();

  useEffect(() => {
    window.api.getPath('home').then(setDirectory);
  }, []);

  const dirName = directory.split(/[\\/]/).pop() || '';
  const branch = 'main';
  const lastModified = '1 hour ago';

  const handleSelectDirectory = async () => {
    const dir = await window.api.openDirectory();
    if (dir) {
      window.api.setConfig('currentDirectory', dir);
    }
  };

  return (
    <div className="welcome-screen">
      <div className="welcome-logo-container">
        <img src={logo} alt="TwilightCode" width={64} height={64} className="welcome-logo" />
      </div>
      <h1 className="welcome-title">{t('welcome.title')}</h1>
      <div className="welcome-hint">/</div>
      <div className="welcome-meta">
        <span className="welcome-branch">{branch}</span>
        <span className="welcome-separator">-</span>
        <span className="welcome-time">{t('welcome.lastModified')} {lastModified}</span>
      </div>
      <div className="welcome-directory">
        <span className="welcome-dir-label">Working directory:</span>
        <span className="welcome-dir-path">{directory}</span>
        <button className="welcome-dir-btn" onClick={handleSelectDirectory}>Change</button>
      </div>
    </div>
  );
}
