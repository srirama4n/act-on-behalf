import { useEffect, useRef, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Activity, Bot, Home, MessageCircle } from 'lucide-react';
import { ToastProvider } from '@/components/Toast';
import { DevDebugPanel } from '@/features/debug/DevDebugPanel';
import { PushBanner } from '@/features/notifications/PushBanner';

const PHONE_W = 390;
const PHONE_H = 844;

const TABS = [
  { to: '/', end: true, label: 'Home', icon: Home },
  { to: '/assistant', end: false, label: 'Assistant', icon: MessageCircle },
  { to: '/agents', end: false, label: 'Agents', icon: Bot },
  { to: '/activity', end: false, label: 'Activity', icon: Activity },
] as const;

function StatusBar() {
  return (
    <div className="flex shrink-0 items-center justify-between px-6 pb-1 pt-3 text-[11px] font-semibold text-wf-ink">
      <span>9:41</span>
      <span className="flex gap-1 opacity-70" aria-hidden>
        <span>●●●</span>
        <span>LTE</span>
        <span>100%</span>
      </span>
    </div>
  );
}

type Props = { children: ReactNode };

/** Phone bezel + tab bar; screens render via children (router Outlet). */
export function MobileShell({ children }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const location = useLocation();
  const hideTabs =
    location.pathname.startsWith('/approvals/') ||
    /^\/agents\/[^/]+$/.test(location.pathname);

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

  return (
    <div
      ref={hostRef}
      className="flex h-full min-h-0 w-full items-center justify-center overflow-hidden p-4"
    >
      <div style={{ width: PHONE_W * scale, height: PHONE_H * scale }}>
        <div
          className="origin-top-left"
          style={{
            width: PHONE_W,
            height: PHONE_H,
            transform: `scale(${scale})`,
          }}
        >
          <ToastProvider>
            <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[48px] border-[10px] border-wf-ink bg-wf-cream shadow-phone">
              <StatusBar />
              <PushBanner />
              <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
                {children}
              </div>
              {!hideTabs ? (
                <nav
                  className="flex shrink-0 items-stretch border-t border-wf-gray-300 bg-wf-white pb-2 pt-1"
                  aria-label="Main"
                >
                  {TABS.map(({ to, end, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        `relative flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium ${
                          isActive ? 'text-wf-red' : 'text-wf-gray-700'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            size={20}
                            strokeWidth={isActive ? 2.25 : 1.75}
                            aria-hidden
                          />
                          <span
                            className={
                              isActive ? 'border-b-2 border-wf-gold pb-0.5' : ''
                            }
                          >
                            {label}
                          </span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </nav>
              ) : null}
              <div
                className="mx-auto mb-2 h-1 w-28 shrink-0 rounded-full bg-wf-ink/80"
                aria-hidden
              />
              <DevDebugPanel />
            </div>
          </ToastProvider>
        </div>
      </div>
    </div>
  );
}
