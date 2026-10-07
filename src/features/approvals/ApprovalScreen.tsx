import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '@/api/apiClient';
import {
  approveApproval,
  denyApproval,
  getAgent,
  getApproval,
} from '@/api/automationClient';
import { StepUpSheet } from '@/components/StepUpSheet';
import { useToast } from '@/components/Toast';
import { formatExpiresIn } from '@/lib/deepLink';

export function ApprovalScreen() {
  const { approvalId = '' } = useParams();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const [workingMsg, setWorkingMsg] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ['approval', approvalId],
    queryFn: () => getApproval(approvalId),
    enabled: Boolean(approvalId),
  });

  const pollUntilDone = async (agentId: string) => {
    setWorkingMsg('Approved, working on it…');
    const deadline = Date.now() + 20_000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const agent = await getAgent(agentId);
        const state = agent.lastRun?.state;
        if (state === 'done' || state === 'failed' || state === 'denied') {
          setWorkingMsg(
            state === 'done'
              ? 'Done.'
              : state === 'failed'
                ? 'Something went wrong.'
                : 'Denied.',
          );
          void qc.invalidateQueries({ queryKey: ['activity'] });
          void qc.invalidateQueries({ queryKey: ['agent', agentId] });
          return;
        }
      } catch {
        /* keep polling */
      }
    }
    setWorkingMsg('Still working — check Activity for updates.');
  };

  const approve = useMutation({
    mutationFn: (token: string) => approveApproval(approvalId, token),
    onSuccess: async () => {
      setStepUpOpen(false);
      await q.refetch();
      const agentId = q.data?.agent.agentId;
      if (agentId) void pollUntilDone(agentId);
      else setWorkingMsg('Approved, working on it…');
    },
    onError: async (e) => {
      if (!(e instanceof ApiError)) {
        toast('Approve failed');
        return;
      }
      const code = e.problem.code;
      if (code === 'step_up_required') {
        setStepUpOpen(true);
        return;
      }
      if (code === 'step_up_unavailable') {
        toast("Couldn't verify it's you. Try again.");
        return;
      }
      if (code === 'approval_not_pending') {
        await q.refetch();
        return;
      }
      if (code === 'preview_changed') {
        toast('This request changed. Nothing was done.');
        await q.refetch();
        return;
      }
      toast(e.message);
    },
  });

  const deny = useMutation({
    mutationFn: () => denyApproval(approvalId),
    onSuccess: async () => {
      toast('Declined. Nothing was changed.');
      await q.refetch();
    },
    onError: async (e) => {
      if (e instanceof ApiError && e.problem.code === 'approval_not_pending') {
        await q.refetch();
        return;
      }
      toast('Decline failed');
    },
  });

  const a = q.data;
  const pending =
    a?.status === 'pending' && new Date(a.expiresAt).getTime() > Date.now();

  const resultCopy = () => {
    if (!a) return '';
    if (a.status === 'approved') return 'You approved this';
    if (a.status === 'denied') return 'You declined this';
    if (a.status === 'expired')
      return 'This request expired, nothing was changed';
    return a.status;
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-wf-cream">
      <header className="flex shrink-0 items-center gap-2 border-b border-wf-gray-300 bg-wf-white px-3 py-3">
        <Link to="/activity" className="text-sm font-semibold text-wf-red">
          ← Back
        </Link>
        <h1 className="text-base font-semibold">Approval</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {q.isLoading ? <p className="text-sm">Loading…</p> : null}
        {q.isError ? (
          <p className="text-sm text-err">Approval not found.</p>
        ) : null}
        {a ? (
          <div className="space-y-4">
            <section className="rounded-2xl bg-wf-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase text-wf-purple">
                {a.agent.name}
              </p>
              <p className="mt-2 text-sm text-wf-gray-700">
                {a.trigger.description}
              </p>
              <p className="mt-3 text-base font-semibold text-wf-ink">
                {a.preview.effect}
              </p>
              {a.preview.warnings.length > 0 ? (
                <ul className="mt-3 space-y-1 rounded-xl bg-wf-amber-soft/60 p-3">
                  {a.preview.warnings.map((w) => (
                    <li key={w} className="text-xs text-wf-amber">
                      ⚠ {w}
                    </li>
                  ))}
                </ul>
              ) : null}
              {pending ? (
                <p className="mt-3 text-xs font-medium text-wf-gray-700">
                  {formatExpiresIn(a.expiresAt)}
                </p>
              ) : (
                <p className="mt-3 text-sm font-medium text-wf-ink">
                  {resultCopy()}
                </p>
              )}
            </section>

            {workingMsg ? (
              <p className="text-center text-sm font-medium text-wf-purple">
                {workingMsg}
              </p>
            ) : null}

            {pending ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={approve.isPending || deny.isPending}
                  className="flex-1 rounded-xl bg-wf-red py-3 text-sm font-semibold text-wf-white disabled:opacity-50"
                  onClick={() => setStepUpOpen(true)}
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={approve.isPending || deny.isPending}
                  className="flex-1 rounded-xl border border-wf-gray-300 bg-wf-white py-3 text-sm font-semibold disabled:opacity-50"
                  onClick={() => deny.mutate()}
                >
                  Decline
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <StepUpSheet
        open={stepUpOpen}
        onCancel={() => setStepUpOpen(false)}
        onConfirm={(token) => approve.mutate(token)}
      />
    </div>
  );
}
