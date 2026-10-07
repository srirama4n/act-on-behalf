import { useSessionStore } from '@/store/session';
import { useSettingsStore, type TransportMode } from '@/store/settings';
import type { ChatTransport } from './ChatTransport';
import { HttpTransport } from './HttpTransport';
import { MockTransport } from './MockTransport';

export function resolveTransportMode(
  settingsMode?: TransportMode,
  envMode: string | undefined = import.meta.env.VITE_TRANSPORT,
): TransportMode {
  if (settingsMode === 'http' || settingsMode === 'mock') {
    return settingsMode;
  }
  return envMode === 'http' ? 'http' : 'mock';
}

/** Build the active transport. Prefer Settings; fall back to VITE_TRANSPORT. */
export function createTransport(): ChatTransport {
  const settings = useSettingsStore.getState();
  const mode = resolveTransportMode(settings.transport);

  if (mode === 'http') {
    return new HttpTransport({
      getApiBase: () => {
        const fromSettings = useSettingsStore.getState().apiBase.trim();
        if (fromSettings) return fromSettings;
        return (import.meta.env.VITE_API_BASE ?? '').trim();
      },
    });
  }

  return new MockTransport({
    getSession: () => useSessionStore.getState().session,
    getLanguage: () => useSettingsStore.getState().language,
    getLatencyMs: () => {
      const s = useSettingsStore.getState();
      return s.demoPacing ? s.latencyMs : 0;
    },
  });
}

let singleton: ChatTransport | null = null;

export function getTransport(): ChatTransport {
  if (!singleton) singleton = createTransport();
  return singleton;
}

export function resetTransport(): void {
  singleton = null;
}
