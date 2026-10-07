import { useState } from 'react';
import { eventBus } from '@/bus/eventBus';

const HINT = `{
  "type": "bank.event",
  "summary": "Custom demo event",
  "payload": { "hello": "world" }
}`;

export function CustomEventEditor() {
  const [raw, setRaw] = useState(HINT);
  const [error, setError] = useState<string | null>(null);

  const publish = () => {
    try {
      const parsed = JSON.parse(raw) as {
        type?: string;
        summary?: string;
        payload?: unknown;
      };
      eventBus.publish({
        type: 'bank.event',
        direction: 'event',
        summary: parsed.summary ?? 'Custom event',
        payload: parsed.payload ?? parsed,
      });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  return (
    <div className="rounded-lg border border-wf-gray-300 bg-wf-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Custom event</h3>
          <p className="text-xs text-wf-gray-700">
            Raw JSON published to the bus (schema hint below).
          </p>
        </div>
        <button
          type="button"
          onClick={publish}
          className="rounded bg-wf-red px-2.5 py-1.5 text-xs font-semibold text-wf-white"
        >
          Publish
        </button>
      </div>
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={8}
        className="w-full rounded border border-wf-gray-300 bg-wf-cream p-2 font-mono text-[11px] text-wf-ink"
        spellCheck={false}
      />
      {error ? <p className="mt-1 text-xs text-err">{error}</p> : null}
    </div>
  );
}
