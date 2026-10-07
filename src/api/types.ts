export type AgentMode = 'ask' | 'act_then_tell' | 'read';
export type AgentStatus = 'on' | 'paused' | 'deleted';
export type RunState =
  | 'triggered'
  | 'previewing'
  | 'awaiting_approval'
  | 'executing'
  | 'done'
  | 'skipped'
  | 'denied'
  | 'expired'
  | 'failed';
export type ApprovalStatus = 'pending' | 'approved' | 'denied' | 'expired';
export type ActivityType =
  | 'created'
  | 'paused'
  | 'resumed'
  | 'deleted'
  | 'fired'
  | 'skipped'
  | 'approval_requested'
  | 'approved'
  | 'denied'
  | 'expired'
  | 'completed'
  | 'failed'
  | 'notified';

export interface AgentSummary {
  agentId: string;
  name: string;
  templateId: string;
  mode: AgentMode;
  status: AgentStatus;
  effectText: string;
  createdAt: string;
  lastRun?: { state: RunState; at: string } | null;
}

export interface DisplayParam {
  label: string;
  value: string;
}

export interface RunSummary {
  runId: string;
  state: RunState;
  createdAt: string;
  updatedAt: string;
  summary: string;
}

export interface AgentDetail extends AgentSummary {
  version: number;
  params: DisplayParam[];
  trigger: { type: string; description: string };
  guards: { description: string }[];
  limits: { description: string }[];
  grant: { allowedTools: string[]; accountScopes: DisplayParam[] };
  recentRuns: RunSummary[];
}

export interface Approval {
  approvalId: string;
  status: ApprovalStatus;
  expiresAt: string;
  agent: { agentId: string; name: string };
  trigger: { description: string; data?: Record<string, unknown> };
  preview: {
    effect: string;
    warnings: string[];
    data?: Record<string, unknown>;
  };
}

export interface ActivityItem {
  eventId: string;
  type: ActivityType;
  message: string;
  agentId: string;
  runId?: string | null;
  createdAt: string;
}

export interface ActivityPage {
  items: ActivityItem[];
  nextCursor: string | null;
}

export interface Problem {
  type: string;
  title: string;
  status: number;
  code: string;
  detail?: string;
  errors?: { field: string; code: string; message: string }[];
}

export interface DevPush {
  pushId: string;
  customerId: string;
  title: string;
  body: string;
  deepLink: string;
  category: 'agent_approval' | 'agent_update';
  createdAt: string;
}

/** Feature-shaped chat types — mapped onto Chat Service in chatService.ts */
export type ChatRequest = {
  sessionId: string;
  message:
    | { type: 'text'; text: string }
    | {
        type: 'action';
        action: 'create_agent' | 'decline_agent';
        draftId: string;
      };
};

export type ChatResponse = {
  sessionId: string;
  messageId: string;
  delta?: string;
  status?: string | null;
  cards?: ChatCard[];
  done: boolean;
  error?: { code: string; message: string };
};

export type ChatCard = ReviewCard | AgentCreatedCard;

export interface ReviewCard {
  type: 'review_card';
  draftId: string;
  name: string;
  sourceNote: string;
  effectText: string;
  params: DisplayParam[];
  limits: string[];
  mode: AgentMode;
  rules?: Record<string, unknown>;
}

export interface AgentCreatedCard {
  type: 'agent_created';
  draftId: string;
  agentId: string;
  name: string;
  status: 'on';
}
