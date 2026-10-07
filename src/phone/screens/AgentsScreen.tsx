import { t } from '@/i18n';
import { AGENT_DEFS } from '@/mock/agents';
import { useAgentsStore } from '@/store/agents';
import { useSettingsStore } from '@/store/settings';

export function AgentsScreen() {
  const language = useSettingsStore((s) => s.language);
  const copy = t(language);
  const runtime = useAgentsStore((s) => s.runtime);
  const setEnabled = useAgentsStore((s) => s.setEnabled);
  const approve = useAgentsStore((s) => s.approve);
  const decline = useAgentsStore((s) => s.decline);

  const pending = AGENT_DEFS.filter((d) => runtime[d.id].pendingApproval);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-wf-cream">
      <header className="shrink-0 border-b-2 border-wf-gold bg-wf-red px-4 py-3">
        <p className="text-sm font-bold text-wf-white">{copy.agentsTitle}</p>
        <p className="text-xs text-wf-white/85">{copy.agentsSubtitle}</p>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {pending.length > 0 ? (
          <section className="space-y-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-warn">
              {copy.needsApproval}
            </h2>
            {pending.map((def) => {
              const p = runtime[def.id].pendingApproval!;
              return (
                <article
                  key={p.id}
                  className="rounded-xl border border-warn/40 bg-wf-white p-3"
                  data-testid="pending-approval"
                >
                  <p className="text-sm font-semibold text-wf-ink">{def.name}</p>
                  <p className="mt-1 text-xs text-wf-gray-700">{p.summary}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      className="rounded bg-wf-red px-3 py-1.5 text-xs font-semibold text-wf-white"
                      onClick={() => approve(def.id)}
                    >
                      {copy.approve}
                    </button>
                    <button
                      type="button"
                      className="rounded border border-wf-gray-300 px-3 py-1.5 text-xs font-semibold"
                      onClick={() => decline(def.id)}
                    >
                      {copy.decline}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        ) : null}

        <section className="space-y-2">
          {AGENT_DEFS.map((def) => {
            const rt = runtime[def.id];
            return (
              <article
                key={def.id}
                className="rounded-xl border border-wf-gray-300 bg-wf-white p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-wf-ink">{def.name}</p>
                    <p className="mt-1 text-xs text-wf-gray-700">{def.rule}</p>
                  </div>
                  <label className="flex shrink-0 items-center gap-1 text-[11px] text-wf-gray-700">
                    <input
                      type="checkbox"
                      checked={rt.enabled}
                      onChange={(e) => setEnabled(def.id, e.target.checked)}
                      className="accent-wf-red"
                    />
                    On
                  </label>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="rounded-full bg-wf-cream px-2 py-0.5 text-[10px] font-semibold text-wf-gray-700">
                    {def.trigger}
                  </span>
                  {def.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="rounded-full border border-wf-gray-300 px-2 py-0.5 text-[10px] text-wf-gray-700"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
