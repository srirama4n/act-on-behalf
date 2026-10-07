import { useMemo, useState } from 'react';
import type { BusEventType } from '@/bus/eventBus';
import { useEventsStore } from '@/store/events';
import { useSettingsStore } from '@/store/settings';
import { filterEvents } from './correlation';
import { EventTimeline } from './EventTimeline';
import { JsonInspector } from './JsonInspector';

export function StreamTab() {
  const items = useEventsStore((s) => s.items);
  const paused = useEventsStore((s) => s.paused);
  const selectedId = useEventsStore((s) => s.selectedId);
  const highlightToken = useEventsStore((s) => s.highlightToken);
  const select = useEventsStore((s) => s.select);
  const setPaused = useEventsStore((s) => s.setPaused);
  const clear = useEventsStore((s) => s.clear);
  const setHighlightToken = useEventsStore((s) => s.setHighlightToken);
  const presenterMode = useSettingsStore((s) => s.presenterMode);

  const [typeFilter, setTypeFilter] = useState<'all' | BusEventType>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => filterEvents(items, { typeFilter, search }),
    [items, typeFilter, search],
  );

  const selected =
    filtered.find((i) => i.id === selectedId) ??
    items.find((i) => i.id === selectedId) ??
    null;

  const exportSession = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fargo-stream-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`grid h-full min-h-0 gap-3 ${
        presenterMode
          ? 'grid-rows-1'
          : 'grid-rows-[minmax(220px,1fr)_minmax(240px,1fr)] xl:grid-cols-2 xl:grid-rows-1'
      }`}
    >
      <EventTimeline
        items={filtered}
        selectedId={selectedId}
        highlightToken={highlightToken}
        typeFilter={typeFilter}
        search={search}
        paused={paused}
        onSelect={select}
        onTypeFilter={setTypeFilter}
        onSearch={setSearch}
        onTogglePause={() => setPaused(!paused)}
        onClear={clear}
        onExport={exportSession}
        onClearHighlight={() => setHighlightToken(null)}
      />
      {!presenterMode ? (
        <JsonInspector
          event={selected}
          highlightToken={highlightToken}
          onTokenClick={(token) =>
            setHighlightToken(highlightToken === token ? null : token)
          }
        />
      ) : null}
    </div>
  );
}
