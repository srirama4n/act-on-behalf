import { Activity, Bot, Home, MessageCircle } from 'lucide-react';
import { useRovingTabIndex } from '@/a11y/useRovingTabIndex';
import { usePhoneUiStore } from '@/store/phoneUi';
import type { PhoneTab } from './types';

export type { PhoneTab };

const TABS: { id: PhoneTab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'chat', label: 'Fargo', icon: MessageCircle },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'activity', label: 'Activity', icon: Activity },
];

type TabBarProps = {
  active: PhoneTab;
  onChange: (tab: PhoneTab) => void;
};

export function TabBar({ active, onChange }: TabBarProps) {
  const badges = usePhoneUiStore((s) => s.badges);
  const activeIndex = Math.max(
    0,
    TABS.findIndex((t) => t.id === active),
  );
  const { active: focusIndex, setActive, onKeyDown } = useRovingTabIndex(
    TABS.length,
    activeIndex,
  );

  return (
    <nav
      className="flex shrink-0 items-stretch border-t border-wf-gray-300 bg-wf-white pb-2 pt-1"
      aria-label="Phone tabs"
      role="tablist"
      onKeyDown={onKeyDown}
    >
      {TABS.map(({ id, label, icon: Icon }, index) => {
        const isActive = active === id;
        const badge = badges[id];
        const ariaLabel =
          badge > 0 ? `${label}, ${badge} notification${badge === 1 ? '' : 's'}` : label;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            data-roving-item
            aria-selected={isActive}
            aria-label={ariaLabel}
            tabIndex={focusIndex === index ? 0 : -1}
            onFocus={() => setActive(index)}
            onClick={() => {
              onChange(id);
              setActive(index);
            }}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium ${
              isActive ? 'text-wf-red' : 'text-wf-gray-700'
            }`}
          >
            <span className="relative">
              <Icon size={20} strokeWidth={isActive ? 2.25 : 1.75} aria-hidden />
              {badge > 0 ? (
                <span
                  className="absolute -right-2 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-wf-gold px-0.5 text-[9px] font-bold text-wf-ink"
                  aria-hidden
                >
                  {badge > 9 ? '9+' : badge}
                </span>
              ) : null}
            </span>
            <span className={isActive ? 'border-b-2 border-wf-gold pb-0.5' : ''}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
