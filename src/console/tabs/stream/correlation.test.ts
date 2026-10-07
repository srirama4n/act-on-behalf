import { describe, expect, it } from 'vitest';
import type { BusEvent } from '@/bus/eventBus';
import {
  eventMatchesCorrelation,
  extractCorrelationTokens,
  filterEvents,
} from './correlation';

function event(partial: Partial<BusEvent> & Pick<BusEvent, 'payload'>): BusEvent {
  return {
    id: partial.id ?? 'e1',
    type: partial.type ?? 'chat.request',
    direction: partial.direction ?? 'request',
    timestamp: partial.timestamp ?? 1,
    summary: partial.summary ?? 'summary',
    correlationId: partial.correlationId,
    payload: partial.payload,
  };
}

describe('extractCorrelationTokens', () => {
  it('collects uniqueToken, replyTo, and conversation ids', () => {
    const tokens = extractCorrelationTokens(
      event({
        correlationId: 'corr-1',
        payload: {
          uniqueToken: 'corr-1',
          headers: {
            kafka_correlationId: 'corr-1',
            conversation_id: 'conv-A',
            chat_message_id: 'msg-1',
          },
          jsonString: {
            id: 'msg-1',
            replyTo: null,
            conversation: { id: 'conv-A' },
          },
        },
      }),
    );

    expect(tokens).toEqual(
      expect.arrayContaining(['corr-1', 'conv-A', 'msg-1']),
    );
  });

  it('matches related request/response via shared correlation', () => {
    const req = event({
      id: 'r1',
      correlationId: 'tok',
      payload: { uniqueToken: 'tok', jsonString: { id: 'm1', replyTo: null } },
    });
    const res = event({
      id: 'r2',
      type: 'chat.response',
      direction: 'response',
      correlationId: 'tok',
      payload: {
        uniqueToken: 'tok-resp',
        jsonString: {
          messages: [{ id: 'm2', replyTo: 'm1', conversation: { id: 'c1' } }],
        },
      },
    });

    expect(eventMatchesCorrelation(req, 'tok')).toBe(true);
    expect(eventMatchesCorrelation(res, 'tok')).toBe(true);
    expect(eventMatchesCorrelation(res, 'm1')).toBe(true);
    expect(eventMatchesCorrelation(req, 'nope')).toBe(false);
  });
});

describe('filterEvents', () => {
  it('filters by type and search text', () => {
    const items = [
      event({
        id: '1',
        type: 'chat.request',
        summary: 'INIT: sunrise',
        payload: {},
      }),
      event({
        id: '2',
        type: 'chat.response',
        summary: 'Hola',
        payload: { hello: true },
      }),
    ];

    expect(filterEvents(items, { typeFilter: 'chat.request', search: '' })).toHaveLength(
      1,
    );
    expect(
      filterEvents(items, { typeFilter: 'all', search: 'hola' }),
    ).toHaveLength(1);
  });
});
