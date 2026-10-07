import { chatBaseUrl } from './config';
import type { ChatRequest, ChatResponse } from './types';

/**
 * Maps feature ChatRequest/ChatResponse onto the Chat Service stream endpoint.
 * UI code should only call streamChat — never Automation Service from chat.
 */
export async function streamChat(
  request: ChatRequest,
  onChunk: (chunk: ChatResponse) => void,
  signal?: AbortSignal,
): Promise<void> {
  const url = `${chatBaseUrl()}/v1/chat/stream`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'text/event-stream, application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(toServiceRequest(request)),
    signal,
  });

  if (!res.ok) {
    throw new Error(`Chat stream failed: HTTP ${res.status}`);
  }

  if (!res.body) {
    const json = (await res.json()) as ChatResponse | ChatResponse[];
    const chunks = Array.isArray(json) ? json : [json];
    for (const chunk of chunks) onChunk(fromServiceChunk(chunk));
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';
    for (const part of parts) {
      const dataLine = part
        .split('\n')
        .find((l) => l.startsWith('data:'));
      if (!dataLine) continue;
      const raw = dataLine.slice(5).trim();
      if (!raw || raw === '[DONE]') continue;
      const parsed = JSON.parse(raw) as ChatResponse;
      onChunk(fromServiceChunk(parsed));
    }
  }
}

/** Single place to adapt to a richer Chat Service envelope later. */
function toServiceRequest(request: ChatRequest): ChatRequest {
  return request;
}

function fromServiceChunk(chunk: ChatResponse): ChatResponse {
  return chunk;
}
