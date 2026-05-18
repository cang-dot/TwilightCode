import { create } from 'zustand';
import type { AppConfig, Theme } from '../../types';

interface AppState {
  theme: string;
  config: AppConfig | null;
  currentDirectory: string;
  sidebarCollapsed: boolean;
  settingsOpen: boolean;
  searchOpen: boolean;

  setTheme: (theme: string) => void;
  setConfig: (config: AppConfig) => void;
  setCurrentDirectory: (dir: string) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  config: null,
  currentDirectory: process.env.HOME || process.env.USERPROFILE || '',
  sidebarCollapsed: false,
  settingsOpen: false,
  searchOpen: false,

  setTheme: (theme) => set({ theme }),
  setConfig: (config) => set({ config }),
  setCurrentDirectory: (dir) => set({ currentDirectory: dir }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setSearchOpen: (open) => set({ searchOpen: open }),
}));
