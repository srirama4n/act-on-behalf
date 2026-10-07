import { t } from '@/i18n';
import { useActivityStore, type ActivityType } from '@/store/activity';
import { useSettingsStore } from '@/store/settings';

const LABELS_EN: Record<ActivityType, string> = {
  notification: 'Notification',
  approval: 'Approval',
  agent: 'Agent',
  blocked: 'Blocked',
  account: 'Account',
  system: 'System',
};

const LABELS_ES: Record<ActivityType, string> = {
  notification: 'Notificación',
  approval: 'Aprobación',
  agent: 'Agente',
  blocked: 'Bloqueado',
  account: 'Cuenta',
  system: 'Sistema',
};

export function ActivityScreen() {
  const language = useSettingsStore((s) => s.language);
  const copy = t(language);
  const items = useActivityStore((s) => s.items);
  const labels = language === 'es' ? LABELS_ES : LABELS_EN;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-wf-cream">
      <header className="shrink-0 border-b-2 border-wf-gold bg-wf-red px-4 py-3">
        <p className="text-sm font-bold text-wf-white">{copy.activityTitle}</p>
        <p className="text-xs text-wf-white/85">{copy.activitySubtitle}</p>
      </header>

      <ul
        className="min-h-0 flex-1 overflow-y-auto p-3"
        data-testid="activity-list"
      >
        {items.length === 0 ? (
          <li className="rounded-lg border border-dashed border-wf-gray-300 bg-wf-white px-3 py-6 text-center text-xs text-wf-gray-700">
            {copy.activityEmpty}
          </li>
        ) : (
          items.map((item) => (
            <li
              key={item.id}
              className={`mb-2 rounded-xl border bg-wf-white px-3 py-2 ${
                item.blocked || item.type === 'blocked'
                  ? 'border-err/50'
                  : 'border-wf-gray-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                    item.blocked || item.type === 'blocked'
                      ? 'bg-err/15 text-err'
                      : 'bg-wf-cream text-wf-gray-700'
                  }`}
                >
                  {labels[item.type]}
                </span>
                <span className="font-mono text-[10px] text-wf-gray-700">
                  {new Date(item.at).toLocaleTimeString()}
                </span>
              </div>
              <p
                className={`mt-1 text-sm font-semibold ${
                  item.blocked || item.type === 'blocked'
                    ? 'text-err'
                    : 'text-wf-ink'
                }`}
              >
                {item.title}
              </p>
              <p className="mt-0.5 text-xs text-wf-gray-700">{item.detail}</p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
