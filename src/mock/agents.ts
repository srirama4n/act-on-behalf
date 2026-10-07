export type AgentPermission = 'move_money' | 'notify' | 'lock_card' | 'read_bills';

export type AgentId =
  | 'payday-sweep'
  | 'low-balance'
  | 'foreign-charge'
  | 'bill-reader';

export interface AgentDef {
  id: AgentId;
  name: string;
  rule: string;
  trigger: string;
  permissions: AgentPermission[];
}

export interface AgentRuntime {
  enabled: boolean;
  pendingApproval: null | {
    id: string;
    summary: string;
    amount?: number;
    createdAt: number;
  };
  lastRun: number | null;
  runsToday: number;
  lastOutcome: string | null;
}

export const AGENT_DEFS: AgentDef[] = [
  {
    id: 'payday-sweep',
    name: 'Payday sweep',
    rule: 'When payroll posts, move $500 from checking to savings after you approve.',
    trigger: 'Payroll deposit',
    permissions: ['move_money', 'notify'],
  },
  {
    id: 'low-balance',
    name: 'Low-balance alert',
    rule: 'Notify me when checking falls below $500.',
    trigger: 'Balance < $500',
    permissions: ['notify'],
  },
  {
    id: 'foreign-charge',
    name: 'Foreign charge guard',
    rule: 'If a foreign charge hits while I am home, lock the debit card.',
    trigger: 'Card charge abroad',
    permissions: ['lock_card', 'notify'],
  },
  {
    id: 'bill-reader',
    name: 'Bill reader',
    rule: 'On Monday 9:00, post upcoming bill reminders — no approval needed.',
    trigger: 'Monday 9:00',
    permissions: ['read_bills', 'notify'],
  },
];

export function initialAgentRuntime(): Record<AgentId, AgentRuntime> {
  return {
    'payday-sweep': {
      enabled: true,
      pendingApproval: null,
      lastRun: null,
      runsToday: 0,
      lastOutcome: null,
    },
    'low-balance': {
      enabled: true,
      pendingApproval: null,
      lastRun: null,
      runsToday: 0,
      lastOutcome: null,
    },
    'foreign-charge': {
      enabled: true,
      pendingApproval: null,
      lastRun: null,
      runsToday: 0,
      lastOutcome: null,
    },
    'bill-reader': {
      enabled: true,
      pendingApproval: null,
      lastRun: null,
      runsToday: 0,
      lastOutcome: null,
    },
  };
}
