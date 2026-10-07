import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteAgent, getAgent } from '@/api/automationClient';
import { useToast } from '@/components/Toast';
import { modeLabel } from '@/lib/deepLink';

export function AgentDetailScreen() {
  const { agentId = '' } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();

  const q = useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => getAgent(agentId),
    enabled: Boolean(agentId),
  });

  const del = useMutation({
    mutationFn: () => deleteAgent(agentId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['agents'] });
      toast('Agent deleted');
      nav('/agents');
    },
    onError: () => toast('Couldn’t delete agent'),
  });

  const a = q.data;

  return (
    <div className="flex h-full min-h-0 flex-col bg-wf-cream">
      <header className="flex shrink-0 items-center gap-2 border-b border-wf-gray-300 bg-wf-white px-3 py-3">
        <Link to="/agents" className="text-sm font-semibold text-wf-red">
          ← Agents
        </Link>
        <h1 className="truncate text-base font-semibold">{a?.name ?? 'Agent'}</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {q.isLoading ? <p className="text-sm">Loading…</p> : null}
        {q.isError ? (
          <p className="text-sm text-err">Agent not found.</p>
        ) : null}
        {a ? (
          <div className="space-y-4">
            <section className="rounded-2xl bg-wf-purple-soft p-3">
              <p className="text-sm text-wf-ink">{a.effectText}</p>
              <span className="mt-2 inline-block rounded-md bg-wf-amber-soft px-2 py-0.5 text-[10px] font-semibold text-wf-amber">
                {modeLabel(a.mode)}
              </span>
              <p className="mt-2 text-xs capitalize text-wf-gray-700">
                Status: {a.status}
              </p>
            </section>

            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-wf-gray-700">
                Trigger
              </h2>
              <p className="mt-1 text-sm">{a.trigger.description}</p>
            </section>

            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-wf-gray-700">
                Params
              </h2>
              <ul className="mt-1 space-y-1">
                {a.params.map((p) => (
                  <li key={p.label} className="flex justify-between text-sm">
                    <span className="text-wf-gray-700">{p.label}</span>
                    <span className="font-medium">{p.value}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-wf-gray-700">
                Guards & limits
              </h2>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm">
                {a.guards.map((g) => (
                  <li key={g.description}>{g.description}</li>
                ))}
                {a.limits.map((l) => (
                  <li key={l.description}>{l.description}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-wf-gray-700">
                Permissions
              </h2>
              <p className="mt-1 text-xs text-wf-gray-700">
                Tools: {a.grant.allowedTools.join(', ') || '—'}
              </p>
              <ul className="mt-1 space-y-1">
                {a.grant.accountScopes.map((s) => (
                  <li key={s.label} className="flex justify-between text-sm">
                    <span className="text-wf-gray-700">{s.label}</span>
                    <span>{s.value}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-wf-gray-700">
                Recent runs
              </h2>
              {a.recentRuns.length === 0 ? (
                <p className="mt-1 text-sm text-wf-gray-700">No runs yet</p>
              ) : (
                <ul className="mt-1 space-y-2">
                  {a.recentRuns.map((r) => (
                    <li
                      key={r.runId}
                      className="rounded-xl bg-wf-white px-3 py-2 text-sm shadow-sm"
                    >
                      <p className="font-medium">{r.summary}</p>
                      <p className="text-[11px] capitalize text-wf-gray-700">
                        {r.state} · {new Date(r.updatedAt).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <button
              type="button"
              className="w-full rounded-xl border border-err/40 py-3 text-sm font-semibold text-err"
              onClick={() => {
                if (
                  window.confirm(
                    `Delete ${a.name}? It will stop running and any pending approvals will expire.`,
                  )
                ) {
                  del.mutate();
                }
              }}
            >
              Delete agent
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
