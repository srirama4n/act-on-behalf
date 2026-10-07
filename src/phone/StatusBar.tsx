import { usePhoneUiStore } from '@/store/phoneUi';

export function StatusBar() {
  const statusPill = usePhoneUiStore((s) => s.statusPill);

  return (
    <div className="relative z-10 flex h-11 shrink-0 items-end justify-between px-6 pb-1.5 text-[12px] font-semibold text-wf-ink">
      <span>9:41</span>
      <div className="absolute left-1/2 top-1.5 flex -translate-x-1/2 flex-col items-center">
        <div
          className="h-[28px] w-[110px] rounded-full bg-wf-ink"
          aria-hidden
        />
        {statusPill ? (
          <span
            className="absolute top-full mt-1 max-w-[200px] truncate rounded-full bg-wf-ink px-2 py-0.5 text-[9px] font-medium text-wf-white"
            data-testid="status-pill"
          >
            {statusPill}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-1.5">
        <SignalIcon />
        <WifiIcon />
        <BatteryIcon />
      </div>
    </div>
  );
}

function SignalIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" aria-hidden>
      <rect x="0" y="8" width="2.5" height="4" rx="0.5" />
      <rect x="4" y="5.5" width="2.5" height="6.5" rx="0.5" />
      <rect x="8" y="3" width="2.5" height="9" rx="0.5" />
      <rect x="12" y="0" width="2.5" height="12" rx="0.5" opacity="0.35" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width="15" height="12" viewBox="0 0 15 12" fill="currentColor" aria-hidden>
      <path d="M7.5 9.8a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z" />
      <path
        d="M3.2 7.2a6 6 0 0 1 8.6 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M1 4.2a9 9 0 0 1 13 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="24" height="12" viewBox="0 0 24 12" fill="none" aria-hidden>
      <rect
        x="0.5"
        y="0.5"
        width="20"
        height="11"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1"
      />
      <rect x="2" y="2" width="15" height="8" rx="1.2" fill="currentColor" />
      <path d="M22 4v4a1.5 1.5 0 0 0 0-4Z" fill="currentColor" />
    </svg>
  );
}
