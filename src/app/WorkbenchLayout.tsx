import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ChevronLeft, PanelRightOpen } from 'lucide-react';
import { TopBar } from '@/app/TopBar';
import { MobileShell } from '@/components/MobileShell';
import { ConsolePanel } from '@/console/ConsolePanel';
import { useSettingsStore } from '@/store/settings';
import type { LangPref } from '@/contracts/chatService';

const STORAGE_KEY = 'fargo.consoleMinimized';

export function WorkbenchLayout() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [minimized, setMinimized] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const transport = useSettingsStore((s) => s.transport);
  const presenterMode = useSettingsStore((s) => s.presenterMode);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, minimized ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [minimized]);

  const onLanguageChange = (lang: LangPref) => {
    if (lang === language) return;
    setLanguage(lang);
  };

  const expandConsole = () => {
    setMinimized(false);
    setSheetOpen(true);
  };

  const minimizeConsole = () => {
    setMinimized(true);
    setSheetOpen(false);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-wf-cream">
      <a href="#phone-stage" className="skip-link">
        Skip to phone
      </a>
      <a href="#demo-console" className="skip-link" style={{ left: '7.5rem' }}>
        Skip to console
      </a>

      <TopBar
        env={transport === 'mock' ? 'MOCK' : 'RQA'}
        language={language}
        presenterMode={presenterMode}
        onLanguageChange={onLanguageChange}
      />

      <div
        className={`relative grid min-h-0 flex-1 grid-cols-1 ${
          minimized
            ? 'min-[640px]:grid-cols-[1fr_3rem]'
            : presenterMode
              ? 'max-[1099px]:grid-rows-[minmax(560px,1fr)_minmax(140px,0.3fr)] min-[1100px]:grid-cols-[minmax(560px,3.2fr)_minmax(260px,1fr)]'
              : 'max-[1099px]:grid-rows-[minmax(420px,1fr)_minmax(280px,1fr)] min-[1100px]:grid-cols-[minmax(420px,2fr)_3fr]'
        }`}
      >
        <aside
          id="phone-stage"
          tabIndex={-1}
          className="relative min-h-0 overflow-hidden border-b border-wf-gray-300 bg-[linear-gradient(180deg,#ebe4df_0%,#f4f0ed_40%,#e8e0da_100%)] outline-none min-[640px]:border-b-0 min-[640px]:border-r"
        >
          <MobileShell>
            <Outlet />
          </MobileShell>

          <button
            type="button"
            className="absolute bottom-4 right-4 z-20 rounded-lg bg-wf-red px-3 py-2 text-xs font-semibold text-wf-white shadow-lg min-[640px]:hidden"
            onClick={expandConsole}
          >
            Console
          </button>
        </aside>

        {minimized ? (
          <aside className="hidden min-h-0 border-l border-wf-gray-300 bg-wf-white min-[640px]:flex">
            <button
              type="button"
              onClick={expandConsole}
              className="flex h-full w-full flex-col items-center gap-3 px-1 py-4 text-wf-gray-700 hover:bg-wf-cream hover:text-wf-ink"
              aria-expanded={false}
              aria-controls="demo-console"
              title="Open demo console"
            >
              <PanelRightOpen size={18} aria-hidden />
              <ChevronLeft size={16} aria-hidden />
              <span
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ writingMode: 'vertical-rl' }}
              >
                Demo Console
              </span>
            </button>
          </aside>
        ) : (
          <main
            id="demo-console"
            tabIndex={-1}
            className={`min-h-0 overflow-hidden outline-none max-[639px]:fixed max-[639px]:inset-x-0 max-[639px]:bottom-0 max-[639px]:z-30 max-[639px]:h-[70vh] max-[639px]:rounded-t-2xl max-[639px]:border-t max-[639px]:border-wf-gray-300 max-[639px]:shadow-phone max-[639px]:transition-transform motion-reduce:transition-none ${
              sheetOpen
                ? 'max-[639px]:translate-y-0'
                : 'max-[639px]:translate-y-full max-[639px]:pointer-events-none'
            } min-[640px]:relative min-[640px]:translate-y-0`}
          >
            <ConsolePanel onMinimize={minimizeConsole} />
          </main>
        )}
      </div>
    </div>
  );
}
