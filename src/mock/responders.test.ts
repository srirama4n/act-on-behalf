import { describe, expect, it } from 'vitest';
import { createSessionIds, buildInitRequest, buildTextRequest } from '@/contracts/builders';
import { emptyChannelData } from '@/contracts/builders';
import { buildRequestFromAction } from '@/contracts/builders';
import { resolveMockResponse } from './responders';

describe('resolveMockResponse', () => {
  it('returns welcome QRB list for INIT/sunrise', () => {
    const session = createSessionIds();
    const request = buildInitRequest({ session, language: 'es' });
    const response = resolveMockResponse({
      request,
      session,
      language: 'es',
    });

    const msg = response.jsonString.messages[0];
    expect(msg.custom.responseID).toBe('welcome.returninguser');
    expect(msg.message).toContain('Hola, SamA');
    const qrb = msg.richMessages.find((r) => r.responseType === 'QRB_LIST');
    expect(qrb?.responseType).toBe('QRB_LIST');
    if (qrb?.responseType === 'QRB_LIST') {
      expect(qrb.data.buttons).toHaveLength(4);
      expect(qrb.data.buttons[0].channelData.custom.uiElementID).toBe(
        'qrb.WhatsMyBalance',
      );
    }
    expect(response.headers.conversation_id).toBe(session.conversationId);
    expect(msg.conversation.id).toBe(session.conversationId);
  });

  it('routes by uiElementID for QRB balance', () => {
    const session = createSessionIds();
    const request = buildRequestFromAction({
      session,
      language: 'en',
      action: {
        id: 'action-1',
        replyTo: 'sys-1',
        messageType: 'TEXT',
        message: null,
      },
      channelData: emptyChannelData({
        title: "What's my balance?",
        goldenUtterance: "What's my balance?",
        custom: { uiElementID: 'qrb.WhatsMyBalance' },
      }),
    });

    const response = resolveMockResponse({
      request,
      session,
      language: 'en',
    });
    expect(response.jsonString.messages[0].custom.responseID).toBe(
      'qrb.WhatsMyBalance',
    );
    expect(response.jsonString.messages[0].message).toMatch(/checking balance/i);
  });

  it('falls back to keyword match on typed text', () => {
    const session = createSessionIds();
    const request = buildTextRequest({
      session,
      language: 'es',
      message: 'quiero ver mi saldo',
    });
    const response = resolveMockResponse({
      request,
      session,
      language: 'es',
    });
    expect(response.jsonString.messages[0].custom.responseID).toBe(
      'qrb.WhatsMyBalance',
    );
  });
});
