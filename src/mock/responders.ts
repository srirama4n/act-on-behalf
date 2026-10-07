import { v4 as uuidv4 } from 'uuid';
import type { SessionIds } from '@/contracts/builders';
import { buildResponseEnvelope } from '@/contracts/builders';
import type {
  ChatRequestEnvelope,
  ChatResponseBody,
  ChatResponseEnvelope,
  FargoMessage,
  LangPref,
} from '@/contracts/chatService';
import {
  eventResponseByKey,
  qrbResponseById,
  type QrbKey,
  welcomeResponseByLang,
} from '@/fixtures';

const QRB_IDS = new Set<string>(Object.keys(qrbResponseById));

function isQrbKey(id: string): id is QrbKey {
  return QRB_IDS.has(id);
}

/** Deep-clone fixture body and stamp fresh message / action / conversation ids. */
export function stampResponseBody(
  template: ChatResponseBody,
  session: SessionIds,
  replyTo: string | null,
): ChatResponseBody {
  const body = structuredClone(template);
  for (const msg of body.messages) {
    const newId = uuidv4();
    const oldId = msg.id;
    msg.id = newId;
    msg.conversation = { id: session.conversationId };
    msg.replyTo = replyTo;
    // Demo UI does not surface APP_LINK actions
    msg.actions = (msg.actions ?? []).filter((a) => a.actionType !== 'APP_LINK');
    for (const action of msg.actions) {
      action.id = uuidv4();
      action.replyTo = newId;
      action.conversation = { id: session.conversationId };
    }
    for (const rich of msg.richMessages) {
      for (const action of rich.actions ?? []) {
        action.id = uuidv4();
        action.replyTo = newId;
        action.conversation = { id: session.conversationId };
      }
    }
    // silence unused in case of future mapping
    void oldId;
  }
  return body;
}

function keywordFallback(
  message: string,
  lang: LangPref,
): ChatResponseEnvelope | null {
  const lower = message.toLowerCase();
  if (
    lower.includes('saldo') ||
    lower.includes('balance') ||
    lower.includes('balance')
  ) {
    return qrbResponseById['qrb.WhatsMyBalance'][lang];
  }
  if (lower.includes('viaje') || lower.includes('travel')) {
    return qrbResponseById['qrb.ShareMyTravelPlans'][lang];
  }
  if (lower.includes('gasto') || lower.includes('spending')) {
    return qrbResponseById['qrb.HowsMySpending'][lang];
  }
  if (
    lower.includes('puede hacer') ||
    lower.includes('what fargo') ||
    lower.includes('capabilities')
  ) {
    return qrbResponseById['qrb.ShowMeWhatFargoCanDo'][lang];
  }
  if (lower.includes('error') || lower.includes('/error')) {
    return eventResponseByKey.Error[lang];
  }
  if (lower === '/exit' || lower.includes('exit')) {
    return null;
  }
  return null;
}

function genericTextBody(lang: LangPref, echo: string): ChatResponseBody {
  const template = structuredClone(
    qrbResponseById['qrb.ShowMeWhatFargoCanDo'][lang].jsonString,
  );
  const msg = template.messages[0] as FargoMessage;
  msg.custom = {
    responseID: 'text.generic',
    gsdUpdated: 'false',
  };
  msg.message =
    lang === 'es'
      ? `Entendido: "${echo}". ¿En qué más puedo ayudarle?`
      : `Got it: "${echo}". What else can I help with?`;
  msg.richMessages = [];
  return template;
}

export interface ResolveResponseOptions {
  request: ChatRequestEnvelope;
  session: SessionIds;
  language: LangPref;
}

/**
 * Pick a fixture-backed response by messageType, uiElementID, or keyword.
 * Returns a fresh envelope stamped to the active session.
 */
export function resolveMockResponse(
  opts: ResolveResponseOptions,
): ChatResponseEnvelope {
  const { request, session, language } = opts;
  const body = request.jsonString;
  const uiElementID = body.channelData.custom?.uiElementID;
  const replyTo = body.id;

  let template: ChatResponseEnvelope;

  if (body.messageType === 'INIT' || body.message === 'sunrise') {
    template = welcomeResponseByLang[language];
  } else if (typeof uiElementID === 'string' && isQrbKey(uiElementID)) {
    template = qrbResponseById[uiElementID][language];
  } else {
    const byKeyword = keywordFallback(body.message, language);
    if (byKeyword) {
      template = byKeyword;
    } else {
      const stamped = stampResponseBody(
        genericTextBody(language, body.message),
        session,
        replyTo,
      );
      return buildResponseEnvelope({
        session,
        language,
        body: stamped,
      });
    }
  }

  const stamped = stampResponseBody(template.jsonString, session, replyTo);
  return buildResponseEnvelope({
    session,
    language,
    body: stamped,
  });
}

/** Exit / close flow — input disabled, short goodbye. */
export function buildExitResponse(
  session: SessionIds,
  language: LangPref,
  replyTo: string | null,
): ChatResponseEnvelope {
  const body = stampResponseBody(
    structuredClone(welcomeResponseByLang[language].jsonString),
    session,
    replyTo,
  );
  const msg = body.messages[0];
  msg.inputStatus = 'DISABLED';
  msg.richMessages = [];
  msg.actions = msg.actions.filter((a) => a.actionType !== 'APP_LINK');
  msg.message =
    language === 'es'
      ? 'Hasta luego. Puede volver a abrir Fargo cuando quiera.'
      : 'Goodbye. You can reopen Fargo anytime.';
  msg.custom = { responseID: 'exit.goodbye', gsdUpdated: 'false' };
  return buildResponseEnvelope({ session, language, body });
}
