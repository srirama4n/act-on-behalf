import { useState, type ReactNode } from 'react';
import type { LangPref } from '@/contracts/chatService';
import { useAccountsStore } from '@/store/accounts';
import { useChatStore } from '@/store/chat';
import { useSessionStore } from '@/store/session';
import { useSettingsStore } from '@/store/settings';

export function CustomerContextForm() {
  const customerName = useSessionStore((s) => s.customerName);
  const customerContext = useSessionStore((s) => s.customerContext);
  const launchSourceName = useSessionStore((s) => s.launchSourceName);
  const setCustomerName = useSessionStore((s) => s.setCustomerName);
  const patchCustomerContext = useSessionStore((s) => s.patchCustomerContext);
  const setLaunchSourceName = useSessionStore((s) => s.setLaunchSourceName);
  const startNewSession = useSessionStore((s) => s.startNewSession);

  const checking = useAccountsStore((s) => s.checking);
  const savings = useAccountsStore((s) => s.savings);
  const setBalances = useAccountsStore((s) => s.setBalances);
  const cardStatus = useAccountsStore((s) => s.cardStatus);
  const setCardStatus = useAccountsStore((s) => s.setCardStatus);
  const isTraveling = useAccountsStore((s) => s.isTraveling);
  const setTraveling = useAccountsStore((s) => s.setTraveling);

  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const resetChat = useChatStore((s) => s.resetChat);
  const sendInit = useChatStore((s) => s.sendInit);

  const [draftChecking, setDraftChecking] = useState(String(checking));
  const [draftSavings, setDraftSavings] = useState(String(savings));
  const [status, setStatus] = useState<string | null>(null);

  const applyAndRestart = () => {
    const nextChecking = Number(draftChecking);
    const nextSavings = Number(draftSavings);
    if (!Number.isNaN(nextChecking) && !Number.isNaN(nextSavings)) {
      setBalances(nextChecking, nextSavings);
    }
    startNewSession();
    resetChat();
    void sendInit();
    setStatus('Session restarted with INIT');
  };

  return (
    <div className="space-y-4 rounded-lg border border-wf-gray-300 bg-wf-white p-4">
      <div>
        <h3 className="text-sm font-semibold text-wf-ink">Customer context</h3>
        <p className="mt-0.5 text-xs text-wf-gray-700">
          Edits apply on the next request. Use Apply & restart to re-send INIT.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Customer name">
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Language preference">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as LangPref)}
            className={inputClass}
          >
            <option value="es">es</option>
            <option value="en">en</option>
          </select>
        </Field>
        <Field label="currentPageId">
          <input
            value={customerContext.currentPageId}
            onChange={(e) =>
              patchCustomerContext({ currentPageId: e.target.value })
            }
            className={inputClass}
          />
        </Field>
        <Field label="launchSourceName">
          <input
            value={launchSourceName}
            onChange={(e) => setLaunchSourceName(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="customerBranding">
          <input
            value={customerContext.customerBranding}
            onChange={(e) =>
              patchCustomerContext({ customerBranding: e.target.value })
            }
            className={inputClass}
          />
        </Field>
        <Field label="timeZone">
          <input
            value={customerContext.timeZone}
            onChange={(e) => patchCustomerContext({ timeZone: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="featuresInsightsPilot">
          <select
            value={customerContext.featuresInsightsPilot}
            onChange={(e) =>
              patchCustomerContext({
                featuresInsightsPilot: e.target.value as 'true' | 'false',
              })
            }
            className={inputClass}
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        </Field>
        <Field label="barkerPresent">
          <select
            value={customerContext.barkerPresent}
            onChange={(e) =>
              patchCustomerContext({
                barkerPresent: e.target.value as 'true' | 'false',
              })
            }
            className={inputClass}
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        </Field>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-wf-gray-700">
          Accounts
        </h4>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <Field label="Checking">
            <input
              type="number"
              value={draftChecking}
              onChange={(e) => setDraftChecking(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Savings">
            <input
              type="number"
              value={draftSavings}
              onChange={(e) => setDraftSavings(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Debit card">
            <select
              value={cardStatus}
              onChange={(e) =>
                setCardStatus(e.target.value as 'Active' | 'Locked')
              }
              className={inputClass}
            >
              <option value="Active">Active</option>
              <option value="Locked">Locked</option>
            </select>
          </Field>
          <Field label="Traveling">
            <select
              value={isTraveling ? 'true' : 'false'}
              onChange={(e) => setTraveling(e.target.value === 'true')}
              className={inputClass}
            >
              <option value="false">false</option>
              <option value="true">true</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={applyAndRestart}
          className="rounded bg-wf-red px-3 py-2 text-xs font-semibold text-wf-white hover:bg-wf-red-dark"
        >
          Apply & restart session
        </button>
        {status ? (
          <span className="text-xs text-ok">{status}</span>
        ) : null}
      </div>
    </div>
  );
}

const inputClass =
  'mt-0.5 w-full rounded border border-wf-gray-300 px-2 py-1.5 text-xs text-wf-ink';

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-[11px] font-semibold text-wf-gray-700">
      {label}
      {children}
    </label>
  );
}
