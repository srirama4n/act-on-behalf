/** Placeholder wordmark — swap for approved brand asset later. */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`font-sans text-[10px] font-bold tracking-[0.18em] text-wf-white ${className}`}
      aria-label="Wells Fargo"
    >
      WELLS FARGO
    </span>
  );
}
