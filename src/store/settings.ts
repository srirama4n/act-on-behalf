import { create } from 'zustand';
import type { LangPref } from '@/contracts/chatService';

export type TransportMode = 'mock' | 'http';

interface SettingsState {
  language: LangPref;
  transport: TransportMode;
  apiBase: string;
  demoPacing: boolean;
  latencyMs: number;
  presenterMode: boolean;
  /** When true, long-press on a chat bubble shows message JSON. */
  showJsonOnLongPress: boolean;
  setLanguage: (language: LangPref) => void;
  setTransport: (transport: TransportMode) => void;
  setApiBase: (apiBase: string) => void;
  setDemoPacing: (demoPacing: boolean) => void;
  setLatencyMs: (latencyMs: number) => void;
  setPresenterMode: (presenterMode: boolean) => void;
  setShowJsonOnLongPress: (show: boolean) => void;
  resetSettings: () => void;
}

function initialTransport(): TransportMode {
  return import.meta.env.VITE_TRANSPORT === 'http' ? 'http' : 'mock';
}

const initial = {
  language: 'en' as LangPref,
  transport: initialTransport(),
  apiBase: import.meta.env.VITE_API_BASE ?? '',
  demoPacing: true,
  latencyMs: 600,
  presenterMode: false,
  showJsonOnLongPress: false,
};

export const useSettingsStore = create<SettingsState>((set) => ({
  ...initial,
  setLanguage: (language) => set({ language }),
  setTransport: (transport) => set({ transport }),
  setApiBase: (apiBase) => set({ apiBase }),
  setDemoPacing: (demoPacing) => set({ demoPacing }),
  setLatencyMs: (latencyMs) => set({ latencyMs }),
  setPresenterMode: (presenterMode) => set({ presenterMode }),
  setShowJsonOnLongPress: (showJsonOnLongPress) => set({ showJsonOnLongPress }),
  resetSettings: () => set({ ...initial }),
}));
