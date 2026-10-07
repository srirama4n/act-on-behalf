import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { automationFetch } from '@/api/apiClient';
import { listAgents, triggerAgent } from '@/api/automationClient';
import { authMode } from '@/api/config';

export function DevDebugPanel() {
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState('');
  const agents = useQuery({
    queryKey: ['agents'],
    queryFn: () => listAgents(),
    enabled: authMode() === 'dev' && open,
  });

  if (authMode() !== 'dev') return null;

  const first = agents.data?.agents[0];

  const run = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
      setLog(`${label}: ok`);
    } catch (e) {
      setLog(`${label}: ${(e as Error).message}`);
    }
  };

  return (
    <div className="absolute right-3 top-14 z-40">
      <button
        type="button"
        className="rounded-full bg-wf-ink px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-wf-gold shadow"
        onClick={() => setOpen((v) => !v)}
      >
        Dev
      </button>
      {open ? (
        <div className="mt-2 w-56 rounded-xl bg-wf-white p-3 text-xs shadow-lg ring-1 ring-black/10">
          <p className="mb-2 font-semibold">Standalone debug</p>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              className="rounded-lg bg-wf-red px-2 py-1.5 text-left font-medium text-white disabled:opacity-40"
              disabled={!first}
              onClick={() =>
                void run('Simulate payday', () =>
                  triggerAgent(first!.agentId, { periodId: '2026-10-15' }),
                )
              }
            >
              Simulate payday
            </button>
            <button
              type="button"
              className="rounded-lg bg-wf-purple px-2 py-1.5 text-left font-medium text-white disabled:opacity-40"
              disabled={!first}
              onClick={() =>
                void run('Simulate price increase', () =>
                  triggerAgent(first!.agentId, {
                    type: 'recurring_charge_increased',
                    merchant: 'StreamFlix',
                    from: 15.49,
                    to: 17.99,
                  }),
                )
              }
            >
              Simulate price increase
            </button>
            <button
              type="button"
              className="rounded-lg border border-wf-gray-300 px-2 py-1.5 text-left font-medium"
              onClick={() =>
                void run('Make next reply fail', () =>
                  automationFetch('/v1/dev/replies/next', {
                    method: 'POST',
                    body: JSON.stringify({
                      error: {
                        code: 'forced_fail',
                        message: 'Next reply will fail (dev)',
                      },
                    }),
                  }),
                )
              }
            >
              Make next reply fail
            </button>
          </div>
          {log ? <p className="mt-2 text-[10px] text-wf-gray-700">{log}</p> : null}
          {!first ? (
            <p className="mt-2 text-[10px] text-wf-gray-700">
              Create an agent in chat first.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
