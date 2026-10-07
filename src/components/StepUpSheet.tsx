import { DEV_STEPUP_TOKEN, authMode } from '@/api/config';

type Props = {
  open: boolean;
  onCancel: () => void;
  onConfirm: (token: string) => void;
};

/** Standalone fake Face ID / passcode sheet. Returns dev-stepup-ok. */
export function StepUpSheet({ open, onCancel, onConfirm }: Props) {
  if (!open) return null;

  const confirm = () => {
    if (authMode() === 'dev') {
      onConfirm(DEV_STEPUP_TOKEN);
      return;
    }
    // Real env: integrate cvams with approvalId as context
    onConfirm(DEV_STEPUP_TOKEN);
  };

  return (
    <div className="absolute inset-0 z-40 flex items-end bg-black/40">
      <div
        role="dialog"
        aria-modal
        aria-labelledby="stepup-title"
        className="w-full rounded-t-3xl bg-wf-white px-5 pb-8 pt-4 shadow-phone"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-wf-gray-300" />
        <h2 id="stepup-title" className="text-lg font-semibold text-wf-ink">
          Confirm it&apos;s you
        </h2>
        <p className="mt-1 text-sm text-wf-gray-700">
          Use Face ID or passcode to approve this agent action.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-wf-red text-wf-red">
            <span className="text-2xl" aria-hidden>
              ⌘
            </span>
          </div>
          <p className="text-xs text-wf-gray-700">Face ID</p>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="flex-1 rounded-xl border border-wf-gray-300 py-3 text-sm font-semibold"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 rounded-xl bg-wf-red py-3 text-sm font-semibold text-wf-white"
            onClick={confirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
