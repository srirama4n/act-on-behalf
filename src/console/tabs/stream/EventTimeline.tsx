import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Clock3,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import type { BusDirection, BusEvent, BusEventType } from '@/bus/eventBus';
import {
  eventMatchesCorrelation,
  formatEventTime,
} from './correlation';

const TYPE_FILTERS: { id: 'all' | BusEventType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'chat.request', label: 'Request' },
  { id: 'chat.response', label: 'Response' },
  { id: 'bank.event', label: 'Bank' },
  { id: 'scheduler.tick', label: 'Schedule' },
  { id: 'notification', label: 'Notify' },
  { id: 'agent.action', label: 'Agent' },
  { id: 'contract.violation', label: 'Violation' },
];

type EventTimelineProps = {
  items: BusEvent[];
  selectedId: string | null;
  highlightToken: string | null;
  typeFilter: 'all' | BusEventType;
  search: string;
  paused: boolean;
  onSelect: (id: string) => void;
  onTypeFilter: (type: 'all' | BusEventType) => void;
  onSearch: (value: string) => void;
  onTogglePause: () => void;
  onClear: () => void;
  onExport: () => void;
  onClearHighlight: () => void;
};

export function EventTimeline({
  items,
  selectedId,
  highlightToken,
  typeFilter,
  search,
  paused,
  onSelect,
  onTypeFilter,
  onSearch,
  onTogglePause,
  onClear,
  onExport,
  onClearHighlight,
}: EventTimelineProps) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-wf-gray-300 bg-wf-white">
      <div className="shrink-0 space-y-2 border-b border-wf-gray-300 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search stream…"
            className="min-w-[140px] flex-1 rounded border border-wf-gray-300 px-2 py-1.5 text-xs text-wf-ink placeholder:text-wf-gray-700/70"
            aria-label="Search stream"
          />
          <button
            type="button"
            onClick={onTogglePause}
            className={`rounded px-2.5 py-1.5 text-xs font-semibold ${
              paused
                ? 'bg-warn/15 text-warn'
                : 'border border-wf-gray-300 text-wf-ink hover:bg-wf-cream'
            }`}
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded border border-wf-gray-300 px-2.5 py-1.5 text-xs font-semibold text-wf-ink hover:bg-wf-cream"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onExport}
            className="rounded border border-wf-gray-300 px-2.5 py-1.5 text-xs font-semibold text-wf-ink hover:bg-wf-cream"
          >
            Export
          </button>
        </div>

        <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by type">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onTypeFilter(f.id)}
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                typeFilter === f.id
                  ? 'bg-wf-red text-wf-white'
                  : 'bg-wf-cream text-wf-gray-700 hover:text-wf-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {highlightToken ? (
          <div className="flex items-center justify-between gap-2 rounded bg-wf-gold/25 px-2 py-1 text-[11px] text-wf-ink">
            <span className="truncate font-mono">
              Correlated: {highlightToken}
            </span>
            <button
              type="button"
              className="shrink-0 font-semibold underline"
              onClick={onClearHighlight}
            >
              Clear
            </button>
          </div>
        ) : null}
      </div>

      <ul className="min-h-0 flex-1 overflow-auto" aria-label="Event stream">
        {items.length === 0 ? (
          <li className="p-6 text-center text-sm text-wf-gray-700">
            {paused
              ? 'Stream paused — no new rows until resume.'
              : 'Waiting for events… open Fargo to send INIT.'}
          </li>
        ) : (
          items.map((item) => {
            const selected = item.id === selectedId;
            const correlated = eventMatchesCorrelation(item, highlightToken);
            const violated = Boolean(item.violations?.length);
            const blocked = isBlockedEvent(item);
            const danger = violated || blocked;

            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={`flex w-full items-start gap-2 border-b border-wf-gray-300/70 px-3 py-2.5 text-left transition-colors ${
                    selected
                      ? 'bg-wf-red/5'
                      : correlated
                        ? 'bg-wf-gold/20'
                        : 'hover:bg-wf-cream/80'
                  } ${danger ? 'border-l-4 border-l-err' : ''}`}
                >
                  <DirectionIcon direction={item.direction} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-mono text-[10px] text-wf-gray-700">
                        {formatEventTime(item.timestamp)}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          blocked
                            ? 'bg-err/15 text-err'
                            : 'bg-wf-cream text-wf-gray-700'
                        }`}
                      >
                        {item.type}
                      </span>
                      {item.latencyMs != null ? (
                        <span className="text-[10px] text-wf-gray-700">
                          {item.latencyMs}ms
                        </span>
                      ) : null}
                      {violated ? (
                        <span className="text-[10px] font-semibold text-err">
                          contract
                        </span>
                      ) : null}
                      {blocked ? (
                        <span className="text-[10px] font-semibold text-err">
                          blocked
                        </span>
                      ) : null}
                    </div>
                    <p
                      className={`mt-0.5 truncate text-xs font-medium ${
                        blocked ? 'text-err' : 'text-wf-ink'
                      }`}
                    >
                      {item.summary}
                    </p>
                  </div>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

function isBlockedEvent(item: {
  summary: string;
  payload: unknown;
}): boolean {
  if (item.summary.toUpperCase().includes('BLOCKED')) return true;
  if (!item.payload || typeof item.payload !== 'object') return false;
  const action = (item.payload as { action?: unknown }).action;
  return action === 'blocked';
}

function DirectionIcon({ direction }: { direction: BusDirection }) {
  const common = 'mt-0.5 shrink-0 text-wf-gray-700';
  switch (direction) {
    case 'request':
      return <ArrowRight size={14} className={`${common} text-wf-red`} aria-label="request" />;
    case 'response':
      return <ArrowLeft size={14} className={`${common} text-ok`} aria-label="response" />;
    case 'event':
      return <Zap size={14} className={`${common} text-warn`} aria-label="bank event" />;
    case 'schedule':
      return <Clock3 size={14} className={common} aria-label="schedule" />;
    case 'notification':
      return <Bell size={14} className={common} aria-label="notification" />;
    case 'agent':
      return <ShieldAlert size={14} className={common} aria-label="agent" />;
    default:
      return <Zap size={14} className={common} />;
  }
}
