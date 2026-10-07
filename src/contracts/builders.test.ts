import { describe, expect, it } from 'vitest';
import {
  buildInitRequest,
  buildRequestFromAction,
  buildResponseEnvelope,
  buildTextRequest,
  createSessionIds,
  emptyChannelData,
} from './builders';
import { welcomeResponseByLang } from '@/fixtures';
import { validateChatResponse } from './validators';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('createSessionIds', () => {
  it('builds conversation_id with _A suffix and matching cache_key', () => {
    const session = createSessionIds();
    expect(session.conversationId).toMatch(/_A$/);
    expect(session.sessionId).toBe(session.conversationId);
    expect(session.m2SessionId).toMatch(UUID_RE);
    expect(session.cacheKey).toBe(
      `${session.m2SessionId}_${session.conversationId}`,
    );
  });
});

describe('buildInitRequest', () => {
  it('creates INIT/sunrise with language aligned across headers and context', () => {
    const session = createSessionIds();
    const env = buildInitRequest({ session, language: 'es' });

    expect(env.jsonString.messageType).toBe('INIT');
    expect(env.jsonString.message).toBe('sunrise');
    expect(env.jsonString.typedUtterance).toBe(false);
    expect(env.jsonString.launchSource.launchSourceName).toBe('NAV_ICON');
    expect(env.headers.chat_message_id).toBe(env.jsonString.id);
    expect(env.headers.kafka_correlationId).toBe(env.uniqueToken);
    expect(env.headers.event_type).toBe('TOKENIZED_CHAT_SERVICE_REQUEST');
    expect(env.headers.Language_Preference).toBe('es');
    expect(env.headers.Resolved_Lang_Pref_Code).toBe('es');
    expect(env.jsonString.customerContext.languagePreference).toBe('es');
    expect(env.headers.conversation_id).toBe(session.conversationId);
    expect(env.headers.session_id).toBe(session.sessionId);
    expect(env.headers.m2_session_id).toBe(session.m2SessionId);
    expect(env.headers.cache_key).toBe(session.cacheKey);
    expect(env.headers.ecn_id).toBe('000000000001');
  });

  it('mirrors EN language toggle into all language fields', () => {
    const env = buildInitRequest({
      session: createSessionIds(),
      language: 'en',
    });
    expect(env.headers.Language_Preference).toBe('en');
    expect(env.headers.Resolved_Lang_Pref_Code).toBe('en');
    expect(env.jsonString.customerContext.languagePreference).toBe('en');
  });

  it('issues fresh uniqueToken and event_id per request', () => {
    const session = createSessionIds();
    const a = buildInitRequest({ session, language: 'es' });
    const b = buildInitRequest({ session, language: 'es' });
    expect(a.uniqueToken).not.toBe(b.uniqueToken);
    expect(a.headers.event_id).not.toBe(b.headers.event_id);
    expect(a.jsonString.id).not.toBe(b.jsonString.id);
  });
});

describe('buildTextRequest', () => {
  it('sets typedUtterance true and messageType TEXT', () => {
    const env = buildTextRequest({
      session: createSessionIds(),
      language: 'en',
      message: 'hello',
      replyTo: 'sys-1',
    });
    expect(env.jsonString.typedUtterance).toBe(true);
    expect(env.jsonString.messageType).toBe('TEXT');
    expect(env.jsonString.message).toBe('hello');
    expect(env.jsonString.replyTo).toBe('sys-1');
    expect(env.jsonString.customerContext.isNewSession).toBe('false');
  });
});

describe('buildRequestFromAction', () => {
  it('reuses action id/replyTo and copies QRB channelData', () => {
    const session = createSessionIds();
    const channelData = emptyChannelData({
      title: '¿Cuál es mi saldo?',
      goldenUtterance: '¿Cuál es mi saldo?',
      custom: { uiElementID: 'qrb.WhatsMyBalance' },
    });
    const env = buildRequestFromAction({
      session,
      language: 'es',
      action: {
        id: 'prebuilt-action-id',
        replyTo: 'system-msg-id',
        messageType: 'TEXT',
        message: null,
      },
      channelData,
    });

    expect(env.jsonString.id).toBe('prebuilt-action-id');
    expect(env.headers.chat_message_id).toBe('prebuilt-action-id');
    expect(env.jsonString.replyTo).toBe('system-msg-id');
    expect(env.jsonString.typedUtterance).toBe(false);
    expect(env.jsonString.message).toBe('¿Cuál es mi saldo?');
    expect(env.jsonString.channelData.custom?.uiElementID).toBe(
      'qrb.WhatsMyBalance',
    );
  });
});

describe('buildResponseEnvelope + fixtures', () => {
  it('wraps a response body with matching correlation headers', () => {
    const session = createSessionIds();
    const fixture = welcomeResponseByLang.es;
    const env = buildResponseEnvelope({
      session,
      language: 'es',
      body: fixture.jsonString,
    });

    expect(env.headers.event_type).toBe('TOKENIZED_CHAT_SERVICE_RESPONSE');
    expect(env.headers.kafka_correlationId).toBe(env.uniqueToken);
    expect(env.headers.chat_message_id).toBe(fixture.jsonString.messages[0].id);
    expect(env.headers.Language_Preference).toBe('es');
  });

  it('validates welcome fixtures against the response contract', () => {
    for (const lang of ['es', 'en'] as const) {
      const result = validateChatResponse(welcomeResponseByLang[lang]);
      expect(result.ok, result.ok ? '' : result.violations.join('; ')).toBe(
        true,
      );
    }
  });
});
