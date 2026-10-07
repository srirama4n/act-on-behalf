import { useEffect } from 'react';
import type { QrbButton } from '@/contracts/chatService';
import { useRovingTabIndex } from '@/a11y/useRovingTabIndex';

export function QrbChips({
  buttons,
  disabled,
  onSelect,
}: {
  buttons: QrbButton[];
  disabled?: boolean;
  onSelect: (button: QrbButton) => void;
}) {
  const { active, setActive, onKeyDown } = useRovingTabIndex(buttons.length, 0);

  useEffect(() => {
    setActive(0);
  }, [buttons, setActive]);

  return (
    <div
      className="flex gap-2 overflow-x-auto px-3 pb-1 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      data-testid="qrb-chips"
      role="listbox"
      aria-label="Quick replies"
      aria-orientation="horizontal"
      onKeyDown={onKeyDown}
    >
      {buttons.map((button, index) => (
        <div key={button.channelData.custom.uiElementID} role="presentation">
          <button
            type="button"
            role="option"
            data-roving-item
            aria-selected={active === index}
            tabIndex={disabled ? -1 : active === index ? 0 : -1}
            disabled={disabled}
            onFocus={() => setActive(index)}
            onClick={() => onSelect(button)}
            className="shrink-0 rounded-full border border-wf-red bg-wf-white px-3 py-1.5 text-xs font-semibold text-wf-red transition enabled:hover:bg-wf-red enabled:hover:text-wf-white disabled:opacity-40"
          >
            {button.channelData.title}
          </button>
        </div>
      ))}
    </div>
  );
}
