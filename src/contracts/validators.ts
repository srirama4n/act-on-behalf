import { z } from 'zod';
import type { ChatResponseBody, ChatResponseEnvelope } from './chatService';

const langPref = z.enum(['es', 'en']);

const kafkaHeadersSchema = z
  .object({
    application_environment: z.string(),
    sender_app_id: z.string(),
    sender_host_name: z.string(),
    cache_key: z.string(),
    App_Resolved_Version: z.string(),
    session_id: z.string(),
    chat_message_id: z.string(),
    ecn_id: z.string(),
    App_Internal_Version: z.string(),
    event_timestamp: z.string(),
    api_version: z.string(),
    Resolved_Lang_Pref_Code: langPref,
    event_id: z.string(),
    event_type: z.enum([
      'TOKENIZED_CHAT_SERVICE_REQUEST',
      'TOKENIZED_CHAT_SERVICE_RESPONSE',
    ]),
    m2_session_id: z.string(),
    conversation_id: z.string(),
    Language_Preference: langPref,
    kafka_correlationId: z.string(),
    event_name: z.string(),
    xa_id: z.string().nullable(),
    'orch.senderHostName': z.string(),
  })
  .passthrough();

const channelDataSchema = z
  .object({
    callToActionId: z.string().nullable().optional(),
    event: z.string().nullable().optional(),
    goldenUtterance: z.string().nullable().optional(),
    sessionParams: z.record(z.string(), z.unknown()).optional(),
    webhookParams: z.record(z.string(), z.unknown()).optional(),
    cookies: z.array(z.unknown()).optional(),
    headers: z.array(z.unknown()).optional(),
    parameters: z.array(z.unknown()).optional(),
    custom: z.record(z.string(), z.unknown()).nullable().optional(),
    hint: z.string().nullable().optional(),
    navigationId: z.string().nullable().optional(),
    title: z.string().optional(),
  })
  .passthrough();

const fargoActionSchema = z
  .object({
    actionType: z.string(),
    url: z.string(),
    id: z.string(),
    conversation: z.object({ id: z.string() }),
    replyTo: z.string(),
    source: z.literal('USER'),
    timestamp: z.number(),
    messageType: z.string(),
    payload: z.object({ channelData: channelDataSchema }).passthrough(),
  })
  .passthrough();

const richMessageSchema = z
  .object({
    responseType: z.string(),
    variation: z.unknown().nullable().optional(),
    actions: z.array(z.unknown()).optional(),
    data: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

const fargoMessageSchema = z
  .object({
    inputStatus: z.enum(['ENABLED', 'DISABLED']),
    messageFormat: z.string(),
    pageTitle: z.string(),
    layer: z.string(),
    custom: z
      .object({
        responseID: z.string(),
        gsdUpdated: z.string(),
      })
      .passthrough(),
    error: z.object({
      errorCode: z.string(),
      errorMessage: z.string(),
    }),
    actions: z.array(fargoActionSchema),
    richMessages: z.array(richMessageSchema),
    id: z.string(),
    conversation: z.object({ id: z.string() }),
    source: z.literal('SYSTEM'),
    timestamp: z.number(),
    message: z.string(),
  })
  .passthrough();

const chatResponseBodySchema = z
  .object({
    version: z.literal('1.0'),
    systemRespTokenized: z.boolean(),
    nlpSessionStart: z.boolean(),
    metadata: z.object({ reference: z.string().nullable() }).passthrough(),
    config: z
      .object({
        xapiContextPath: z.string(),
        disclosureMessage: z.string(),
        chatUrl: z.string(),
      })
      .passthrough(),
    agentInfo: z.unknown().nullable(),
    messages: z.array(fargoMessageSchema).min(1),
  })
  .passthrough();

export const chatResponseEnvelopeSchema = z
  .object({
    jsonClass: z.string(),
    uniqueToken: z.string(),
    headers: kafkaHeadersSchema,
    jsonString: chatResponseBodySchema,
  })
  .passthrough()
  .superRefine((env, ctx) => {
    if (env.uniqueToken !== env.headers.kafka_correlationId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'uniqueToken must equal headers.kafka_correlationId',
        path: ['uniqueToken'],
      });
    }
    const firstMsg = env.jsonString.messages[0];
    if (firstMsg && env.headers.chat_message_id !== firstMsg.id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'headers.chat_message_id should match first message id',
        path: ['headers', 'chat_message_id'],
      });
    }
  });

export type ValidationResult =
  | { ok: true; data: ChatResponseEnvelope }
  | { ok: false; violations: string[] };

/** Runtime validation — unknown fields allowed; missing required fields surface as violations. */
export function validateChatResponse(
  value: unknown,
): ValidationResult {
  const parsed = chatResponseEnvelopeSchema.safeParse(value);
  if (parsed.success) {
    return { ok: true, data: parsed.data as unknown as ChatResponseEnvelope };
  }
  return {
    ok: false,
    violations: parsed.error.issues.map(
      (i) => `${i.path.join('.') || '(root)'}: ${i.message}`,
    ),
  };
}

/** Lightweight body-only check for fixture JSON before enveloping. */
export function validateChatResponseBody(value: unknown): {
  ok: boolean;
  violations: string[];
  data?: ChatResponseBody;
} {
  const parsed = chatResponseBodySchema.safeParse(value);
  if (parsed.success) {
    return {
      ok: true,
      violations: [],
      data: parsed.data as unknown as ChatResponseBody,
    };
  }
  return {
    ok: false,
    violations: parsed.error.issues.map(
      (i) => `${i.path.join('.') || '(root)'}: ${i.message}`,
    ),
  };
}
