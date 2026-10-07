import { useMemo, useState } from 'react';
import { JsonView, allExpanded, defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import type { BusEvent } from '@/bus/eventBus';
import { HeaderTable } from './HeaderTable';

type InspectorTab = 'headers' | 'jsonString' | 'raw';

type JsonInspectorProps = {
  event: BusEvent | null;
  highlightToken: string | null;
  onTokenClick: (token: string) => void;
};

export function JsonInspector({
  event,
  highlightToken,
  onTokenClick,
}: JsonInspectorProps) {
  const [tab, setTab] = useState<InspectorTab>('jsonString');
  const [copied, setCopied] = useState(false);

  const envelope = useMemo(() => asEnvelope(event?.payload), [event]);

  if (!event) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center rounded-lg border border-dashed border-wf-gray-300 bg-wf-white p-6 text-sm text-wf-gray-700">
        Select a stream row to inspect JSON
      </div>
    );
  }

  const copyPayload = async () => {
    const text = JSON.stringify(event.payload, null, 2);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-wf-gray-300 bg-wf-white">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-wf-gray-300 px-3 py-2">
        <div className="flex gap-1" role="tablist" aria-label="Inspector views">
          {(
            [
              ['headers', 'headers'],
              ['jsonString', 'jsonString'],
              ['raw', 'raw'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`rounded px-2.5 py-1 text-xs font-semibold ${
                tab === id
                  ? 'bg-wf-red text-wf-white'
                  : 'text-wf-gray-700 hover:bg-wf-cream'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void copyPayload()}
          className="rounded border border-wf-gray-300 px-2 py-1 text-xs font-semibold text-wf-ink hover:bg-wf-cream"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {event.violations && event.violations.length > 0 ? (
        <div className="shrink-0 border-b border-err/30 bg-err/10 px-3 py-2 text-xs text-err">
          <p className="font-semibold">Contract violation</p>
          <ul className="mt-1 list-disc pl-4">
            {event.violations.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto p-3" role="tabpanel">
        {tab === 'headers' ? (
          envelope?.headers ? (
            <HeaderTable
              headers={envelope.headers}
              highlightToken={highlightToken}
              onTokenClick={onTokenClick}
            />
          ) : (
            <p className="text-sm text-wf-gray-700">
              No headers on this event payload.
            </p>
          )
        ) : null}

        {tab === 'jsonString' ? (
          envelope ? (
            <div className="text-xs">
              <ClickableTokens
                highlightToken={highlightToken}
                onTokenClick={onTokenClick}
                tokens={collectBodyTokens(envelope.jsonString)}
              />
              <JsonView
                data={(envelope.jsonString ?? event.payload) as object}
                style={defaultStyles}
                shouldExpandNode={allExpanded}
              />
            </div>
          ) : (
            <div className="text-xs">
              <JsonView
                data={event.payload as object}
                style={defaultStyles}
                shouldExpandNode={allExpanded}
              />
            </div>
          )
        ) : null}

        {tab === 'raw' ? (
          <pre className="overflow-auto rounded bg-wf-cream p-2 font-mono text-[11px] leading-relaxed text-wf-ink">
            {JSON.stringify(event.payload, null, 2)}
          </pre>
        ) : null}
      </div>
    </div>
  );
}

function asEnvelope(payload: unknown): {
  headers?: Record<string, unknown>;
  jsonString?: unknown;
} | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  if (!('headers' in p) && !('jsonString' in p)) return null;
  return {
    headers:
      p.headers && typeof p.headers === 'object'
        ? (p.headers as Record<string, unknown>)
        : undefined,
    jsonString: p.jsonString,
  };
}

function collectBodyTokens(jsonString: unknown): { label: string; value: string }[] {
  if (!jsonString || typeof jsonString !== 'object') return [];
  const body = jsonString as Record<string, unknown>;
  const out: { label: string; value: string }[] = [];
  if (typeof body.id === 'string') out.push({ label: 'id', value: body.id });
  if (typeof body.replyTo === 'string') {
    out.push({ label: 'replyTo', value: body.replyTo });
  }
  const conv = body.conversation;
  if (conv && typeof conv === 'object') {
    const id = (conv as { id?: unknown }).id;
    if (typeof id === 'string') {
      out.push({ label: 'conversation.id', value: id });
    }
  }
  return out;
}

function ClickableTokens({
  tokens,
  highlightToken,
  onTokenClick,
}: {
  tokens: { label: string; value: string }[];
  highlightToken: string | null;
  onTokenClick: (token: string) => void;
}) {
  if (!tokens.length) return null;
  return (
    <div className="mb-2 flex flex-wrap gap-1.5">
      {tokens.map((t) => (
        <button
          key={`${t.label}:${t.value}`}
          type="button"
          onClick={() => onTokenClick(t.value)}
          className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${
            highlightToken === t.value
              ? 'border-wf-gold bg-wf-gold/30'
              : 'border-wf-gray-300 bg-wf-cream text-wf-gray-700 hover:border-wf-red'
          }`}
          title="Highlight related stream rows"
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
