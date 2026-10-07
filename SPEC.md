# CLAUDE.md — Fargo Demo Workbench (React)

> Build instructions for Claude Code. Put this file in the root of an empty repo and ask Claude to "build the app described in CLAUDE.md, phase by phase."

---

## 1. What we are building

A single-page **React** app that splits the screen into two parts:

| Left (~40%) | Right (~60%) |
|---|---|
| **Customer view** — a realistic mobile phone frame running the **Fargo** banking assistant (chat first, plus a few supporting screens). | **Demo Console** — the "bank side / backstage": publish events, trigger schedules, change customer context, and watch every request, response and event as it flows. |

The point of the app is a **live demo**: the presenter clicks something in the console (e.g. "Payroll deposit $4,200"), the phone reacts (push banner, new chat message, agent update), and the console shows the exact `ChatServiceRequest` / `ChatServiceResponse` JSON that made it happen.

### Reference material (inspiration only — do NOT clone)
A reference demo video showed a phone + "Demo console" layout with bank-event chips, scheduler buttons, connected-websites list, agent cards with Approve/Decline, and an Activity audit trail. **Use it only for ideas.** Our version must differ in these ways:

- The console is a **developer-grade event workbench**, not a list of chips: it has an event publisher, a live event stream, and a JSON inspector for the real Fargo contract (section 6).
- The chat renders the **Fargo response contract** (QRB quick replies, disclosures, app links, annotated messages) rather than free-form demo text.
- Wells Fargo theme (section 4), not a generic red/neutral palette.
- Bilingual (`es` / `en`) driven by `Language_Preference`.

---

## 2. Tech stack (use exactly this unless there is a strong reason)

- **Vite + React 18 + TypeScript** (strict mode)
- **Tailwind CSS** with theme tokens defined in `tailwind.config.ts` + CSS variables
- **Zustand** for state (one store per domain: `session`, `chat`, `events`, `agents`, `settings`)
- **framer-motion** for push banners, message entrance, typing indicator
- **lucide-react** for icons
- **react-json-view-lite** (or a small custom tree) for the JSON inspector
- **uuid** for IDs
- **Vitest + React Testing Library** for tests
- No backend required: ship a **mock transport**, with a pluggable **HTTP transport** for the real endpoint (section 7).

---

## 3. Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ Top bar: "Fargo Demo Workbench" · env badge (MOCK / RQA) · lang ES|EN │
├───────────────────────────┬──────────────────────────────────────────┤
│                           │  DEMO CONSOLE (tabs)                      │
│     ┌───────────────┐     │  [Publish] [Stream] [Context] [Agents]    │
│     │  status bar   │     │  [Settings]                               │
│     │  Fargo header │     │                                           │
│     │               │     │  Publish → event cards grouped by domain  │
│     │  chat / home  │     │  Stream  → live timeline + JSON inspector │
│     │               │     │                                           │
│     │  QRB chips    │     │                                           │
│     │  composer     │     │                                           │
│     │  tab bar      │     │                                           │
│     └───────────────┘     │                                           │
│   phone frame, centered   │                                           │
└───────────────────────────┴──────────────────────────────────────────┘
```

- Use CSS grid: `grid-cols-[minmax(420px,2fr)_3fr]`, full viewport height, each side scrolls independently.
- Phone frame: 390×844 logical size, rounded 48px, scaled with `transform: scale()` to fit the column height. Status bar (time, signal, battery), dynamic-island notch, home indicator.
- Below 1100px width, stack vertically (phone on top, console below). At phone width, show only the phone with a floating "Console" button that opens the console as a bottom sheet.
- Optional "Presenter mode" toggle (Settings): hides the JSON panes and enlarges the phone for screen-sharing.

---

## 4. Theme — Wells Fargo inspired

Define as CSS variables in `src/theme/tokens.css` and map into Tailwind.

| Token | Value | Use |
|---|---|---|
| `--wf-red` | `#D71E28` | Primary: header bar, send button, user bubbles, primary CTAs |
| `--wf-red-dark` | `#B31E30` | Hover/pressed, gradients |
| `--wf-gold` | `#FFCD41` | Accent: focus ring, active tab underline, highlights, "new" badges |
| `--wf-ink` | `#141414` | Primary text |
| `--wf-gray-700` | `#3B3331` | Secondary text |
| `--wf-gray-300` | `#D6D1CF` | Borders, dividers |
| `--wf-cream` | `#F4F0ED` | App/page background |
| `--wf-white` | `#FFFFFF` | Cards, assistant bubbles |
| `--ok` | `#0F7B3F` | Success, "Active" pills |
| `--warn` | `#B26B00` | Approval needed |
| `--err` | `#A4161A` | Errors, blocked actions |

