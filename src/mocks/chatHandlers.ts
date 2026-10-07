import { http, HttpResponse, delay } from 'msw';
import {
  createAgentViaMcp,
  createConfirmation,
} from '@/api/automationClient';
import type { ChatRequest, ChatResponse } from '@/api/types';
import { PAYDAY_REVIEW, SUBSCRIPTION_REVIEW } from './sampleData';

function sse(chunks: ChatResponse[]) {
  const body = chunks.map((c) => `data: ${JSON.stringify(c)}\n\n`).join('');
  return new HttpResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}

async function emitCreateAgent(
  sessionId: string,
  draftId: string,
): Promise<ChatResponse[]> {
  const review =
    draftId === SUBSCRIPTION_REVIEW.draftId
      ? SUBSCRIPTION_REVIEW
      : PAYDAY_REVIEW;

  try {
    await createConfirmation({
      draftId,
      templateId:
        draftId === SUBSCRIPTION_REVIEW.draftId
          ? 'subscription_price_guard'
          : 'payday_sweep',
    });
  } catch {
    // Standalone may not be up — continue with mock agent id
  }

  let agentId = `agt_${draftId.replace(/\D/g, '') || '77'}`;
  try {
    const created = await createAgentViaMcp({
      name: review.name,
      templateId:
        draftId === SUBSCRIPTION_REVIEW.draftId
          ? 'subscription_price_guard'
          : 'payday_sweep',
      mode: review.mode,
      effectText: review.effectText,
    });
    agentId = created.agentId;
  } catch {
    // offline / no service
  }

  const messageId = `m_${Date.now()}`;
  return [
    {
      sessionId,
      messageId,
      delta: `${review.name} is on.`,
      cards: [
        {
          type: 'agent_created',
          draftId,
          agentId,
          name: review.name,
          status: 'on',
        },
      ],
      done: false,
    },
    { sessionId, messageId, done: true },
  ];
}

export const chatHandlers = [
  http.post('/v1/chat/stream', async ({ request }) => {
    const body = (await request.json()) as ChatRequest;
    const sessionId = body.sessionId;
    const messageId = `m_${Date.now()}`;

    if (body.message.type === 'action') {
      if (body.message.action === 'decline_agent') {
        await delay(200);
        return sse([
          {
            sessionId,
            messageId,
            delta: 'No problem, nothing was set up.',
            done: false,
          },
          { sessionId, messageId, done: true },
        ]);
      }
      await delay(300);
      const chunks = await emitCreateAgent(sessionId, body.message.draftId);
      return sse(chunks);
    }

    const text = body.message.text.toLowerCase();
    await delay(250);

    if (text.includes('payday') || text.includes('savings')) {
      return sse([
        {
          sessionId,
          messageId,
          status: 'Checking bank policy and limits…',
          done: false,
        },
        {
          sessionId,
          messageId,
          status: null,
          delta:
            'I can set up an agent for that. Review it and tap Create to turn it on.',
          cards: [PAYDAY_REVIEW],
          done: false,
        },
        { sessionId, messageId, done: true },
      ]);
    }

    if (text.includes('subscription') || text.includes('streamflix')) {
      return sse([
        {
          sessionId,
          messageId,
          status: 'Checking bank policy and limits…',
          done: false,
        },
        {
          sessionId,
          messageId,
          status: null,
          delta:
            'I can set up a price guard. Review it and tap Create to turn it on.',
          cards: [SUBSCRIPTION_REVIEW],
          done: false,
        },
        { sessionId, messageId, done: true },
      ]);
    }

    return sse([
      {
        sessionId,
        messageId,
        delta:
          "I can help with personal agents — try asking to move extra cash to savings on payday, or guard a subscription price.",
        done: false,
      },
      { sessionId, messageId, done: true },
    ]);
  }),
];
