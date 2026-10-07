import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  buildChatRequest,
  buildInitRequest,
  buildRequestFromAction,
  buildTextRequest,
} from '@/contracts/builders';
import type {
  ChannelData,
  ChatRequestEnvelope,
  ChatResponseEnvelope,
  FargoMessage,
  QrbButton,
} from '@/contracts/chatService';
import type { BuilderDefaults } from '@/contracts/builders';
import { getTransport } from '@/transport/createTransport';
import { useSessionStore } from './session';
import { useSettingsStore } from './settings';

function sessionRequestOpts(): {
  session: ReturnType<typeof useSessionStore.getState>['session'];
  language: ReturnType<typeof useSettingsStore.getState>['language'];
  launchSourceName: string;
  defaults: Partial<BuilderDefaults>;
} {
  const { session, customerContext, launchSourceName } =
    useSessionStore.getState();
  const { language } = useSettingsStore.getState();
  return {
    session,
    language,
    launchSourceName,
    defaults: {
      customerContext,
      launchSourceName,
    },
  };
}

export type ChatItem =
  | {
      kind: 'user';
      id: string;
      text: string;
      typedUtterance: boolean;
    }
  | {
      kind: 'assistant';
      id: string;
      message: FargoMessage;
      agentInfo: unknown | null;
      responseId: string;
    }
  | {
      kind: 'error';
      id: string;
      errorCode: string;
      errorMessage: string;
      retryRequest: ChatRequestEnvelope | null;
    };

interface ChatState {
  items: ChatItem[];
  awaiting: boolean;
  toast: string | null;
  disclosureOpen: boolean;
  lastDisclosure: string | null;
  lastRequest: ChatRequestEnvelope | null;
  initialized: boolean;
  clearToast: () => void;
  setDisclosureOpen: (open: boolean) => void;
  resetChat: () => void;
  sendInit: () => Promise<void>;
  sendText: (text: string) => Promise<void>;
  sendQrb: (button: QrbButton, systemMessageId: string) => Promise<void>;
  sendExit: () => Promise<void>;
  retry: (itemId: string) => Promise<void>;
  restartWithLanguage: () => Promise<void>;
}

function latestAssistant(items: ChatItem[]): FargoMessage | null {
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    if (item.kind === 'assistant') return item.message;
  }
  return null;
}

function extractDisclosure(msg: FargoMessage): string | null {
  for (const rich of msg.richMessages) {
    if (rich.responseType === 'SYSTEM_MESSAGE') {
      const text = rich.data.disclosures.map((d) => d.text).join('\n\n');
      if (text) return text;
    }
  }
  return null;
}

async function dispatch(
  request: ChatRequestEnvelope,
  set: (partial: Partial<ChatState> | ((s: ChatState) => Partial<ChatState>)) => void,
  get: () => ChatState,
): Promise<void> {
  set({ awaiting: true, lastRequest: request });

  const userItem: ChatItem = {
    kind: 'user',
    id: request.jsonString.id,
    text: request.jsonString.message,
    typedUtterance: request.jsonString.typedUtterance,
  };

  // INIT is system-driven — still show nothing for sunrise, or show lightly
  if (request.jsonString.messageType !== 'INIT') {
    set((s) => ({ items: [...s.items, userItem] }));
  }

  try {
    const response = await getTransport().send(request);
    applyResponse(response, set, get);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Transport error';
    set((s) => ({
      awaiting: false,
      items: [
        ...s.items,
        {
          kind: 'error',
          id: `${request.jsonString.id}-err`,
          errorCode: 'TRANSPORT',
          errorMessage: message,
          retryRequest: request,
        },
      ],
    }));
  }
}

function applyResponse(
  response: ChatResponseEnvelope,
  set: (partial: Partial<ChatState> | ((s: ChatState) => Partial<ChatState>)) => void,
  get: () => ChatState,
): void {
  const additions: ChatItem[] = [];
  let disclosure: string | null = null;
  const retryRequest = get().lastRequest;

  for (const message of response.jsonString.messages) {
    const errCode = message.error?.errorCode ?? '';
    if (errCode) {
      additions.push({
        kind: 'error',
        id: message.id,
        errorCode: errCode,
        errorMessage: message.error.errorMessage || errCode,
        retryRequest,
      });
    } else {
      additions.push({
        kind: 'assistant',
        id: message.id,
        message,
        agentInfo: response.jsonString.agentInfo,
        responseId: response.uniqueToken,
      });
      disclosure = extractDisclosure(message) ?? disclosure;
    }
  }

  set((s) => ({
    awaiting: false,
    initialized: true,
    lastDisclosure: disclosure ?? s.lastDisclosure,
    items: [...s.items, ...additions],
  }));
}

