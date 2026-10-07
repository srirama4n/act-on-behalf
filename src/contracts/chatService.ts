/** Fargo chat-service request/response contracts (SPEC §6). */

export type LangPref = 'es' | 'en';

export interface KafkaHeaders {
  application_environment: string;
  sender_app_id: string;
  sender_host_name: string;
  cache_key: string;
  App_Resolved_Version: string;
  session_id: string;
  chat_message_id: string;
  ecn_id: string;
  App_Internal_Version: string;
  event_timestamp: string;
  api_version: string;
  Resolved_Lang_Pref_Code: LangPref;
  event_id: string;
  event_type: 'TOKENIZED_CHAT_SERVICE_REQUEST' | 'TOKENIZED_CHAT_SERVICE_RESPONSE';
  m2_session_id: string;
  conversation_id: string;
  Language_Preference: LangPref;
  kafka_correlationId: string;
  event_name: string;
  xa_id: string | null;
  'orch.senderHostName': string;
}

export interface Envelope<T> {
  jsonClass: string;
  uniqueToken: string;
  headers: KafkaHeaders;
  jsonString: T;
}

export interface ChannelData {
  callToActionId: string | null;
  event: string | null;
  goldenUtterance: string | null;
  sessionParams: Record<string, unknown>;
  webhookParams: Record<string, unknown>;
  cookies: unknown[];
  headers: unknown[];
  parameters: unknown[];
  custom: { uiElementID?: string; [k: string]: unknown } | null;
  hint: string | null;
  navigationId: string | null;
  title?: string;
}

export interface CustomerContext {
  timeStamp: string;
  timeZone: string;
  currentPageId: string;
  isNewSession: 'true' | 'false';
  languagePreference: LangPref;
  customerBranding: string;
  featuresInsightsPilot: 'true' | 'false';
  barkerPresent: 'true' | 'false';
}

export interface ChatRequestBody {
  version: '1.0';
  id: string;
  conversation: { id: string };
  replyTo: string | null;
  source: 'USER';
  /** Sample uses epoch seconds — configurable via builders. */
  timestamp: number;
  typedUtterance: boolean;
  isPredicted: boolean | null;
  isAccountTile: boolean | null;
  voiceUtterance: boolean | null;
  userRequestTokenized: boolean | null;
  messageType: 'INIT' | 'TEXT' | 'APP_LINK' | string;
  message: string;
  router: string | null;
  channelData: ChannelData;
  customerContext: CustomerContext;
  launchSource: {
    launchSourceName: string;
    additionalInfo: Record<string, unknown>;
  };
}

export interface ChatConfig {
  keepAliveUrl: string;
  appLinkUrl: string;
  chatUrl: string;
  logOffUrl: string;
  chatResumeUrl: string;
  exitSamlUrl: string | null;
  fafUrl: string;
  homeButtonUrl: string;
  merchantSearch: string;
  insightsUrl: string | null;
  fafXapiUrl: string;
  chatXapiUrl: string;
  homeButtonXapiUrl: string;
  exitXapiUrl: string;
  keepAliveXapiUrl: string | null;
  xapiContextPath: string;
  disclosureMessage: string;
  apiOverride: unknown | null;
  keepAliveTimeout: number | null;
  richMessages: boolean;
  cookies: unknown[];
  headers: unknown[];
  integrations: unknown | null;
  userProfileUrl: string | null;
  userProfile: unknown | null;
  en: unknown | null;
  es: unknown | null;
  languageChange: unknown | null;
  newLanguagePrefCode: string | null;
}

export interface ChatResponseBody {
  version: '1.0';
  systemRespTokenized: boolean;
  nlpSessionStart: boolean;
  dirtyData: unknown | null;
  metadata: { reference: string | null };
  config: ChatConfig;
  agentInfo: unknown | null;
  messages: FargoMessage[];
}

export interface FargoAction {
  actionType: 'SUBMIT_AWAIT' | 'APP_LINK' | string;
  url: string;
  xapiEnabled: 'true' | null;
  feedback: 'WIDGET' | string;
  renderMode: 'INLINE' | string;
  transitionMode: string | null;
  transitionText: string | null;
  actionCompletedText: string | null;
  payload: { channelData: ChannelData };
  id: string;
  conversation: { id: string };
  replyTo: string;
  subSystem: string | null;
  source: 'USER';
  timestamp: number;
  messageType: 'TEXT' | 'APP_LINK';
  message: string | null;
  router: string | null;
  isAccountTile: boolean | null;
}

export interface QrbButton {
  type: 'SIMPLE';
  orientation: string | null;
  navigationInfo: unknown | null;
  alignment: string | null;
  additionalInfo: unknown | null;
  channelData: ChannelData & { title: string; custom: { uiElementID: string } };
  styleAttributes: unknown | null;
}

export type Disclosure = {
  type: 'PLAIN';
  disclosureType: string;
  text: string;
};

export type RichMessage =
  | {
      responseType: 'QRB_LIST';
      variation: string | null;
      actions: FargoAction[];
      data: { buttons: QrbButton[] };
    }
  | {
      responseType: 'SYSTEM_MESSAGE';
      variation: string | null;
      actions: FargoAction[];
      data: { disclosures: Disclosure[] };
    };

export interface FargoMessage {
  inputStatus: 'ENABLED' | 'DISABLED';
  generatedResponseType: string | null;
  inputFormat: 'FREE_TEXT' | string;
  inputValidation: unknown | null;
  displayKeyboard: unknown | null;
  messageFormat: 'ANNOTATED' | string;
  pageTitle: string;
  layer: string;
  custom: { responseID: string; gsdUpdated: string };
  navigationInfo: unknown | null;
  channelData: ChannelData | null;
  error: { errorCode: string; errorMessage: string };
  annotations: unknown[];
  systemMessages: unknown[];
  footnotes: unknown[];
  disclosures: unknown[];
  actions: FargoAction[];
  // TODO verify — sample lines 128–145 not fully captured
  richMessages: RichMessage[];
  form: unknown | null;
  animationSettings: unknown | null;
  banner: unknown[];
  id: string;
  conversation: { id: string };
  replyTo: string | null;
  subSystem: 'WEBHOOK' | string | null;
  source: 'SYSTEM';
  timestamp: number;
  messageType: string | null;
  message: string;
  router: string | null;
  isAccountTile: boolean | null;
  [k: string]: unknown;
}

export const JSON_CLASS_REQUEST =
  'com.wellsfargo.cva.schema.chatservice.v1.model.ChatServiceRequest';
export const JSON_CLASS_RESPONSE =
  'com.wellsfargo.cva.schema.chatservice.v1.model.ChatServiceResponse';

export type ChatRequestEnvelope = Envelope<ChatRequestBody>;
export type ChatResponseEnvelope = Envelope<ChatResponseBody>;
