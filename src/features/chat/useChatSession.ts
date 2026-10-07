import { useCallback, useRef, useState } from 'react';
import { streamChat } from '@/api/chatService';
import type {
  AgentCreatedCard,
  ChatCard,
  ChatRequest,
  ChatResponse,
  ReviewCard,
} from '@/api/types';

export type UiMessage =
  | { id: string; role: 'user'; text: string }
  | {
      id: string;
      role: 'assistant';
      text: string;
      status?: string | null;
      cards: ChatCard[];
      error?: { code: string; message: string };
      streaming: boolean;
      cardState: Record<
        string,
        { created?: AgentCreatedCard; declined?: boolean; busy?: boolean }
      >;
    };

function newSessionId() {
  return `s_${Math.random().toString(36).slice(2, 10)}`;
}

export function useChatSession() {
  const sessionIdRef = useRef(newSessionId());
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [sending, setSending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const applyChunk = useCallback((chunk: ChatResponse) => {
    setMessages((prev) => {
      let next = [...prev];
      const idx = next.findIndex(
        (m) => m.role === 'assistant' && m.id === chunk.messageId,
      );

      if (idx === -1) {
        next.push({
          id: chunk.messageId,
          role: 'assistant',
          text: chunk.delta ?? '',
          status: chunk.status,
          cards: (chunk.cards ?? []).filter((c) => c.type !== 'agent_created'),
          error: chunk.error,
          streaming: !chunk.done,
          cardState: {},
        });
      } else {
        const cur = next[idx];
        if (cur.role !== 'assistant') return prev;
        const mergedCards = [...cur.cards];
        for (const c of chunk.cards ?? []) {
          if (c.type === 'review_card') mergedCards.push(c);
        }
        next[idx] = {
          ...cur,
          text: cur.text + (chunk.delta ?? ''),
          status: chunk.status === undefined ? cur.status : chunk.status,
          cards: mergedCards,
          error: chunk.error ?? cur.error,
          streaming: !chunk.done,
        };
      }

      // Resolve review cards by draftId on any prior assistant bubble
      const created = (chunk.cards ?? []).filter(
        (c): c is AgentCreatedCard => c.type === 'agent_created',
      );
      if (created.length > 0 || chunk.error) {
        next = next.map((m) => {
          if (m.role !== 'assistant') return m;
          let cardState = m.cardState;
          let changed = false;
          for (const c of created) {
            if (
              m.cards.some(
                (x) => x.type === 'review_card' && x.draftId === c.draftId,
              ) ||
              cardState[c.draftId]?.busy
            ) {
              cardState = {
                ...cardState,
                [c.draftId]: {
                  ...cardState[c.draftId],
                  created: c,
                  busy: false,
                },
              };
              changed = true;
            }
          }
          if (chunk.error) {
            for (const [draftId, st] of Object.entries(cardState)) {
              if (st.busy) {
                cardState = {
                  ...cardState,
                  [draftId]: { ...st, busy: false },
                };
                changed = true;
              }
            }
          }
          return changed ? { ...m, cardState } : m;
        });
      }

      return next;
    });
  }, []);

  const send = useCallback(
    async (request: ChatRequest, userBubble?: string) => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setSending(true);

      if (userBubble) {
        setMessages((prev) => [
          ...prev,
          {
            id: `u_${Date.now()}`,
            role: 'user',
            text: userBubble,
          },
        ]);
      }

      try {
        await streamChat(request, applyChunk, ac.signal);
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            role: 'assistant',
            text: '',
            cards: [],
            streaming: false,
            cardState: {},
            error: {
              code: 'stream_failed',
              message: (e as Error).message || 'Something went wrong',
            },
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [applyChunk],
  );

  const sendText = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      void send(
        {
          sessionId: sessionIdRef.current,
          message: { type: 'text', text: trimmed },
        },
        trimmed,
      );
    },
    [send],
  );

  const sendAction = useCallback(
    (
      action: 'create_agent' | 'decline_agent',
      draftId: string,
      messageId: string,
    ) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.role !== 'assistant' || m.id !== messageId) return m;
          return {
            ...m,
            cardState: {
              ...m.cardState,
              [draftId]: {
                ...m.cardState[draftId],
                busy: action === 'create_agent',
                declined: action === 'decline_agent' ? true : m.cardState[draftId]?.declined,
              },
            },
          };
        }),
      );

      void send(
        {
          sessionId: sessionIdRef.current,
          message: { type: 'action', action, draftId },
        },
        action === 'create_agent' ? 'Create' : 'Not now',
      ).then(() => {
        if (action === 'decline_agent') return;
        // on error, re-enable — check last assistant for error matching draft
        setMessages((prev) => {
          const last = [...prev].reverse().find((m) => m.role === 'assistant');
          if (
            last?.role === 'assistant' &&
            last.error &&
            !last.cardState[draftId]?.created
          ) {
            return prev.map((m) => {
              if (m.role !== 'assistant' || m.id !== messageId) return m;
              return {
                ...m,
                cardState: {
                  ...m.cardState,
                  [draftId]: { ...m.cardState[draftId], busy: false },
                },
              };
            });
          }
          return prev;
        });
      });
    },
    [send],
  );

  const retryLastError = useCallback(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser?.role === 'user') sendText(lastUser.text);
  }, [messages, sendText]);

  return {
    messages,
    sending,
    sendText,
    sendAction,
    retryLastError,
    reviewCardsOn: (m: UiMessage): ReviewCard[] =>
      m.role === 'assistant'
        ? m.cards.filter((c): c is ReviewCard => c.type === 'review_card')
        : [],
  };
}
