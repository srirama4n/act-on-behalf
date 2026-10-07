import { Link } from 'react-router-dom';

export function HomeScreen() {
  return (
    <div className="flex h-full min-h-0 flex-col bg-wf-cream">
      <header className="border-b border-wf-gray-300 bg-wf-red px-4 pb-6 pt-4 text-wf-white">
        <p className="text-xs font-medium uppercase tracking-wide opacity-90">
          Wells Fargo
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Good evening</h1>
        <p className="mt-1 text-sm text-white/85">
          Your personal agents help manage money between visits.
        </p>
      </header>
      <div className="space-y-3 p-4">
        <Link
          to="/assistant"
          className="block rounded-2xl bg-wf-white p-4 shadow-sm"
        >
          <p className="font-semibold text-wf-ink">Ask Fargo</p>
          <p className="mt-1 text-xs text-wf-gray-700">
            Set up a payday sweep or subscription guard
          </p>
        </Link>
        <Link
          to="/agents"
          className="block rounded-2xl border border-wf-purple/25 bg-wf-purple-soft p-4"
        >
          <p className="font-semibold text-wf-purple">Your agents</p>
          <p className="mt-1 text-xs text-wf-gray-700">
            Pause, review rules, or delete
          </p>
        </Link>
        <Link
          to="/activity"
          className="block rounded-2xl bg-wf-white p-4 shadow-sm"
        >
          <p className="font-semibold text-wf-ink">Recent activity</p>
          <p className="mt-1 text-xs text-wf-gray-700">
            Approvals, runs, and notifications
          </p>
        </Link>
      </div>
    </div>
  );
}
