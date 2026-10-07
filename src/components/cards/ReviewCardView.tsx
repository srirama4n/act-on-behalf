import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { AgentCreatedCard, ReviewCard } from '@/api/types';
import { modeLabel } from '@/lib/deepLink';

type Props = {
  card: ReviewCard;
  created?: AgentCreatedCard | null;
  declined?: boolean;
  busy?: boolean;
  onCreate: () => void;
  onDecline: () => void;
};

export function ReviewCardView({
  card,
  created,
  declined,
  busy,
  onCreate,
  onDecline,
}: Props) {
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <article className="mt-2 overflow-hidden rounded-2xl border border-wf-purple/20 bg-wf-purple-soft">
      <div className="border-b border-wf-purple/15 bg-wf-purple px-3 py-2">
        <p className="text-sm font-semibold text-wf-white">{card.name}</p>
        <p className="text-[11px] text-white/80">{card.sourceNote}</p>
      </div>
      <div className="space-y-3 p-3">
        <p className="text-sm text-wf-ink">{card.effectText}</p>
        <ul className="space-y-1">
          {card.params.map((p) => (
            <li
              key={p.label}
              className="flex justify-between gap-2 text-xs text-wf-gray-700"
            >
              <span>{p.label}</span>
              <span className="font-medium text-wf-ink">{p.value}</span>
            </li>
          ))}
        </ul>
        <ul className="space-y-0.5">
          {card.limits.map((l) => (
            <li key={l} className="text-[11px] text-wf-gray-700">
              · {l}
            </li>
          ))}
        </ul>
        <span className="inline-block rounded-md bg-wf-amber-soft px-2 py-0.5 text-[11px] font-semibold text-wf-amber">
          {modeLabel(card.mode)}
        </span>
        {card.rules ? (
          <div>
            <button
              type="button"
              className="text-xs font-semibold text-wf-purple underline"
              onClick={() => setRulesOpen((v) => !v)}
            >
              {rulesOpen ? 'Hide rules' : 'View rules'}
            </button>
            {rulesOpen ? (
              <pre className="mt-1 max-h-28 overflow-auto rounded-lg bg-wf-white/70 p-2 text-[10px] text-wf-gray-700">
                {JSON.stringify(card.rules, null, 2)}
              </pre>
            ) : null}
          </div>
        ) : null}

        {created ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-ok/15 px-3 py-1 text-xs font-semibold text-ok">
              Agent is on
            </span>
            <Link
              to={`/agents/${created.agentId}`}
              className="text-xs font-semibold text-wf-red underline"
            >
              View in Agents
            </Link>
          </div>
        ) : declined ? (
          <p className="text-xs font-medium text-wf-gray-700">Not created</p>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              className="flex-1 rounded-xl bg-wf-red py-2.5 text-sm font-semibold text-wf-white disabled:opacity-50"
              onClick={onCreate}
            >
              {busy ? 'Creating…' : 'Create'}
            </button>
            <button
              type="button"
              disabled={busy}
              className="flex-1 rounded-xl border border-wf-gray-300 bg-wf-white py-2.5 text-sm font-semibold disabled:opacity-50"
              onClick={onDecline}
            >
              Not now
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
