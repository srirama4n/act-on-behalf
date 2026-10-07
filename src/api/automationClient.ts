import { automationFetch } from './apiClient';
import { CUSTOMER_ID } from './config';
import type {
  ActivityPage,
  AgentDetail,
  AgentSummary,
  Approval,
  DevPush,
} from './types';

export function listAgents(status = 'on,paused') {
  return automationFetch<{ agents: AgentSummary[] }>(
    `/v1/customers/${CUSTOMER_ID}/agents?status=${encodeURIComponent(status)}`,
  );
}

export function getAgent(agentId: string) {
  return automationFetch<AgentDetail>(`/v1/agents/${agentId}`);
}

export function patchAgent(
  agentId: string,
  status: 'on' | 'paused',
  version: number,
) {
  return automationFetch<AgentDetail>(`/v1/agents/${agentId}`, {
    method: 'PATCH',
    headers: { 'If-Match': String(version) },
    body: JSON.stringify({ status }),
  });
}

export function deleteAgent(agentId: string) {
  return automationFetch<void>(`/v1/agents/${agentId}`, { method: 'DELETE' });
}

export function getApproval(approvalId: string) {
  return automationFetch<Approval>(`/v1/approvals/${approvalId}`);
}

export function approveApproval(approvalId: string, stepUpToken: string) {
  return automationFetch<{ status: string; runState: string }>(
    `/v1/approvals/${approvalId}/approve`,
    {
      method: 'POST',
      headers: { 'X-StepUp-Token': stepUpToken },
      body: JSON.stringify({}),
    },
  );
}

export function denyApproval(approvalId: string) {
  return automationFetch<{ status: string }>(
    `/v1/approvals/${approvalId}/deny`,
    { method: 'POST', body: JSON.stringify({}) },
  );
}

export function listActivity(before?: string | null, limit = 20) {
  const q = new URLSearchParams({ limit: String(limit) });
  if (before) q.set('before', before);
  return automationFetch<ActivityPage>(
    `/v1/customers/${CUSTOMER_ID}/activity?${q}`,
  );
}

export function listDevPushes() {
  return automationFetch<{ pushes: DevPush[] }>('/v1/dev/pushes');
}

export function triggerAgent(agentId: string, body: Record<string, unknown>) {
  return automationFetch<unknown>(`/v1/dev/trigger/${agentId}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function createConfirmation(body: Record<string, unknown>) {
  return automationFetch<{ confirmationToken: string }>('/v1/confirmations', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function createAgentViaMcp(body: Record<string, unknown>) {
  return automationFetch<AgentDetail>('/v1/agents', {
    method: 'POST',
    headers: { 'X-Dev-Caller': 'mcp' },
    body: JSON.stringify(body),
  });
}