export const useChatStore = create<ChatState>((set, get) => ({
  items: [],
  awaiting: false,
  toast: null,
  disclosureOpen: false,
  lastDisclosure: null,
  lastRequest: null,
  initialized: false,

  clearToast: () => set({ toast: null }),
  setDisclosureOpen: (disclosureOpen) => set({ disclosureOpen }),

  resetChat: () =>
    set({
      items: [],
      awaiting: false,
      toast: null,
      disclosureOpen: false,
      lastDisclosure: null,
      lastRequest: null,
      initialized: false,
    }),

  sendInit: async () => {
    if (get().awaiting || get().initialized) return;
    const opts = sessionRequestOpts();
    const request = buildInitRequest({
      session: opts.session,
      language: opts.language,
      launchSourceName: opts.launchSourceName,
      defaults: opts.defaults,
    });
    await dispatch(request, set, get);
  },

  sendText: async (text) => {
    const trimmed = text.trim();
    if (!trimmed || get().awaiting) return;
    const opts = sessionRequestOpts();
    const last = latestAssistant(get().items);
    const request = buildTextRequest({
      session: opts.session,
      language: opts.language,
      message: trimmed,
      replyTo: last?.id ?? null,
      defaults: opts.defaults,
    });
    await dispatch(request, set, get);
  },

  sendQrb: async (button, systemMessageId) => {
    if (get().awaiting) return;
    const opts = sessionRequestOpts();
    const channelData = { ...button.channelData } as ChannelData;
    const last = latestAssistant(get().items);
    const submit = last?.actions.find((a) => a.actionType === 'SUBMIT_AWAIT');

    const request = buildRequestFromAction({
      session: opts.session,
      language: opts.language,
      action: {
        id: submit?.id ?? uuidv4(),
        replyTo: submit?.replyTo ?? systemMessageId,
        messageType: 'TEXT',
        message: channelData.goldenUtterance,
      },
      channelData,
      defaults: opts.defaults,
    });
    await dispatch(request, set, get);
  },

  sendExit: async () => {
    if (get().awaiting) return;
    const opts = sessionRequestOpts();
    const last = latestAssistant(get().items);
    const request = buildChatRequest({
      session: opts.session,
      language: opts.language,
      messageType: 'TEXT',
      message: '/exit',
      typedUtterance: true,
      isNewSession: 'false',
      replyTo: last?.id ?? null,
      launchSourceName: opts.launchSourceName,
      defaults: opts.defaults,
    });
    await dispatch(request, set, get);
  },

  retry: async (itemId) => {
    const item = get().items.find((i) => i.id === itemId);
    const payload =
      item?.kind === 'error' ? item.retryRequest : get().lastRequest;
    if (!payload) return;
    set((s) => ({
      items: s.items.filter((i) => i.id !== itemId),
    }));
    await dispatch(payload, set, get);
  },

  restartWithLanguage: async () => {
    useSessionStore.getState().startNewSession();
    get().resetChat();
    await get().sendInit();
  },
}));

export function selectComposerEnabled(items: ChatItem[]): boolean {
  const last = latestAssistant(items);
  if (!last) return true;
  return last.inputStatus !== 'DISABLED';
}

export function selectActiveQrb(items: ChatItem[]): {
  buttons: QrbButton[];
  systemMessageId: string;
} | null {
  const last = latestAssistant(items);
  if (!last) return null;
  const qrb = last.richMessages.find((r) => r.responseType === 'QRB_LIST');
  if (!qrb || qrb.responseType !== 'QRB_LIST') return null;
  if (!qrb.data.buttons.length) return null;
  return { buttons: qrb.data.buttons, systemMessageId: last.id };
}
