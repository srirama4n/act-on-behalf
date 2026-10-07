import { t } from '@/i18n';
import { formatMoney } from '@/mock/accounts';
import { useAccountsStore } from '@/store/accounts';
import { usePhoneUiStore } from '@/store/phoneUi';
import { useSessionStore } from '@/store/session';
import { useSettingsStore } from '@/store/settings';

export function HomeScreen() {
  const language = useSettingsStore((s) => s.language);
  const copy = t(language);
  const customerName = useSessionStore((s) => s.customerName);
  const checking = useAccountsStore((s) => s.checking);
  const savings = useAccountsStore((s) => s.savings);
  const cardStatus = useAccountsStore((s) => s.cardStatus);
  const isTraveling = useAccountsStore((s) => s.isTraveling);
  const transactions = useAccountsStore((s) => s.transactions);
  const updates = usePhoneUiStore((s) => s.fargoUpdates);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-wf-cream">
      <header className="shrink-0 border-b-2 border-wf-gold bg-wf-red px-4 py-3">
        <p className="text-sm font-bold text-wf-white">{copy.homeTitle}</p>
        <p className="text-xs text-wf-white/85">
          {copy.homeGreeting}, {customerName}
          {isTraveling ? ` · ${copy.traveling}` : ''}
        </p>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        <section className="rounded-xl border border-wf-gray-300 bg-wf-white p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-wf-gray-700">
            {copy.balances}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div>
              <p className="text-[11px] text-wf-gray-700">{copy.checking}</p>
              <p
                className="text-lg font-semibold text-wf-ink"
                data-testid="checking-balance"
              >
                {formatMoney(checking)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-wf-gray-700">{copy.savings}</p>
              <p
                className="text-lg font-semibold text-wf-ink"
                data-testid="savings-balance"
              >
                {formatMoney(savings)}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-wf-gray-300 pt-2">
            <span className="text-xs text-wf-gray-700">{copy.debitCard}</span>
            <span
              data-testid="card-status"
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                cardStatus === 'Active'
                  ? 'bg-ok/15 text-ok'
                  : 'bg-err/15 text-err'
              }`}
            >
              {cardStatus === 'Active' ? copy.cardActive : copy.cardLocked}
            </span>
          </div>
        </section>

        <section>
          <h2 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-wf-gray-700">
            {copy.fargoUpdates}
          </h2>
          <ul className="space-y-1.5">
            {updates.length === 0 ? (
              <li className="rounded-lg border border-dashed border-wf-gray-300 bg-wf-white px-3 py-2 text-xs text-wf-gray-700">
                {copy.fargoUpdatesEmpty}
              </li>
            ) : (
              updates.map((u, i) => (
                <li
                  key={`${u}-${i}`}
                  className="rounded-lg border border-wf-gray-300 bg-wf-white px-3 py-2 text-xs text-wf-ink"
                >
                  {u}
                </li>
              ))
            )}
          </ul>
        </section>

        <section>
          <h2 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-wf-gray-700">
            {copy.recentTransactions}
          </h2>
          <ul className="overflow-hidden rounded-xl border border-wf-gray-300 bg-wf-white">
            {transactions.slice(0, 6).map((tx) => (
              <li
                key={tx.id}
                className="flex items-center justify-between border-b border-wf-gray-300/70 px-3 py-2 text-xs last:border-b-0"
              >
                <span className="truncate pr-2 text-wf-ink">{tx.label}</span>
                <span
                  className={`shrink-0 font-semibold ${
                    tx.amount < 0 ? 'text-wf-ink' : 'text-ok'
                  }`}
                >
                  {formatMoney(tx.amount)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
