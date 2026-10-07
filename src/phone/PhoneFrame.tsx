import { useEffect, useRef, useState } from 'react';
import { usePhoneUiStore } from '@/store/phoneUi';
import { PushBanner } from './PushBanner';
import { StatusBar } from './StatusBar';
import { TabBar, type PhoneTab } from './TabBar';
import { ActivityScreen } from './screens/ActivityScreen';
import { AgentsScreen } from './screens/AgentsScreen';
import { ChatScreen } from './screens/ChatScreen';
import { HomeScreen } from './screens/HomeScreen';

const PHONE_W = 390;
const PHONE_H = 844;

export function PhoneFrame() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const tab = usePhoneUiStore((s) => s.activeTab);
  const setActiveTab = usePhoneUiStore((s) => s.setActiveTab);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      const next = Math.min(width / PHONE_W, height / PHONE_H, 1);
      setScale(next > 0 ? next : 1);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleTab = (next: PhoneTab) => {
    setActiveTab(next);
  };

  return (
    <div
      ref={hostRef}
      className="flex h-full min-h-0 w-full items-center justify-center overflow-hidden p-4"
    >
      <div
        style={{
          width: PHONE_W * scale,
          height: PHONE_H * scale,
        }}
      >
        <div
          className="origin-top-left"
          style={{
            width: PHONE_W,
            height: PHONE_H,
            transform: `scale(${scale})`,
          }}
        >
          <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[48px] border-[10px] border-wf-ink bg-wf-cream shadow-phone">
            <StatusBar />
            <PushBanner />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {tab === 'home' ? <HomeScreen /> : null}
              {tab === 'chat' ? <ChatScreen /> : null}
              {tab === 'agents' ? <AgentsScreen /> : null}
              {tab === 'activity' ? <ActivityScreen /> : null}
            </div>
            <TabBar active={tab} onChange={handleTab} />
            <div
              className="mx-auto mb-2 h-1 w-28 shrink-0 rounded-full bg-wf-ink/80"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </div>
  );
}
