import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSessionIds, buildInitRequest } from '@/contracts/builders';
import { eventBus } from '@/bus/eventBus';
import { welcomeResponseByLang } from '@/fixtures';
import { DEFAULT_XAPI_CONTEXT_PATH, HttpTransport } from './HttpTransport';
import { resolveTransportMode } from './createTransport';

describe('resolveTransportMode', () => {
  it('prefers settings over env', () => {
    expect(resolveTransportMode('mock', 'http')).toBe('mock');
    expect(resolveTransportMode('http', 'mock')).toBe('http');
  });

  it('falls back to env when settings omitted', () => {
    expect(resolveTransportMode(undefined, 'http')).toBe('http');
    expect(resolveTransportMode(undefined, 'mock')).toBe('mock');
    expect(resolveTransportMode(undefined, undefined)).toBe('mock');
  });
});

describe('HttpTransport', () => {
  beforeEach(() => {
    eventBus.clear();
  });

  it('builds the contract chat URL without embedding tokens', () => {
    const transport = new HttpTransport({
      getApiBase: () => 'https://api.example.invalid/',
    });
    expect(transport.buildUrl()).toBe(
      `https://api.example.invalid${DEFAULT_XAPI_CONTEXT_PATH}/v1/chat`,
    );
  });

  it('POSTs the envelope and publishes request/response on the bus', async () => {
    const request = buildInitRequest({
      session: createSessionIds(),
      language: 'es',
    });
    const fixture = structuredClone(welcomeResponseByLang.es);
    fixture.uniqueToken = request.uniqueToken;
    fixture.headers.kafka_correlationId = request.uniqueToken;

    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toContain('/xapi/virtual-assistant/chatbot/v1/chat');
      expect(init?.method).toBe('POST');
      const headers = new Headers(init?.headers);
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.has('Authorization')).toBe(false);
      expect(JSON.parse(String(init?.body)).uniqueToken).toBe(request.uniqueToken);
      return new Response(JSON.stringify(fixture), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const transport = new HttpTransport({
      getApiBase: () => 'https://api.example.invalid',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const response = await transport.send(request);
    expect(response.jsonString.messages[0].custom.responseID).toBe(
      'welcome.returninguser',
    );
    expect(fetchImpl).toHaveBeenCalledOnce();

    const history = eventBus.getHistory();
    expect(history.some((e) => e.type === 'chat.request')).toBe(true);
    expect(history.some((e) => e.type === 'chat.response')).toBe(true);
  });

  it('throws and logs when API base is missing', async () => {
    const transport = new HttpTransport({ getApiBase: () => '' });
    const request = buildInitRequest({
      session: createSessionIds(),
      language: 'en',
    });
    await expect(transport.send(request)).rejects.toThrow(/API base URL/i);
    expect(
      eventBus.getHistory().some((e) => e.type === 'contract.violation'),
    ).toBe(true);
  });

  it('surfaces non-OK HTTP status', async () => {
    const transport = new HttpTransport({
      getApiBase: () => 'https://api.example.invalid',
      fetchImpl: vi.fn(async () => new Response('nope', { status: 502 })) as unknown as typeof fetch,
    });
    const request = buildInitRequest({
      session: createSessionIds(),
      language: 'en',
    });
    await expect(transport.send(request)).rejects.toThrow(/HTTP 502/);
  });
});
