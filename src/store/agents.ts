import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  AGENT_DEFS,
  initialAgentRuntime,
  type AgentId,
  type AgentRuntime,
} from '@/mock/agents';
import { eventBus } from '@/bus/eventBus';
import { useAccountsStore } from './accounts';
import { useActivityStore } from './activity';
import { usePhoneUiStore } from './phoneUi';

interface AgentsState {
  runtime: Record<AgentId, AgentRuntime>;
  setEnabled: (id: AgentId, enabled: boolean) => void;
  setPending: (
    id: AgentId,
    pending: AgentRuntime['pendingApproval'],
  ) => void;
  markRun: (id: AgentId, outcome: string) => void;
  approve: (id: AgentId) => void;
  decline: (id: AgentId) => void;
  forceRun: (id: AgentId, opts?: { denyPermission?: boolean }) => void;
  resetAgents: () => void;
}

function bumpRun(
  runtime: AgentRuntime,
  outcome: string,
): AgentRuntime {
  return {
    ...runtime,
    lastRun: Date.now(),
    runsToday: runtime.runsToday + 1,
    lastOutcome: outcome,
  };
}

export const useAgentsStore = create<AgentsState>((set, get) => ({
  runtime: initialAgentRuntime(),

  setEnabled: (id, enabled) =>
    set((s) => ({
      runtime: { ...s.runtime, [id]: { ...s.runtime[id], enabled } },
    })),

  setPending: (id, pendingApproval) =>
    set((s) => ({
      runtime: { ...s.runtime, [id]: { ...s.runtime[id], pendingApproval } },
    })),

  markRun: (id, outcome) =>
    set((s) => ({
      runtime: { ...s.runtime, [id]: bumpRun(s.runtime[id], outcome) },
    })),

  approve: (id) => {
    const pending = get().runtime[id].pendingApproval;
    if (!pending) return;

    if (id === 'payday-sweep') {
      const amount = pending.amount ?? 500;
      useAccountsStore
        .getState()
        .transferCheckingToSavings(amount, 'Payday sweep → savings');
      useActivityStore.getState().add({
        type: 'approval',
        title: 'Payday sweep approved',
        detail: `Moved ${amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} to savings.`,
      });
      usePhoneUiStore.getState().pushUpdate(`Sweep moved $${amount} to savings`);
      eventBus.publish({
        type: 'agent.action',
        direction: 'agent',
        summary: `Payday sweep approved ($${amount})`,
        payload: { agentId: id, action: 'approve', amount },
      });
    } else {
      useActivityStore.getState().add({
        type: 'approval',
        title: `${AGENT_DEFS.find((a) => a.id === id)?.name ?? id} approved`,
        detail: pending.summary,
      });
      eventBus.publish({
        type: 'agent.action',
        direction: 'agent',
        summary: `Approved ${id}`,
        payload: { agentId: id, action: 'approve' },
      });
    }

    set((s) => ({
      runtime: {
        ...s.runtime,
        [id]: {
          ...bumpRun(s.runtime[id], 'approved'),
          pendingApproval: null,
        },
      },
    }));
    usePhoneUiStore.getState().bumpBadge('agents', -1);
  },

  decline: (id) => {
    const pending = get().runtime[id].pendingApproval;
    if (!pending) return;
    useActivityStore.getState().add({
      type: 'approval',
      title: `${AGENT_DEFS.find((a) => a.id === id)?.name ?? id} declined`,
      detail: pending.summary,
    });
    eventBus.publish({
      type: 'agent.action',
      direction: 'agent',
      summary: `Declined ${id}`,
      payload: { agentId: id, action: 'decline' },
    });
    set((s) => ({
      runtime: {
        ...s.runtime,
        [id]: {
          ...bumpRun(s.runtime[id], 'declined'),
          pendingApproval: null,
        },
      },
    }));
    usePhoneUiStore.getState().bumpBadge('agents', -1);
  },

  forceRun: (id, opts) => {
    const def = AGENT_DEFS.find((a) => a.id === id);
    if (!def) return;
    const deny = Boolean(opts?.denyPermission);

    if (deny) {
      useActivityStore.getState().add({
        type: 'blocked',
        title: `${def.name} blocked`,
        detail: 'Permission denied — action was not completed.',
        blocked: true,
      });
      eventBus.publish({
        type: 'agent.action',
        direction: 'agent',
        summary: `BLOCKED: ${def.name} (permission denied)`,
        payload: { agentId: id, action: 'blocked', reason: 'permission_denied' },
      });
      get().markRun(id, 'blocked:permission_denied');
      usePhoneUiStore.getState().showPush({
        title: 'Action blocked',
        body: `${def.name} lacked permission.`,
        targetTab: 'activity',
      });
      return;
    }

    if (id === 'bill-reader') {
      usePhoneUiStore.getState().setStatusPill('Checking your agents’ rules…');
      window.setTimeout(() => {
        usePhoneUiStore.getState().setStatusPill(null);
        useActivityStore.getState().add({
          type: 'agent',
          title: 'Bill due reminder',
          detail: 'Electric bill ~$120 due Friday. No approval needed.',
        });
        usePhoneUiStore.getState().pushUpdate('Bill due Friday (~$120)');
        usePhoneUiStore.getState().showPush({
          title: 'Bill reader',
          body: 'Electric bill due Friday (~$120).',
          targetTab: 'activity',
        });
        eventBus.publish({
          type: 'agent.action',
          direction: 'agent',
          summary: 'Bill reader: bill due (no approval)',
          payload: { agentId: id, action: 'bill_due' },
        });
        get().markRun(id, 'bill_due');
      }, 400);
      return;
    }

    get().markRun(id, 'force_run');
    eventBus.publish({
      type: 'agent.action',
      direction: 'agent',
      summary: `Force-run ${def.name}`,
      payload: { agentId: id, action: 'force_run' },
    });
  },

  resetAgents: () => set({ runtime: initialAgentRuntime() }),
}));

export function requestPaydayApproval(amount: number): void {
  const id: AgentId = 'payday-sweep';
  const runtime = useAgentsStore.getState().runtime[id];
  if (!runtime.enabled) return;

  const pending = {
    id: uuidv4(),
    summary: `Move $500 of your $${amount.toLocaleString()} payroll into savings?`,
    amount: 500,
    createdAt: Date.now(),
  };
  useAgentsStore.getState().setPending(id, pending);
  useAgentsStore.getState().markRun(id, 'awaiting_approval');
  usePhoneUiStore.getState().bumpBadge('agents', 1);
  useActivityStore.getState().add({
    type: 'approval',
    title: 'Payday sweep needs approval',
    detail: pending.summary,
  });
  eventBus.publish({
    type: 'agent.action',
    direction: 'agent',
    summary: 'Payday sweep awaiting approval',
    payload: { agentId: id, action: 'pending_approval', pending },
  });
}
