import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ReviewCardView } from '@/components/cards/ReviewCardView';
import { useChatSession } from './useChatSession';

export function ChatScreen() {
  const {
    messages,
    sending,
    sendText,
    sendAction,
    retryLastError,
  } = useChatSession();
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = draft;
    setDraft('');
    sendText(text);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-wf-cream">
      <header className="shrink-0 border-b border-wf-gray-300 bg-wf-white px-4 py-3">
        <h1 className="text-base font-semibold text-wf-ink">Fargo</h1>
        <p className="text-[11px] text-wf-gray-700">Personal agents assistant</p>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {messages.length === 0 ? (
          <p className="rounded-2xl bg-wf-white p-4 text-sm text-wf-gray-700 shadow-sm">
            Try: &ldquo;Move anything over $5,000 to savings on payday&rdquo;
          </p>
        ) : null}

        {messages.map((m) => {
          if (m.role === 'user') {
            return (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-wf-red px-3 py-2 text-sm text-wf-white">
                  {m.text}
                </div>
              </div>
            );
          }

          return (
            <div key={m.id} className="flex justify-start">
              <div className="max-w-[92%] space-y-1">
                {m.status ? (
                  <span className="inline-block rounded-full bg-wf-white px-2.5 py-1 text-[11px] text-wf-gray-700 shadow-sm">
                    {m.status}
                  </span>
                ) : null}
                {(m.text || m.streaming) && (
                  <div className="rounded-2xl rounded-bl-md bg-wf-white px-3 py-2 text-sm text-wf-ink shadow-sm">
                    {m.text}
                    {m.streaming ? (
                      <span className="ml-1 inline-block h-2 w-2 animate-pulse rounded-full bg-wf-red" />
                    ) : null}
                  </div>
                )}
                {m.cards
                  .filter((c) => c.type === 'review_card')
                  .map((card) => {
                    if (card.type !== 'review_card') return null;
                    const st = m.cardState[card.draftId];
                    return (
                      <ReviewCardView
                        key={card.draftId}
                        card={card}
                        created={st?.created}
                        declined={st?.declined}
                        busy={st?.busy}
                        onCreate={() =>
                          sendAction('create_agent', card.draftId, m.id)
                        }
                        onDecline={() =>
                          sendAction('decline_agent', card.draftId, m.id)
                        }
                      />
                    );
                  })}
                {m.error ? (
                  <div className="rounded-xl border border-err/30 bg-white px-3 py-2 text-xs text-err">
                    {m.error.message}{' '}
                    <button
                      type="button"
                      className="font-semibold underline"
                      onClick={retryLastError}
                    >
                      Retry
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={onSubmit}
        className="flex shrink-0 gap-2 border-t border-wf-gray-300 bg-wf-white p-3"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message Fargo"
          disabled={sending}
          className="min-w-0 flex-1 rounded-full border border-wf-gray-300 px-4 py-2.5 text-sm outline-none focus:border-wf-red"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="rounded-full bg-wf-red px-4 py-2.5 text-sm font-semibold text-wf-white disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
