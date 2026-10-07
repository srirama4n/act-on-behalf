import { eventBus } from '@/bus/eventBus';
import type {
  ChatRequestEnvelope,
  ChatResponseEnvelope,
} from '@/contracts/chatService';
import { validateChatResponse } from '@/contracts/validators';

export function publishChatRequest(env: ChatRequestEnvelope): void {
  eventBus.publish({
    type: 'chat.request',
    direction: 'request',
    summary: `${env.jsonString.messageType}: ${env.jsonString.message}`,
    payload: env,
    correlationId: env.uniqueToken,
  });
}

export function publishChatResponse(
  request: ChatRequestEnvelope,
  response: ChatResponseEnvelope,
  started: number,
): ChatResponseEnvelope {
  const validation = validateChatResponse(response);
  const latencyMs = Date.now() - started;

  if (!validation.ok) {
    eventBus.publish({
      type: 'contract.violation',
      direction: 'response',
      summary: `Contract violation (${validation.violations.length})`,
      payload: { response, violations: validation.violations },
      correlationId: request.uniqueToken,
      latencyMs,
      violations: validation.violations,
    });
  }

  eventBus.publish({
    type: 'chat.response',
    direction: 'response',
    summary:
      response.jsonString.messages[0]?.message?.slice(0, 80) ?? 'response',
    payload: response,
    correlationId: request.uniqueToken,
    latencyMs,
    violations: validation.ok ? undefined : validation.violations,
  });

  return response;
}

export function publishTransportError(
  request: ChatRequestEnvelope,
  error: unknown,
  started: number,
): void {
  const message = error instanceof Error ? error.message : 'Transport error';
  eventBus.publish({
    type: 'contract.violation',
    direction: 'response',
    summary: `Transport error: ${message}`,
    payload: { error: message, requestId: request.jsonString.id },
    correlationId: request.uniqueToken,
    latencyMs: Date.now() - started,
    violations: [message],
  });
}
