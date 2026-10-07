import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listDevPushes } from '@/api/automationClient';
import type { DevPush } from '@/api/types';
import { authMode } from '@/api/config';
import { routeFromDeepLink } from '@/lib/deepLink';

export function PushBanner() {
  const nav = useNavigate();
  const seen = useRef(new Set<string>());
  const failStreak = useRef(0);
  const [banner, setBanner] = useState<DevPush | null>(null);

  useEffect(() => {
    if (authMode() !== 'dev') return;
    let cancelled = false;
    let timer: number | undefined;

    const schedule = (ms: number) => {
      timer = window.setTimeout(() => {
        void tick();
      }, ms);
    };

    const tick = async () => {
      try {
        const { pushes } = await listDevPushes();
        if (cancelled) return;
        failStreak.current = 0;
        const newest = pushes[0];
        if (newest) {
          if (seen.current.size === 0 && pushes.length > 0) {
            pushes.forEach((p) => seen.current.add(p.pushId));
          } else if (!seen.current.has(newest.pushId)) {
            seen.current.add(newest.pushId);
            setBanner(newest);
          }
        }
        schedule(3000);
      } catch {
        if (cancelled) return;
        failStreak.current += 1;
        // Back off while standalone Automation Service is offline
        schedule(Math.min(30_000, 3000 * 2 ** Math.min(failStreak.current, 3)));
      }
    };

    void tick();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  if (!banner) return null;

  return (
    <button
      type="button"
      className="absolute left-3 right-3 top-12 z-30 flex gap-3 rounded-2xl bg-wf-white p-3 text-left shadow-lg ring-1 ring-black/5"
      onClick={() => {
        const route = routeFromDeepLink(banner.deepLink);
        setBanner(null);
        if (route) nav(route);
      }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-wf-red text-sm font-bold text-wf-white"
        aria-hidden
      >
        A
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-wf-ink">
          {banner.title}
        </span>
        <span className="block text-xs text-wf-gray-700">{banner.body}</span>
      </span>
    </button>
  );
}
