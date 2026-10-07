import { useState } from 'react';
import {
  defaultParams,
  type DemoEventDef,
  type DemoParams,
} from '@/mock/demoEvents';
import { publishDemoEvent } from '@/mock/engine';

export function EventCard({ def }: { def: DemoEventDef }) {
  const [params, setParams] = useState<DemoParams>(() => defaultParams(def));
  const [last, setLast] = useState<string | null>(null);

  const publish = () => {
    const result = publishDemoEvent(def.key, params);
    setLast(result.summary);
  };

  return (
    <article className="rounded-lg border border-wf-gray-300 bg-wf-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-wf-ink">{def.title}</h4>
          <p className="mt-0.5 text-xs text-wf-gray-700">{def.description}</p>
        </div>
        <button
          type="button"
          onClick={publish}
          className="shrink-0 rounded bg-wf-red px-2.5 py-1.5 text-xs font-semibold text-wf-white hover:bg-wf-red-dark"
        >
          Publish
        </button>
      </div>

      {def.params.length > 0 ? (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {def.params.map((field) => (
            <label key={field.key} className="block text-[11px] text-wf-gray-700">
              <span className="font-semibold">{field.label}</span>
              <input
                type={field.type === 'number' ? 'number' : 'text'}
                value={String(params[field.key] ?? '')}
                onChange={(e) =>
                  setParams((p) => ({
                    ...p,
                    [field.key]:
                      field.type === 'number'
                        ? Number(e.target.value)
                        : e.target.value,
                  }))
                }
                className="mt-0.5 w-full rounded border border-wf-gray-300 px-2 py-1 text-xs text-wf-ink"
              />
            </label>
          ))}
        </div>
      ) : null}

      {last ? (
        <p className="mt-2 text-[11px] text-ok">Published: {last}</p>
      ) : null}
    </article>
  );
}
