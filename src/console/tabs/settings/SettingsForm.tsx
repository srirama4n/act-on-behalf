import { useState } from 'react';
import type { LangPref } from '@/contracts/chatService';
import { resetDemoState } from '@/mock/engine';
import { useChatStore } from '@/store/chat';
import { useSettingsStore, type TransportMode } from '@/store/settings';
import { resetTransport } from '@/transport/createTransport';

export function SettingsForm() {
  const language = useSettingsStore((s) => s.language);
  const transport = useSettingsStore((s) => s.transport);
  const apiBase = useSettingsStore((s) => s.apiBase);
  const demoPacing = useSettingsStore((s) => s.demoPacing);
  const latencyMs = useSettingsStore((s) => s.latencyMs);
  const presenterMode = useSettingsStore((s) => s.presenterMode);
  const showJsonOnLongPress = useSettingsStore((s) => s.showJsonOnLongPress);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const setTransport = useSettingsStore((s) => s.setTransport);
  const setApiBase = useSettingsStore((s) => s.setApiBase);
  const setDemoPacing = useSettingsStore((s) => s.setDemoPacing);
  const setLatencyMs = useSettingsStore((s) => s.setLatencyMs);
  const setPresenterMode = useSettingsStore((s) => s.setPresenterMode);
  const setShowJsonOnLongPress = useSettingsStore((s) => s.setShowJsonOnLongPress);
  const restartWithLanguage = useChatStore((s) => s.restartWithLanguage);

  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const onLanguage = (lang: LangPref) => {
    if (lang === language) return;
    setLanguage(lang);
    void restartWithLanguage();
  };

  const onTransport = (mode: TransportMode) => {
    setTransport(mode);
    resetTransport();
  };

  const onApiBase = (value: string) => {
    setApiBase(value);
    if (transport === 'http') resetTransport();
  };

  const onReset = () => {
    void (async () => {
      const ms = Math.round(await resetDemoState());
      setResetMsg(`Demo reset in ${ms}ms`);
    })();
  };

  return (
    <div className="mx-auto max-w-xl space-y-4 rounded-lg border border-wf-gray-300 bg-wf-white p-4">
      <div>
        <h3 className="text-sm font-semibold text-wf-ink">Settings</h3>
        <p className="mt-0.5 text-xs text-wf-gray-700">
          Transport, pacing, language, and presenter controls.
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold uppercase tracking-wide text-wf-gray-700">
          Transport
        </legend>
        <div className="flex gap-2">
          {(['mock', 'http'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onTransport(mode)}
              className={`rounded px-3 py-1.5 text-xs font-semibold uppercase ${
                transport === mode
                  ? 'bg-wf-red text-wf-white'
                  : 'border border-wf-gray-300 text-wf-gray-700'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        <label className="block text-[11px] font-semibold text-wf-gray-700">
          HTTP base URL
          <input
            value={apiBase}
            disabled={transport !== 'http'}
            onChange={(e) => onApiBase(e.target.value)}
            placeholder="https://api.example.invalid"
            className="mt-0.5 w-full rounded border border-wf-gray-300 px-2 py-1.5 text-xs disabled:opacity-50"
          />
        </label>
        <p className="text-[11px] text-wf-gray-700">
          Posts to{' '}
          <code className="font-mono">
            {'{base}/xapi/virtual-assistant/chatbot/v1/chat'}
          </code>
          . No auth tokens are embedded — use gateway / env outside the app.
          Startup default follows <code className="font-mono">VITE_TRANSPORT</code>.
        </p>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold uppercase tracking-wide text-wf-gray-700">
          Demo pacing
        </legend>
        <label className="flex items-center gap-2 text-xs text-wf-ink">
          <input
            type="checkbox"
            checked={demoPacing}
            onChange={(e) => setDemoPacing(e.target.checked)}
            className="accent-wf-red"
          />
          Enable pacing delay
        </label>
        <label className="block text-[11px] font-semibold text-wf-gray-700">
          Latency ({latencyMs}ms)
          <input
            type="range"
            min={0}
            max={2500}
            step={50}
            value={latencyMs}
            disabled={!demoPacing}
            onChange={(e) => setLatencyMs(Number(e.target.value))}
            className="mt-1 w-full accent-wf-red disabled:opacity-40"
          />
        </label>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold uppercase tracking-wide text-wf-gray-700">
          Language
        </legend>
        <div className="flex gap-2">
          {(['es', 'en'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => onLanguage(lang)}
              className={`rounded px-3 py-1.5 text-xs font-semibold uppercase ${
                language === lang
                  ? 'bg-wf-red text-wf-white'
                  : 'border border-wf-gray-300 text-wf-gray-700'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold uppercase tracking-wide text-wf-gray-700">
          Presentation
        </legend>
        <label className="flex items-center gap-2 text-xs text-wf-ink">
          <input
            type="checkbox"
            checked={presenterMode}
            onChange={(e) => setPresenterMode(e.target.checked)}
            className="accent-wf-red"
          />
          Presenter mode (enlarge phone, hide JSON inspector)
        </label>
        <label className="flex items-center gap-2 text-xs text-wf-ink">
          <input
            type="checkbox"
            checked={showJsonOnLongPress}
            onChange={(e) => setShowJsonOnLongPress(e.target.checked)}
            className="accent-wf-red"
          />
          Show JSON on phone long-press
        </label>
      </fieldset>

      <div className="border-t border-wf-gray-300 pt-3">
        <button
          type="button"
          onClick={onReset}
          className="rounded bg-wf-red px-3 py-2 text-xs font-semibold text-wf-white hover:bg-wf-red-dark"
        >
          Reset demo
        </button>
        {resetMsg ? (
          <p className="mt-2 text-xs text-ok" data-testid="reset-status">
            {resetMsg}
          </p>
        ) : null}
      </div>
    </div>
  );
}
