import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ApiError } from '@/api/apiClient';
import { getAgent, listAgents, patchAgent } from '@/api/automationClient';
import type { AgentSummary } from '@/api/types';
import { useToast } from '@/components/Toast';
import { modeLabel } from '@/lib/deepLink';

const SUGGESTED = [
  {
    title: 'Payday sweep',
    blurb: 'Move checking balance above $5,000 to savings on payday',
    prompt: 'Move anything over $5,000 to savings on payday',
  },
  {
    title: 'Subscription price guard',
    blurb: 'Ask before allowing a recurring charge increase',
    prompt: 'Watch my StreamFlix subscription for price increases',
  },
];

export function AgentsScreen() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const q = useQuery({
    queryKey: ['agents'],
    queryFn: () => listAgents(),
  });

  const toggle = useMutation({
    mutationFn: async (agent: AgentSummary) => {
      let version = (agent as AgentSummary & { version?: number }).version;
      if (version == null) {
        const detail = await getAgent(agent.agentId);
        version = detail.version;
      }
      const next = agent.status === 'on' ? 'paused' : 'on';
      try {
        return await patchAgent(agent.agentId, next, version);
      } catch (e) {
        if (e instanceof ApiError && e.problem.code === 'version_conflict') {
          const detail = await getAgent(agent.agentId);
          return patchAgent(agent.agentId, next, detail.version);
        }
        throw e;
      }
    },
    onMutate: async (agent) => {
      await qc.cancelQueries({ queryKey: ['agents'] });
      const prev = qc.getQueryData<{ agents: AgentSummary[] }>(['agents']);
      if (prev) {
        qc.setQueryData(['agents'], {
          agents: prev.agents.map((a) =>
            a.agentId === agent.agentId
              ? {
                  ...a,
                  status: (a.status === 'on' ? 'paused' : 'on') as AgentSummary['status'],
                }
              : a,
          ),
        });
      }
      return { prev };
    },
    onError: (_e, _a, ctx) => {
      if (ctx?.prev) qc.setQueryData(['agents'], ctx.prev);
      toast('Couldn’t update agent');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['agents'] }),
  });

  const agents = q.data?.agents ?? [];
  const empty = !q.isLoading && agents.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col bg-wf-cream">
      <header className="shrink-0 border-b border-wf-gray-300 bg-wf-white px-4 py-3">
        <h1 className="text-base font-semibold">Agents</h1>
        <p className="text-[11px] text-wf-gray-700">Your personal automations</p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {q.isLoading ? (
          <p className="text-sm text-wf-gray-700">Loading…</p>
        ) : null}
        {q.isError ? (
          <p className="text-sm text-err">
            Couldn’t load agents. Is the Automation Service running?
          </p>
        ) : null}

        {!empty ? (
          <ul className="space-y-2">
            {agents.map((a) => (
              <li
                key={a.agentId}
                className="rounded-2xl border border-wf-purple/20 bg-wf-purple-soft p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/agents/${a.agentId}`} className="min-w-0 flex-1">
                    <p className="font-semibold text-wf-ink">{a.name}</p>
                    <p className="mt-0.5 text-xs text-wf-gray-700">{a.effectText}</p>
                    <span className="mt-2 inline-block rounded-md bg-wf-amber-soft px-2 py-0.5 text-[10px] font-semibold text-wf-amber">
                      {modeLabel(a.mode)}
                    </span>
                  </Link>
                  <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs">
                    <span className="sr-only">Toggle {a.name}</span>
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={a.status === 'on'}
                      onChange={() => toggle.mutate(a)}
                    />
                    <span
                      className={`relative h-6 w-11 rounded-full transition ${
                        a.status === 'on' ? 'bg-wf-red' : 'bg-wf-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                          a.status === 'on' ? 'left-5' : 'left-0.5'
                        }`}
                      />
                    </span>
                  </label>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-wf-gray-700">
              No agents yet. Ask Fargo to set one up, or pick a suggestion.
            </p>
            <ul className="space-y-2">
              {SUGGESTED.map((s) => (
                <li
                  key={s.title}
                  className="rounded-2xl border border-dashed border-wf-purple/40 bg-wf-white p-3"
                >
                  <p className="font-semibold text-wf-purple">{s.title}</p>
                  <p className="mt-1 text-xs text-wf-gray-700">{s.blurb}</p>
                  <Link
                    to="/assistant"
                    state={{ prefill: s.prompt }}
                    className="mt-2 inline-block text-xs font-semibold text-wf-red underline"
                  >
                    Ask Fargo
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
