import { AGENT_DEFS, type AgentId } from '@/mock/agents';
import { useAgentsStore } from '@/store/agents';

export function AgentStateTable() {
  const runtime = useAgentsStore((s) => s.runtime);
  const setEnabled = useAgentsStore((s) => s.setEnabled);
  const forceRun = useAgentsStore((s) => s.forceRun);

  return (
    <div className="overflow-auto rounded-lg border border-wf-gray-300 bg-wf-white">
      <table className="w-full min-w-[640px] border-collapse text-left text-xs">
        <thead className="bg-wf-cream text-wf-gray-700">
          <tr>
            <th className="px-3 py-2 font-semibold">Agent</th>
            <th className="px-3 py-2 font-semibold">State</th>
            <th className="px-3 py-2 font-semibold">Trigger</th>
            <th className="px-3 py-2 font-semibold">Last run</th>
            <th className="px-3 py-2 font-semibold">Runs today</th>
            <th className="px-3 py-2 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {AGENT_DEFS.map((def) => {
            const rt = runtime[def.id as AgentId];
            return (
              <tr key={def.id} className="border-t border-wf-gray-300">
                <td className="px-3 py-2 font-semibold text-wf-ink">{def.name}</td>
                <td className="px-3 py-2">
                  {rt.pendingApproval
                    ? 'Needs approval'
                    : rt.enabled
                      ? 'Active'
                      : 'Off'}
                </td>
                <td className="px-3 py-2 text-wf-gray-700">{def.trigger}</td>
                <td className="px-3 py-2 font-mono text-wf-gray-700">
                  {rt.lastRun
                    ? new Date(rt.lastRun).toLocaleTimeString()
                    : '—'}
                </td>
                <td className="px-3 py-2">{rt.runsToday}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      className="rounded border border-wf-gray-300 px-2 py-1 font-semibold"
                      onClick={() => setEnabled(def.id, !rt.enabled)}
                    >
                      {rt.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      type="button"
                      className="rounded border border-wf-gray-300 px-2 py-1 font-semibold"
                      onClick={() => forceRun(def.id)}
                    >
                      Force-run
                    </button>
                    <button
                      type="button"
                      className="rounded border border-err/40 px-2 py-1 font-semibold text-err"
                      onClick={() =>
                        forceRun(def.id, { denyPermission: true })
                      }
                    >
                      Deny permission
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
