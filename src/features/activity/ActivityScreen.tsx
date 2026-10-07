import { useInfiniteQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listActivity } from '@/api/automationClient';
import type { ActivityType } from '@/api/types';

const ICONS: Partial<Record<ActivityType, string>> = {
  completed: '✓',
  approved: '👍',
  denied: '✕',
  approval_requested: '!',
  failed: '⚠',
  created: '+',
  fired: '⚡',
  notified: '🔔',
};

export function ActivityScreen() {
  const q = useInfiniteQuery({
    queryKey: ['activity'],
    queryFn: ({ pageParam }) => listActivity(pageParam ?? null, 20),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });

  const items = q.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="flex h-full min-h-0 flex-col bg-wf-cream">
      <header className="flex shrink-0 items-center justify-between border-b border-wf-gray-300 bg-wf-white px-4 py-3">
        <div>
          <h1 className="text-base font-semibold">Activity</h1>
          <p className="text-[11px] text-wf-gray-700">What your agents did</p>
        </div>
        <button
          type="button"
          className="text-xs font-semibold text-wf-red"
          onClick={() => void q.refetch()}
        >
          Refresh
        </button>
      </header>

      <div
        className="min-h-0 flex-1 overflow-y-auto px-3 py-3"
        onScroll={(e) => {
          const el = e.currentTarget;
          if (
            el.scrollHeight - el.scrollTop - el.clientHeight < 80 &&
            q.hasNextPage &&
            !q.isFetchingNextPage
          ) {
            void q.fetchNextPage();
          }
        }}
      >
        {q.isLoading ? <p className="text-sm">Loading…</p> : null}
        {q.isError ? (
          <p className="text-sm text-err">Couldn’t load activity.</p>
        ) : null}
        {items.length === 0 && !q.isLoading ? (
          <p className="text-sm text-wf-gray-700">No activity yet.</p>
        ) : null}
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.eventId}
              className="flex gap-3 rounded-2xl bg-wf-white px-3 py-3 shadow-sm"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-wf-purple-soft text-sm font-bold text-wf-purple"
                aria-hidden
              >
                {ICONS[item.type] ?? '·'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-wf-ink">{item.message}</p>
                <p className="mt-0.5 text-[11px] text-wf-gray-700">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
                {item.type === 'approval_requested' ? (
                  <Link
                    to={`/agents/${item.agentId}`}
                    className="mt-1 inline-block text-xs font-semibold text-wf-red underline"
                  >
                    View agent
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
        {q.isFetchingNextPage ? (
          <p className="py-2 text-center text-xs text-wf-gray-700">Loading more…</p>
        ) : null}
      </div>
    </div>
  );
}
