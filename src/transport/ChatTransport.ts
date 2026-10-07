import type {
  ChatRequestEnvelope,
  ChatResponseEnvelope,
} from '@/contracts/chatService';

export interface ChatTransport {
  send(env: ChatRequestEnvelope): Promise<ChatResponseEnvelope>;
}
