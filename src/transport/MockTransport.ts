import type { SessionIds } from '@/contracts/builders';
import type {
  ChatRequestEnvelope,
  ChatResponseEnvelope,
  LangPref,
} from '@/contracts/chatService';
import {
  buildExitResponse,
  resolveMockResponse,
} from '@/mock/responders';
import type { ChatTransport } from './ChatTransport';
import {
  publishChatRequest,
  publishChatResponse,
} from './transportBus';

export interface MockTransportOptions {
  getSession: () => SessionIds;
  getLanguage: () => LangPref;
  getLatencyMs: () => number;
}

function delay(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export class MockTransport implements ChatTransport {
  constructor(private readonly opts: MockTransportOptions) {}

  async send(env: ChatRequestEnvelope): Promise<ChatResponseEnvelope> {
    const started = Date.now();
    const session = this.opts.getSession();
    const language = this.opts.getLanguage();

    publishChatRequest(env);
    await delay(this.opts.getLatencyMs());

    const isExit =
      env.jsonString.message === '/exit' ||
      env.jsonString.messageType === 'EXIT';

    const response = isExit
      ? buildExitResponse(session, language, env.jsonString.id)
      : resolveMockResponse({ request: env, session, language });

    return publishChatResponse(env, response, started);
  }
}
