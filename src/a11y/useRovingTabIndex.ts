import { useCallback, useState, type KeyboardEvent } from 'react';

/** Arrow-key roving tabindex for horizontal tablists / chip rows. */
export function useRovingTabIndex(count: number, initial = 0) {
  const [active, setActive] = useState(initial);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (count <= 0) return;
      let next = active;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        next = (active + 1) % count;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        next = (active - 1 + count) % count;
      } else if (e.key === 'Home') {
        e.preventDefault();
        next = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        next = count - 1;
      } else {
        return;
      }
      setActive(next);
      const root = e.currentTarget as HTMLElement;
      const items = root.querySelectorAll<HTMLElement>('[data-roving-item]');
      items[next]?.focus();
    },
    [active, count],
  );

  return { active, setActive, onKeyDown };
}
