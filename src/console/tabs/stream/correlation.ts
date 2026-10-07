import type { BusEvent } from '@/bus/eventBus';

/** Pull correlation tokens from a bus event payload for highlighting. */
export function extractCorrelationTokens(event: BusEvent): string[] {
  const tokens = new Set<string>();
  if (event.correlationId) tokens.add(event.correlationId);

  const payload = event.payload;
  if (!payload || typeof payload !== 'object') {
    return [...tokens];
  }

  const root = payload as Record<string, unknown>;

  if (typeof root.uniqueToken === 'string') tokens.add(root.uniqueToken);

  const headers = root.headers;
  if (headers && typeof headers === 'object') {
    const h = headers as Record<string, unknown>;
    if (typeof h.kafka_correlationId === 'string') {
      tokens.add(h.kafka_correlationId);
    }
    if (typeof h.conversation_id === 'string') tokens.add(h.conversation_id);
    if (typeof h.session_id === 'string') tokens.add(h.session_id);
    if (typeof h.chat_message_id === 'string') tokens.add(h.chat_message_id);
  }

  const jsonString = root.jsonString;
  if (jsonString && typeof jsonString === 'object') {
    const body = jsonString as Record<string, unknown>;
    if (typeof body.id === 'string') tokens.add(body.id);
    if (typeof body.replyTo === 'string') tokens.add(body.replyTo);

    const conv = body.conversation;
    if (conv && typeof conv === 'object') {
      const id = (conv as { id?: unknown }).id;
      if (typeof id === 'string') tokens.add(id);
    }

    const messages = body.messages;
    if (Array.isArray(messages)) {
      for (const msg of messages) {
        if (!msg || typeof msg !== 'object') continue;
        const m = msg as Record<string, unknown>;
        if (typeof m.id === 'string') tokens.add(m.id);
        if (typeof m.replyTo === 'string') tokens.add(m.replyTo);
        const mConv = m.conversation;
        if (mConv && typeof mConv === 'object') {
          const id = (mConv as { id?: unknown }).id;
          if (typeof id === 'string') tokens.add(id);
        }
      }
    }
  }

  return [...tokens].filter(Boolean);
}

export function eventMatchesCorrelation(
  event: BusEvent,
  token: string | null,
): boolean {
  if (!token) return false;
  return extractCorrelationTokens(event).includes(token);
}

export function filterEvents(
  items: BusEvent[],
  opts: {
    typeFilter: string | 'all';
    search: string;
  },
): BusEvent[] {
  const q = opts.search.trim().toLowerCase();
  return items.filter((item) => {
    if (opts.typeFilter !== 'all' && item.type !== opts.typeFilter) {
      return false;
    }
    if (!q) return true;
    const hay = [
      item.summary,
      item.type,
      item.direction,
      item.correlationId ?? '',
      JSON.stringify(item.payload),
    ]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}

export function formatEventTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  } as Intl.DateTimeFormatOptions);
}
