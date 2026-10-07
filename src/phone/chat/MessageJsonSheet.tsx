import { t } from '@/i18n';
import { useSettingsStore } from '@/store/settings';

export function MessageJsonSheet({
  data,
  onClose,
}: {
  data: unknown;
  onClose: () => void;
}) {
  const language = useSettingsStore((s) => s.language);
  const copy = t(language);

  return (
    <div
      className="absolute inset-0 z-40 flex items-end bg-wf-ink/40 p-3"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal
        aria-label={copy.messageJson}
        className="max-h-[70%] w-full overflow-hidden rounded-xl bg-wf-white shadow-phone"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-wf-gray-300 px-3 py-2">
          <h2 className="text-sm font-semibold">{copy.messageJson}</h2>
          <button
            type="button"
            className="rounded text-sm text-wf-gray-700"
            onClick={onClose}
            autoFocus
          >
            {copy.close}
          </button>
        </div>
        <pre className="max-h-[50vh] overflow-auto p-3 font-mono text-[10px] leading-relaxed text-wf-ink">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
