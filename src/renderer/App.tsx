import React, { useEffect } from 'react';
import { Layout } from './components/Layout/Layout';
import { useAppStore } from './stores/appStore';
import { initLocale } from './stores/i18n';

declare global {
  interface Window {
    api: import('../preload').TwilightAPI;
  }
}

export default function App() {
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    initLocale();
  }, [theme]);

  return <Layout />;
}
