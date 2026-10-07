import { useEffect, useId, useRef, useState } from 'react';
import { PanelRightClose } from 'lucide-react';
import { useRovingTabIndex } from '@/a11y/useRovingTabIndex';
import { AgentStateTable } from '@/console/tabs/agents/AgentStateTable';
import { ContextTab } from '@/console/tabs/context/ContextTab';
import { PublishTab } from '@/console/tabs/publish/PublishTab';
import { SettingsForm } from '@/console/tabs/settings/SettingsForm';
import { StreamTab } from '@/console/tabs/stream/StreamTab';
import { useSettingsStore } from '@/store/settings';

const TABS = [
  'Publish',
  'Stream',
  'Context',
  'Agents',
  'Settings',
] as const;

type ConsoleTab = (typeof TABS)[number];

type Props = {
  onMinimize?: () => void;
};

export function ConsolePanel({ onMinimize }: Props) {
  const presenterMode = useSettingsStore((s) => s.presenterMode);
  const [tab, setTab] = useState<ConsoleTab>(
    presenterMode ? 'Stream' : 'Publish',
  );
  const baseId = useId();
  const { active, setActive, onKeyDown } = useRovingTabIndex(TABS.length, 0);
  const didPresenterSwitch = useRef(false);

  useEffect(() => {
    if (presenterMode && !didPresenterSwitch.current) {
      setTab('Stream');
      setActive(TABS.indexOf('Stream'));
      didPresenterSwitch.current = true;
    }
    if (!presenterMode) didPresenterSwitch.current = false;
  }, [presenterMode, setActive]);

  return (
    <section className="flex h-full min-h-0 flex-col bg-wf-cream">
      <div className="shrink-0 border-b border-wf-gray-300 bg-wf-white px-4 pt-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-wf-gray-700">
            Demo Console
            {presenterMode ? (
              <span className="ml-2 rounded bg-wf-gold/40 px-1.5 py-0.5 text-[10px] font-bold text-wf-ink">
                Presenter
              </span>
            ) : null}
          </h2>
          {onMinimize ? (
            <button
              type="button"
              onClick={onMinimize}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-wf-gray-700 hover:bg-wf-cream hover:text-wf-ink"
              title="Minimize console"
            >
              <PanelRightClose size={15} aria-hidden className="max-[639px]:hidden" />
              <span className="min-[640px]:hidden">Close</span>
              <span className="hidden min-[640px]:inline">Minimize</span>
            </button>
          ) : null}
        </div>
        <div
          className="flex gap-1 overflow-x-auto"
          role="tablist"
          aria-label="Console tabs"
          onKeyDown={onKeyDown}
        >
          {TABS.map((name, index) => {
            const selected = tab === name;
            const tabId = `${baseId}-tab-${name}`;
            const panelId = `${baseId}-panel-${name}`;
            return (
              <button
                key={name}
                id={tabId}
                type="button"
                role="tab"
                data-roving-item
                aria-selected={selected}
                aria-controls={panelId}
                tabIndex={active === index ? 0 : -1}
                onFocus={() => setActive(index)}
                onClick={() => {
                  setTab(name);
                  setActive(index);
                }}
                className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                  selected
                    ? 'border-wf-gold text-wf-ink'
                    : 'border-transparent text-wf-gray-700 hover:text-wf-ink'
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      <div
        id={`${baseId}-panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${tab}`}
        className={`min-h-0 flex-1 ${
          tab === 'Stream' ? 'overflow-hidden p-3' : 'overflow-auto p-4'
        }`}
      >
        {tab === 'Stream' ? <StreamTab /> : null}
        {tab === 'Publish' ? <PublishTab /> : null}
        {tab === 'Context' ? <ContextTab /> : null}
        {tab === 'Agents' ? <AgentStateTable /> : null}
        {tab === 'Settings' ? <SettingsForm /> : null}
      </div>
    </section>
  );
}
