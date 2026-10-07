import { v4 as uuidv4 } from 'uuid';
import {
  JSON_CLASS_REQUEST,
  JSON_CLASS_RESPONSE,
  type ChannelData,
  type ChatRequestBody,
  type ChatRequestEnvelope,
  type ChatResponseBody,
  type ChatResponseEnvelope,
  type CustomerContext,
  type FargoAction,
  type KafkaHeaders,
  type LangPref,
} from './chatService';

export type TimestampUnit = 'seconds' | 'milliseconds';

export interface SessionIds {
  conversationId: string;
  sessionId: string;
  m2SessionId: string;
  cacheKey: string;
}

export interface BuilderDefaults {
  language: LangPref;
  ecnId: string;
  applicationEnvironment: string;
  senderAppId: string;
  senderHostName: string;
  orchSenderHostName: string;
  appResolvedVersion: string;
  appInternalVersion: string;
  apiVersion: string;
  eventName: string;
  timestampUnit: TimestampUnit;
  customerContext: Omit<CustomerContext, 'timeStamp' | 'languagePreference'>;
  launchSourceName: string;
}

export const DEFAULT_BUILDER_DEFAULTS: BuilderDefaults = {
  language: 'en',
  ecnId: '000000000001',
  applicationEnvironment: 'rqa',
  senderAppId: 'cvams',
  senderHostName: 'demo-host-01',
  orchSenderHostName: 'demo-orch-01',
  appResolvedVersion: '2026030000',
  appInternalVersion: '2026030000',
  apiVersion: '1',
  eventName: 'kafka.dna.topic',
  timestampUnit: 'seconds',
  customerContext: {
    timeZone: 'GMT',
    currentPageId: 'ACCOUNT_SUMMARY_REACT',
    isNewSession: 'true',
    customerBranding: 'COB',
    featuresInsightsPilot: 'false',
    barkerPresent: 'false',
  },
  launchSourceName: 'NAV_ICON',
};

export function createSessionIds(): SessionIds {
  const conversationId = `${uuidv4()}_A`;
  const m2SessionId = uuidv4();
  return {
    conversationId,
    sessionId: conversationId,
    m2SessionId,
    cacheKey: `${m2SessionId}_${conversationId}`,
  };
}

export function emptyChannelData(
  overrides: Partial<ChannelData> = {},
): ChannelData {
  return {
    callToActionId: null,
    event: null,
    goldenUtterance: null,
    sessionParams: {},
    webhookParams: {},
    cookies: [],
    headers: [],
    parameters: [],
    custom: null,
    hint: null,
    navigationId: null,
    ...overrides,
  };
}

function nowTimestamp(unit: TimestampUnit): number {
  const ms = Date.now();
  return unit === 'seconds' ? Math.floor(ms / 1000) : ms;
}

function nowEventTimestampMs(): string {
  return String(Date.now());
}

export function buildKafkaHeaders(opts: {
  eventType: KafkaHeaders['event_type'];
  chatMessageId: string;
  uniqueToken: string;
  session: SessionIds;
  language: LangPref;
  defaults?: Partial<BuilderDefaults>;
}): KafkaHeaders {
  const d = { ...DEFAULT_BUILDER_DEFAULTS, ...opts.defaults };
  return {
    application_environment: d.applicationEnvironment,
    sender_app_id: d.senderAppId,
    sender_host_name: d.senderHostName,
    cache_key: opts.session.cacheKey,
    App_Resolved_Version: d.appResolvedVersion,
    session_id: opts.session.sessionId,
    chat_message_id: opts.chatMessageId,
    ecn_id: d.ecnId,
    App_Internal_Version: d.appInternalVersion,
    event_timestamp: nowEventTimestampMs(),
    api_version: d.apiVersion,
    Resolved_Lang_Pref_Code: opts.language,
    event_id: uuidv4(),
    event_type: opts.eventType,
    m2_session_id: opts.session.m2SessionId,
    conversation_id: opts.session.conversationId,
    Language_Preference: opts.language,
    kafka_correlationId: opts.uniqueToken,
    event_name: d.eventName,
    xa_id: null,
    'orch.senderHostName': d.orchSenderHostName,
  };
}

export interface BuildRequestOptions {
  session: SessionIds;
  language: LangPref;
  messageType: ChatRequestBody['messageType'];
  message: string;
  typedUtterance: boolean;
  channelData?: ChannelData;
  replyTo?: string | null;
  /** When set (e.g. from a FargoAction), reuse instead of generating a new id. */
  messageId?: string;
  isNewSession?: 'true' | 'false';
  customerContextOverrides?: Partial<CustomerContext>;
  launchSourceName?: string;
  defaults?: Partial<BuilderDefaults>;
}

