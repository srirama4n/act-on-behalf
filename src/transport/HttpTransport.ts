import type {
  ChatRequestEnvelope,
  ChatResponseEnvelope,
} from '@/contracts/chatService';
import type { ChatTransport } from './ChatTransport';
import {
  publishChatRequest,
  publishChatResponse,
  publishTransportError,
} from './transportBus';

/** Default xapi path from the Fargo response contract config. */
export const DEFAULT_XAPI_CONTEXT_PATH = '/xapi/virtual-assistant/chatbot';

export interface HttpTransportOptions {
  getApiBase: () => string;
  getXapiContextPath?: () => string;
  /** Injected for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

/**
 * POST {apiBase}{xapiContextPath}/v1/chat
 * Never attaches auth tokens — callers must rely on the environment / gateway.
 */
export class HttpTransport implements ChatTransport {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly opts: HttpTransportOptions) {
    this.fetchImpl = opts.fetchImpl ?? fetch.bind(globalThis);
  }

  buildUrl(): string {
    const base = this.opts.getApiBase().replace(/\/+$/, '');
    if (!base) {
      throw new Error(
        'HTTP transport requires an API base URL (Settings or VITE_API_BASE).',
      );
    }
    const path = (
      this.opts.getXapiContextPath?.() ?? DEFAULT_XAPI_CONTEXT_PATH
    ).replace(/\/+$/, '');
    return `${base}${path}/v1/chat`;
  }

  async send(env: ChatRequestEnvelope): Promise<ChatResponseEnvelope> {
    const started = Date.now();
    publishChatRequest(env);

    try {
      const url = this.buildUrl();
      const response = await this.fetchImpl(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(env),
      });

      if (!response.ok) {
        const bodyText = await safeReadText(response);
        throw new Error(
          `HTTP ${response.status} ${response.statusText}${
            bodyText ? `: ${bodyText.slice(0, 200)}` : ''
          }`,
        );
      }

      const data = (await response.json()) as ChatResponseEnvelope;
      return publishChatResponse(env, data, started);
    } catch (error) {
      publishTransportError(env, error, started);
      throw error;
    }
  }
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '';
  }
}
