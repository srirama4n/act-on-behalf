import { useSessionStore } from '@/store/session';

export function SessionInfo() {
  const session = useSessionStore((s) => s.session);

  return (
    <div className="rounded-lg border border-wf-gray-300 bg-wf-white p-3">
      <h3 className="text-sm font-semibold text-wf-ink">Session</h3>
      <dl className="mt-2 space-y-1.5 font-mono text-[11px] text-wf-gray-700">
        <div>
          <dt className="font-sans font-semibold text-wf-ink">conversation_id</dt>
          <dd className="break-all">{session.conversationId}</dd>
        </div>
        <div>
          <dt className="font-sans font-semibold text-wf-ink">m2_session_id</dt>
          <dd className="break-all">{session.m2SessionId}</dd>
        </div>
        <div>
          <dt className="font-sans font-semibold text-wf-ink">cache_key</dt>
          <dd className="break-all">{session.cacheKey}</dd>
        </div>
      </dl>
    </div>
  );
}
