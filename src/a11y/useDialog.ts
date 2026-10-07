import { useEffect, useRef } from 'react';

/** Escape to close + restore focus when a dialog opens. */
export function useDialog(opts: {
  open: boolean;
  onClose: () => void;
}) {
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!opts.open) return;

    previouslyFocused.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        opts.onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [opts.open, opts.onClose]);
}