Rules:
- Phone header: solid `--wf-red` bar with a thin `--wf-gold` bottom stripe; title "Fargo".
- Assistant bubbles white with subtle border; user bubbles `--wf-red` with white text.
- Console uses a calmer surface (white cards on `--wf-cream`) with red only for primary actions so the phone stays the focal point.
- Font: system stack (`-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`); monospace for JSON (`ui-monospace, SFMono-Regular, Menlo`).
- Do **not** bundle the official Wells Fargo logo/stagecoach. Use a text wordmark "WELLS FARGO" in a placeholder slot (`src/assets/brand/`) so the brand team's approved asset can be dropped in.
- WCAG AA contrast; white on `--wf-red` passes for ≥14px bold text. Visible focus rings in `--wf-gold`.

---

## 5. Mobile app (left pane)

Bottom tab bar: **Home · Fargo (chat) · Agents · Activity**. Chat is the default tab.

### 5.1 Fargo chat screen (the core)
- Header: "Fargo", subtitle "Tu asistente de IA" / "Your AI assistant", close (X) icon that triggers `/exit` flow in mock.
- On mount → send **INIT** request (`messageType: "INIT"`, `message: "sunrise"`, `launchSource.launchSourceName: "NAV_ICON"`). Render the welcome response.
- Message rendering, driven entirely by the response contract (section 6.3):
  - `messages[].message` → assistant bubble. Respect `\n` line breaks. If `messageFormat === "ANNOTATED"`, support simple inline annotations (bold, links) — keep a renderer that ignores unknown markup safely.
  - `richMessages[]` with `responseType: "QRB_LIST"` → horizontally scrollable **quick-reply chips** from `data.buttons[].channelData.title`.
  - `richMessages[]` with `responseType: "SYSTEM_MESSAGE"` → render `data.disclosures[]` as a small gray disclosure footnote under the bubble (expandable if long).
  - `actions[]` with `actionType: "APP_LINK"` → render as a link-style button; tapping logs an `APP_LINK` request and shows a toast "Opening in app…" (mock).
  - `inputStatus: "DISABLED"` → disable composer; `inputFormat` controls keyboard hint.
  - `error.errorCode` non-empty → inline error bubble with retry.
  - `agentInfo` non-null → show a small "Handled by {agent}" caption (supports Fargo's multi-agent story).
- Tapping a QRB chip sends a request with `typedUtterance: false`, `message` = `goldenUtterance`, and `channelData` copied from the button (including `custom.uiElementID`).
- Typing sends `typedUtterance: true`, `messageType: "TEXT"`.
- Typing indicator (three dots) while awaiting a response; respect "demo pacing" latency from Settings.
- Disclosure for compliance is always reachable (info icon in header opens the latest disclosure text).

### 5.2 Home
Greeting, balance card (checking/savings), debit card status (Active/Locked), "Fargo updates" feed (agent outcomes), recent transactions. Values come from the mock `accounts` store and **change when console events fire** (e.g. payroll deposit raises checking).

### 5.3 Agents
List of personal agents (e.g. Payday sweep, Low-balance alert, Foreign charge guard, Bill reader). Each card: name, plain-language rule, trigger pill, permission pills, on/off toggle. "Needs your approval" cards with Approve / Decline at top when pending.

### 5.4 Activity
Audit trail of everything that happened to the customer: notifications, approvals, agent actions, blocked actions — newest first, each with a type label.

### 5.5 System UI
- **Push banner** that slides down from the notch when a console event produces a customer notification; tap opens the relevant tab.
- Badge counts on tab icons.
- Status pill in the dynamic-island area for long-running agent work ("Checking your agents' rules…").

---

## 6. Data contracts (MUST follow)

Source: the `chat-service-request` / `chat-service-response` samples on the team Confluence page *Fargo-PZLSF-1153 Parity with Matcha Latte Feature ChatGPT*. Recreate these as TypeScript types in `src/contracts/chatService.ts` and as fixtures in `src/fixtures/`. Some lines of the samples were not visible in the screenshots — those are marked `// TODO verify` and must be typed as optional.

Replace any real-looking identifiers (ECN, host names) in fixtures with obviously fake values.

### 6.1 Envelope (shared by request and response)

```ts
export interface KafkaHeaders {
  application_environment: string;      // "rqa"
  sender_app_id: string;                // "cvams"
  sender_host_name: string;             // "demo-host-01"
  cache_key: string;                    // `${m2_session_id}_${conversation_id}`
  App_Resolved_Version: string;         // "2026030000"
  session_id: string;                   // same as conversation_id
  chat_message_id: string;              // = jsonString.id (req) / system message id (resp)
  ecn_id: string;                       // FAKE in fixtures, e.g. "000000000001"
  App_Internal_Version: string;
  event_timestamp: string;              // epoch ms as string
  api_version: string;                  // "1"
  Resolved_Lang_Pref_Code: "es" | "en";
  event_id: string;                     // uuid
  event_type: "TOKENIZED_CHAT_SERVICE_REQUEST" | "TOKENIZED_CHAT_SERVICE_RESPONSE";
  m2_session_id: string;                // uuid
  conversation_id: string;              // uuid + "_A"
  Language_Preference: "es" | "en";
  kafka_correlationId: string;          // = uniqueToken
  event_name: string;                   // "kafka.dna.topic"
  xa_id: string | null;
  "orch.senderHostName": string;
}

export interface Envelope<T> {
  jsonClass: string;   // "com.wellsfargo.cva.schema.chatservice.v1.model.ChatServiceRequest" | "...ChatServiceResponse"
  uniqueToken: string; // uuid, equals headers.kafka_correlationId
  headers: KafkaHeaders;
  jsonString: T;
}
```

### 6.2 ChatServiceRequest (`jsonString`)

```ts
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
  title?: string; // present on QRB buttons
}

export interface ChatRequestBody {
  version: "1.0";
  id: string;                         // chat message id (uuid)
  conversation: { id: string };       // uuid + "_A"
  replyTo: string | null;
  source: "USER";
  timestamp: number;                  // NOTE: sample shows epoch SECONDS here (1774290612) — keep configurable
  typedUtterance: boolean;
  isPredicted: boolean | null;
  isAccountTile: boolean | null;
  voiceUtterance: boolean | null;
  userRequestTokenized: boolean | null;
  messageType: "INIT" | "TEXT" | "APP_LINK" | string;
  message: string;                    // "sunrise" for INIT
  router: string | null;
  channelData: ChannelData;
  customerContext: {
    timeStamp: string;                // epoch ms as string
    timeZone: string;                 // "GMT"
    currentPageId: string;            // "ACCOUNT_SUMMARY_REACT"
    isNewSession: "true" | "false";
    languagePreference: "es" | "en";
    customerBranding: string;         // "COB"
    featuresInsightsPilot: "true" | "false";
    barkerPresent: "true" | "false";
  };
  launchSource: { launchSourceName: string; additionalInfo: Record<string, unknown> }; // "NAV_ICON"
}
```

### 6.3 ChatServiceResponse (`jsonString`)

```ts
export interface ChatResponseBody {
  version: "1.0";
  systemRespTokenized: boolean;
  nlpSessionStart: boolean;
  dirtyData: unknown | null;
  metadata: { reference: string | null };
  config: {
    keepAliveUrl: string; appLinkUrl: string; chatUrl: string; logOffUrl: string;
    chatResumeUrl: string; exitSamlUrl: string | null; fafUrl: string; homeButtonUrl: string;
    merchantSearch: string; insightsUrl: string | null; fafXapiUrl: string; chatXapiUrl: string;
    homeButtonXapiUrl: string; exitXapiUrl: string; keepAliveXapiUrl: string | null;
    xapiContextPath: string;          // "/xapi/virtual-assistant/chatbot"
    disclosureMessage: string;        // "COMPLIANCE DISCLOSURE - BOTH"
    apiOverride: unknown | null; keepAliveTimeout: number | null; richMessages: boolean;
    cookies: unknown[]; headers: unknown[]; integrations: unknown | null;
    userProfileUrl: string | null; userProfile: unknown | null;
    en: unknown | null; es: unknown | null; languageChange: unknown | null; newLanguagePrefCode: string | null;
  };
  agentInfo: unknown | null;
  messages: FargoMessage[];
}

export interface FargoAction {
  actionType: "SUBMIT_AWAIT" | "APP_LINK" | string;
  url: string;                        // "/xapi/virtual-assistant/chatbot/v1/chat" | "/applink"
  xapiEnabled: "true" | null;
  feedback: "WIDGET" | string;
  renderMode: "INLINE" | string;
  transitionMode: string | null; transitionText: string | null; actionCompletedText: string | null;
  payload: { channelData: ChannelData };
  // Pre-built envelope for the NEXT user message — the client reuses these when the action fires:
  id: string;                         // next user message id
  conversation: { id: string };
  replyTo: string;                    // id of the system message being answered
  subSystem: string | null;
  source: "USER";
  timestamp: number;
  messageType: "TEXT" | "APP_LINK";
  message: string | null;
  router: string | null;
  isAccountTile: boolean | null;
}

export interface QrbButton {
  type: "SIMPLE";
  orientation: string | null; navigationInfo: unknown | null; alignment: string | null;
  additionalInfo: unknown | null;
  channelData: ChannelData & { title: string; custom: { uiElementID: string } };
  styleAttributes: unknown | null;
}

export type RichMessage =
  | { responseType: "QRB_LIST"; variation: string | null; actions: FargoAction[]; data: { buttons: QrbButton[] } }
  | { responseType: "SYSTEM_MESSAGE"; variation: string | null; actions: FargoAction[];
      data: { disclosures: { type: "PLAIN"; disclosureType: string; text: string }[] } };

export interface FargoMessage {
  inputStatus: "ENABLED" | "DISABLED";
  generatedResponseType: string | null;
  inputFormat: "FREE_TEXT" | string;
  inputValidation: unknown | null;
  displayKeyboard: unknown | null;
  messageFormat: "ANNOTATED" | string;
  pageTitle: string;
  layer: string;                      // "L1"
  custom: { responseID: string; gsdUpdated: string }; // "welcome.returninguser"
  navigationInfo: unknown | null;
  channelData: ChannelData | null;
  error: { errorCode: string; errorMessage: string };
  annotations: unknown[]; systemMessages: unknown[]; footnotes: unknown[]; disclosures: unknown[];
  actions: FargoAction[];
  // ~lines 128–145 of the sample not captured — TODO verify (keep [k: string]: unknown)
  richMessages: RichMessage[];
  form: unknown | null;
  animationSettings: unknown | null;
  banner: unknown[];
  id: string;
  conversation: { id: string };
  replyTo: string | null;
  subSystem: "WEBHOOK" | string | null;
  source: "SYSTEM";
  timestamp: number;
  messageType: string | null;
  message: string;                    // "Hola, SamA. \n\n¿Qué desea hacer hoy?"
  router: string | null;
  isAccountTile: boolean | null;
  [k: string]: unknown;
}
```

### 6.4 Fixtures to create (`src/fixtures/`)
- `request.init.es.json` — INIT/"sunrise" request as above.
- `response.welcome.es.json` — welcome response containing:
  - message: `"Hola, SamA. \n\n¿Qué desea hacer hoy?"`, `custom.responseID: "welcome.returninguser"`, `subSystem: "WEBHOOK"`
  - QRB_LIST buttons (title → `uiElementID`):
    - "¿Cuál es mi saldo?" → `qrb.WhatsMyBalance`
    - "¿Comparto mis planes de viaje?" → `qrb.ShareMyTravelPlans`
    - "¿Cómo son mis gastos?" → `qrb.HowsMySpending`
    - "Mostrarme qué puede hacer Fargo" → `qrb.ShowMeWhatFargoCanDo`
  - SYSTEM_MESSAGE disclosure `DISCLOSURE-1C`: "Fargo es su asistente de IA, no una persona real. Wells Fargo y sus proveedores de servicios pod…" (full text truncated in sample — TODO get full text)
  - actions: one `SUBMIT_AWAIT` (`callToActionId: "TBD"`) and one `APP_LINK` (`url: "/applink"`).
- English equivalents (`*.en.json`): "What's my balance?", "Should I share my travel plans?", "How's my spending?", "Show me what Fargo can do", plus an English disclosure placeholder.
- Canned responses for each QRB (balance, travel plans, spending, capabilities) and for each console event (section 8).

### 6.5 ID / header rules (implement in `src/contracts/builders.ts`)
- New session: `conversation_id = uuid() + "_A"`, `session_id = conversation_id`, `m2_session_id = uuid()`, `cache_key = m2_session_id + "_" + conversation_id`.
- Every request: new `uniqueToken` (= `kafka_correlationId`), new `event_id`, `chat_message_id = jsonString.id`.
- When the user responds via an action, use the action's prebuilt `id` / `replyTo` instead of generating new ones.
- `Language_Preference`, `Resolved_Lang_Pref_Code` and `customerContext.languagePreference` always match the console's language toggle.
- Write unit tests for these builders.

---

## 7. Architecture

```
src/
  app/                 App.tsx, layout, top bar
  phone/               PhoneFrame, StatusBar, TabBar, PushBanner
    screens/           ChatScreen, HomeScreen, AgentsScreen, ActivityScreen
    chat/              MessageBubble, QrbChips, DisclosureNote, AppLinkButton, Composer, TypingDots
  console/             ConsolePanel, tabs/
    publish/           EventCatalog, EventCard, CustomEventEditor
    stream/            EventTimeline, JsonInspector, HeaderTable, DiffView
    context/           CustomerContextForm, SessionInfo
    agents/            AgentStateTable
    settings/          SettingsForm
  contracts/           chatService.ts (types), builders.ts, validators.ts
  transport/           ChatTransport.ts, MockTransport.ts, HttpTransport.ts
  bus/                 eventBus.ts (typed pub/sub)
  mock/                scenarios.ts, responders.ts, accounts.ts, agents.ts
  store/               session.ts, chat.ts, events.ts, agents.ts, settings.ts
  fixtures/
  theme/               tokens.css
  i18n/                es.ts, en.ts
```

- **Event bus** (`bus/eventBus.ts`): every request, response, bank event, scheduler tick, notification and agent action is published here. The console Stream tab is just a subscriber, so *nothing* happens without appearing in the stream.
- **ChatTransport** interface: `send(env: Envelope<ChatRequestBody>): Promise<Envelope<ChatResponseBody>>`.
  - `MockTransport` — picks a responder by `messageType`, `channelData.custom.uiElementID`, or keyword match on `message`; applies pacing delay; returns fixture-based envelopes with fresh IDs.
  - `HttpTransport` — `POST {VITE_API_BASE}{xapiContextPath}/v1/chat`. Selected via `VITE_TRANSPORT=mock|http`. Never hard-code tokens.
- Runtime validation of responses (`validators.ts`, e.g. zod): unknown fields are allowed, missing required fields show a red "contract violation" marker in the Stream.

---

## 8. Demo Console (right pane)

Tabs:

### 8.1 Publish
Event catalog grouped by domain; each card has a title, a short description, editable parameters (amount, merchant, country) and a **Publish** button. On publish → bus event → mock engine updates accounts/agents → phone reacts → stream logs it.

| Group | Events |
|---|---|
| Deposits & payments | Payroll deposit ($4,200), Rent payment, Large transfer out |
| Card | Card charge abroad (merchant/country), Card declined, Merchant price increase |
| Fees & alerts | Overdraft fee ($35), Low balance (< $500), Bill due |
| Scheduler | Fire "Monday 9:00", Fire "Friday 9:00", Fire custom cron |
| Customer | Customer starts traveling, Change page (`currentPageId`), Reopen app (new session) |
| Chat | Send INIT, Send arbitrary utterance as the customer, Trigger error response |

Also: **Custom event** editor (raw JSON with schema hint) and **Scenario runner** — play a scripted sequence (e.g. "Payday story", "Travel story") with step-through controls (▶ play, ⏸ pause, ⏭ next).

### 8.2 Stream
- Live timeline, newest at top, each row: time, direction icon (→ request, ← response, ⚡ bank event, ⏰ schedule, 🔔 notification), type, short summary, latency.
- Filters by type, search box, pause stream, clear, export session as `.json`.
- Click a row → **JSON Inspector**: tabs for `headers` (table), `jsonString` (collapsible tree), `raw`; copy button; correlation highlighting (clicking a `uniqueToken` / `replyTo` / `conversation.id` highlights related rows).

### 8.3 Context
Editable `customerContext` (page id, language, branding, insights pilot, barker), `launchSource`, customer name, accounts and balances. "Apply & restart session" re-sends INIT.

### 8.4 Agents
Table of agents with state, trigger, permissions, last run, runs today; buttons to enable/disable, force-run, and simulate a permission denial (the action is blocked and the block appears in Activity and Stream).

### 8.5 Settings
Transport (Mock / HTTP + base URL), demo pacing on/off + latency slider, language ES/EN, presenter mode, show/hide JSON on phone long-press, **Reset demo**.

---

## 9. Required demo flows (acceptance criteria)

1. **Launch**: app loads → INIT request and welcome response appear in Stream → phone shows greeting, 4 QRB chips, disclosure note.
2. **Quick reply**: tap "¿Cuál es mi saldo?" → request carries `typedUtterance:false`, `goldenUtterance` and `uiElementID: "qrb.WhatsMyBalance"` → balance answer bubble.
3. **Typed message** → `typedUtterance:true`, `messageType:"TEXT"`.
4. **Language switch** to EN → headers + customerContext update, new INIT, English chips.
5. **Payroll deposit** published → Home balance updates, push banner, Payday-sweep agent asks for approval; Approve moves money; all steps in Stream and Activity.
6. **Card charge abroad** while "customer is home" → card shows Locked on Home, notification, Activity entry.
7. **Scheduler Monday 9:00** → bill-reader agent posts "bill due" update with no approval needed.
8. **Permission denial** → blocked action shown in red in Stream and Activity.
9. **Error response** → inline error bubble with Retry.
10. **Reset demo** restores initial state in < 1s.

Quality gates: `npm run build` has no TS errors; `npm run test` passes (builders, responders, QRB rendering, disclosure rendering); no console errors; keyboard-navigable; Lighthouse accessibility ≥ 90.

---

## 10. Build order for Claude

1. Scaffold (Vite, TS, Tailwind tokens, folders) and the split layout with an empty phone frame and console.
2. Contracts: types, builders, validators, fixtures + unit tests.
3. Event bus + MockTransport + chat store; Chat screen rendering the welcome response (messages, QRB, disclosures, actions).
4. Console Stream + JSON Inspector.
5. Console Publish + mock engine (accounts, agents) + Home / Agents / Activity screens + push banner.
6. Context, Settings, scenarios, i18n.
7. HttpTransport behind env flag.
8. Polish: motion, responsive, a11y, presenter mode; then run every acceptance flow in section 9 and fix gaps.

After each phase, run `npm run build` and `npm run test` and summarize what changed.

## 11. Don'ts
- Don't copy the reference video's layout, wording or flows one-to-one.
- Don't use real customer data, ECNs, tokens or internal host names — fixtures must be fake.
- Don't embed official logos; use the brand placeholder.
- Don't put business logic in components — it belongs in `mock/` responders and stores.
- Don't swallow unknown response fields; render what's known and log the rest in the inspector.