export function buildChatRequest(
  opts: BuildRequestOptions,
): ChatRequestEnvelope {
  const d = { ...DEFAULT_BUILDER_DEFAULTS, ...opts.defaults };
  const id = opts.messageId ?? uuidv4();
  const uniqueToken = uuidv4();
  const language = opts.language;

  const body: ChatRequestBody = {
    version: '1.0',
    id,
    conversation: { id: opts.session.conversationId },
    replyTo: opts.replyTo ?? null,
    source: 'USER',
    timestamp: nowTimestamp(d.timestampUnit),
    typedUtterance: opts.typedUtterance,
    isPredicted: null,
    isAccountTile: null,
    voiceUtterance: null,
    userRequestTokenized: null,
    messageType: opts.messageType,
    message: opts.message,
    router: null,
    channelData: opts.channelData ?? emptyChannelData(),
    customerContext: {
      ...d.customerContext,
      ...opts.customerContextOverrides,
      timeStamp: nowEventTimestampMs(),
      languagePreference: language,
      isNewSession:
        opts.isNewSession ??
        opts.customerContextOverrides?.isNewSession ??
        d.customerContext.isNewSession,
    },
    launchSource: {
      launchSourceName: opts.launchSourceName ?? d.launchSourceName,
      additionalInfo: {},
    },
  };

  return {
    jsonClass: JSON_CLASS_REQUEST,
    uniqueToken,
    headers: buildKafkaHeaders({
      eventType: 'TOKENIZED_CHAT_SERVICE_REQUEST',
      chatMessageId: id,
      uniqueToken,
      session: opts.session,
      language,
      defaults: opts.defaults,
    }),
    jsonString: body,
  };
}

/** INIT / sunrise launch request. */
export function buildInitRequest(opts: {
  session: SessionIds;
  language: LangPref;
  launchSourceName?: string;
  customerContextOverrides?: Partial<CustomerContext>;
  defaults?: Partial<BuilderDefaults>;
}): ChatRequestEnvelope {
  return buildChatRequest({
    session: opts.session,
    language: opts.language,
    messageType: 'INIT',
    message: 'sunrise',
    typedUtterance: false,
    isNewSession: 'true',
    launchSourceName: opts.launchSourceName ?? 'NAV_ICON',
    customerContextOverrides: opts.customerContextOverrides,
    defaults: opts.defaults,
  });
}

/** Typed free-text user message. */
export function buildTextRequest(opts: {
  session: SessionIds;
  language: LangPref;
  message: string;
  replyTo?: string | null;
  defaults?: Partial<BuilderDefaults>;
}): ChatRequestEnvelope {
  return buildChatRequest({
    session: opts.session,
    language: opts.language,
    messageType: 'TEXT',
    message: opts.message,
    typedUtterance: true,
    isNewSession: 'false',
    replyTo: opts.replyTo ?? null,
    defaults: opts.defaults,
  });
}

/**
 * QRB / action-driven request: reuse action prebuilt id + replyTo;
 * typedUtterance false; message from goldenUtterance; channelData from button.
 */
export function buildRequestFromAction(opts: {
  session: SessionIds;
  language: LangPref;
  action: Pick<FargoAction, 'id' | 'replyTo' | 'messageType' | 'message'>;
  channelData: ChannelData;
  defaults?: Partial<BuilderDefaults>;
}): ChatRequestEnvelope {
  const golden =
    opts.channelData.goldenUtterance ??
    opts.action.message ??
    opts.channelData.title ??
    '';

  return buildChatRequest({
    session: opts.session,
    language: opts.language,
    messageType: opts.action.messageType,
    message: golden,
    typedUtterance: false,
    messageId: opts.action.id,
    replyTo: opts.action.replyTo,
    channelData: opts.channelData,
    isNewSession: 'false',
    defaults: opts.defaults,
  });
}

export function buildResponseEnvelope(opts: {
  session: SessionIds;
  language: LangPref;
  body: ChatResponseBody;
  /** Defaults to first system message id. */
  chatMessageId?: string;
  defaults?: Partial<BuilderDefaults>;
}): ChatResponseEnvelope {
  const uniqueToken = uuidv4();
  const chatMessageId =
    opts.chatMessageId ?? opts.body.messages[0]?.id ?? uuidv4();

  return {
    jsonClass: JSON_CLASS_RESPONSE,
    uniqueToken,
    headers: buildKafkaHeaders({
      eventType: 'TOKENIZED_CHAT_SERVICE_RESPONSE',
      chatMessageId,
      uniqueToken,
      session: opts.session,
      language: opts.language,
      defaults: opts.defaults,
    }),
    jsonString: opts.body,
  };
}
