import { eventBus } from '@/bus/eventBus';
import { useAccountsStore } from '@/store/accounts';
import { useActivityStore } from '@/store/activity';
import { requestPaydayApproval, useAgentsStore } from '@/store/agents';
import { useChatStore } from '@/store/chat';
import { useEventsStore } from '@/store/events';
import { usePhoneUiStore } from '@/store/phoneUi';
import { useSessionStore } from '@/store/session';
import { useSettingsStore } from '@/store/settings';
import { resetTransport } from '@/transport/createTransport';
import {
  DEMO_EVENT_CATALOG,
  type DemoEventKey,
  type DemoParams,
} from './demoEvents';
import { formatMoney } from './accounts';

export interface PublishResult {
  key: DemoEventKey;
  summary: string;
}

function num(params: DemoParams, key: string, fallback: number): number {
  const v = params[key];
  return typeof v === 'number' ? v : Number(v) || fallback;
}

function str(params: DemoParams, key: string, fallback: string): string {
  const v = params[key];
  return typeof v === 'string' && v.trim() ? v : fallback;
}

function notifyCustomer(opts: {
  title: string;
  body: string;
  targetTab?: 'home' | 'agents' | 'activity' | 'chat';
  activityType?: 'notification' | 'account' | 'system';
}): void {
  usePhoneUiStore.getState().showPush({
    title: opts.title,
    body: opts.body,
    targetTab: opts.targetTab ?? 'home',
  });
  useActivityStore.getState().add({
    type: opts.activityType ?? 'notification',
    title: opts.title,
    detail: opts.body,
  });
  eventBus.publish({
    type: 'notification',
    direction: 'notification',
    summary: opts.title,
    payload: opts,
  });
}

/** Publish a demo console event → bus + mock engine side effects. */
export function publishDemoEvent(
  key: DemoEventKey,
  params: DemoParams = {},
): PublishResult {
  const def = DEMO_EVENT_CATALOG.find((e) => e.key === key);
  const title = def?.title ?? key;
  let summary = title;

  switch (key) {
    case 'PayrollDeposit': {
      const amount = num(params, 'amount', 4200);
      useAccountsStore
        .getState()
        .creditChecking(amount, `Payroll deposit ${formatMoney(amount)}`);
      usePhoneUiStore
        .getState()
        .pushUpdate(`Payroll ${formatMoney(amount)} posted`);
      summary = `Payroll deposit ${formatMoney(amount)}`;
      eventBus.publish({
        type: 'bank.event',
        direction: 'event',
        summary,
        payload: { key, amount },
      });
      notifyCustomer({
        title: 'Payroll deposited',
        body: `${formatMoney(amount)} is in checking.`,
        targetTab: 'home',
      });
      usePhoneUiStore.getState().setStatusPill('Checking your agents’ rules…');
      window.setTimeout(() => {
        usePhoneUiStore.getState().setStatusPill(null);
        requestPaydayApproval(amount);
        usePhoneUiStore.getState().showPush({
          title: 'Payday sweep',
          body: 'Needs your approval to move $500 to savings.',
          targetTab: 'agents',
        });
      }, 500);
      break;
    }

    case 'RentPayment': {
      const amount = num(params, 'amount', 1850);
      useAccountsStore.getState().debitChecking(amount, 'Rent payment');
      summary = `Rent payment ${formatMoney(amount)}`;
      eventBus.publish({
        type: 'bank.event',
        direction: 'event',
        summary,
        payload: { key, amount },
      });
      notifyCustomer({
        title: 'Rent paid',
        body: `${formatMoney(amount)} left checking.`,
      });
      break;
    }

    case 'LargeTransferOut': {
      const amount = num(params, 'amount', 2500);
      useAccountsStore.getState().debitChecking(amount, 'Large transfer out');
      summary = `Large transfer out ${formatMoney(amount)}`;
      eventBus.publish({
        type: 'bank.event',
        direction: 'event',
        summary,
        payload: { key, amount },
      });
      notifyCustomer({
        title: 'Transfer sent',
        body: `${formatMoney(amount)} transferred out.`,
      });
      break;
    }

    case 'CardChargeAbroad': {
      const amount = num(params, 'amount', 220);
      const merchant = str(params, 'merchant', 'Paris Boutique');
      const country = str(params, 'country', 'FR');
      const traveling = useAccountsStore.getState().isTraveling;
      summary = `Card charge abroad ${merchant} (${country}) ${formatMoney(amount)}`;
      eventBus.publish({
        type: 'bank.event',
        direction: 'event',
        summary,
        payload: { key, amount, merchant, country, traveling },
      });

      if (!traveling) {
        useAccountsStore.getState().setCardStatus('Locked');
        useAgentsStore.getState().markRun('foreign-charge', 'locked_card');
        usePhoneUiStore.getState().pushUpdate('Debit card locked — foreign charge');
        notifyCustomer({
          title: 'Card locked',
          body: `Foreign charge at ${merchant} (${country}). Card locked.`,
          targetTab: 'home',
        });
        eventBus.publish({
          type: 'agent.action',
          direction: 'agent',
          summary: 'Foreign charge guard locked card',
          payload: { agentId: 'foreign-charge', action: 'lock_card' },
        });
        useActivityStore.getState().add({
          type: 'agent',
          title: 'Foreign charge guard',
          detail: `Locked card after ${merchant} / ${country}.`,
        });
      } else {
        useAccountsStore.getState().debitChecking(amount, `${merchant} (${country})`);
        notifyCustomer({
          title: 'Foreign charge',
          body: `${formatMoney(amount)} at ${merchant} while traveling.`,
        });
      }
      break;
    }

    case 'CardDeclined': {
      const merchant = str(params, 'merchant', 'FuelStop');
      const amount = num(params, 'amount', 65);
      summary = `Card declined at ${merchant}`;
      eventBus.publish({
        type: 'bank.event',
        direction: 'event',
        summary,
        payload: { key, merchant, amount },
      });
      notifyCustomer({
        title: 'Card declined',
        body: `${formatMoney(amount)} at ${merchant} was declined.`,
        targetTab: 'activity',
      });
      break;
    }

    case 'MerchantPriceIncrease': {
      const merchant = str(params, 'merchant', 'StreamFlix');
      const amount = num(params, 'amount', 18.99);
      summary = `${merchant} price → ${formatMoney(amount)}`;
      eventBus.publish({
        type: 'bank.event',
        direction: 'event',
        summary,
        payload: { key, merchant, amount },
      });
      notifyCustomer({
        title: 'Price increase',
        body: `${merchant} is now ${formatMoney(amount)}/mo.`,
      });
      break;
    }

    case 'OverdraftFee': {
      const amount = num(params, 'amount', 35);
      useAccountsStore.getState().debitChecking(amount, 'Overdraft fee');
      summary = `Overdraft fee ${formatMoney(amount)}`;
      eventBus.publish({
        type: 'bank.event',
        direction: 'event',
        summary,
        payload: { key, amount },
      });
      notifyCustomer({
        title: 'Overdraft fee',
        body: `${formatMoney(amount)} fee applied.`,
      });
      break;
    }

    case 'LowBalance': {
      const threshold = num(params, 'threshold', 500);
      const { checking } = useAccountsStore.getState();
      if (checking >= threshold) {
        useAccountsStore
          .getState()
          .debitChecking(checking - threshold + 1, 'Low-balance adjustment');
      }
      useAgentsStore.getState().markRun('low-balance', 'alerted');
      summary = `Low balance (< ${formatMoney(threshold)})`;
      eventBus.publish({
        type: 'bank.event',
        direction: 'event',
        summary,
        payload: { key, threshold, checking: useAccountsStore.getState().checking },
      });
      notifyCustomer({
        title: 'Low balance',
        body: `Checking is below ${formatMoney(threshold)}.`,
        targetTab: 'home',
      });
      break;
    }

    case 'BillDue': {
      const label = str(params, 'label', 'Electric');
      const amount = num(params, 'amount', 120);
      summary = `Bill due: ${label} ${formatMoney(amount)}`;
      eventBus.publish({
        type: 'bank.event',
        direction: 'event',
        summary,
        payload: { key, label, amount },
      });
      notifyCustomer({
        title: 'Bill due',
        body: `${label} bill ${formatMoney(amount)} is coming due.`,
        targetTab: 'activity',
      });
      break;
    }

    case 'SchedulerMonday': {
      summary = 'Scheduler: Monday 9:00';
      eventBus.publish({
        type: 'scheduler.tick',
        direction: 'schedule',
        summary,
        payload: { key, cron: '0 9 * * 1' },
      });
      useAgentsStore.getState().forceRun('bill-reader');
      break;
    }

    case 'SchedulerFriday': {
      summary = 'Scheduler: Friday 9:00';
      eventBus.publish({
        type: 'scheduler.tick',
        direction: 'schedule',
        summary,
        payload: { key, cron: '0 9 * * 5' },
      });
      notifyCustomer({
        title: 'Friday check-in',
        body: 'Agents reviewed weekend spending patterns.',
        targetTab: 'activity',
      });
      break;
    }

    case 'SchedulerCustom': {
      const cron = str(params, 'cron', '0 9 * * 1');
      summary = `Scheduler: ${cron}`;
      eventBus.publish({
        type: 'scheduler.tick',
        direction: 'schedule',
        summary,
        payload: { key, cron },
      });
      notifyCustomer({
        title: 'Custom schedule',
        body: `Fired cron ${cron}.`,
        targetTab: 'activity',
      });
      break;
    }

    case 'CustomerTraveling': {
      useAccountsStore.getState().setTraveling(true);
      summary = 'Customer is traveling';
      eventBus.publish({
        type: 'bank.event',
        direction: 'event',
        summary,
        payload: { key, isTraveling: true },
      });
      notifyCustomer({
        title: 'Travel mode on',
        body: 'Foreign charges will be allowed while traveling.',
      });
      break;
    }

    case 'ChangePage': {
      const currentPageId = str(params, 'currentPageId', 'ACCOUNT_SUMMARY_REACT');
      useSessionStore.getState().patchCustomerContext({ currentPageId });
      summary = `Page → ${currentPageId}`;
      eventBus.publish({
        type: 'bank.event',
        direction: 'event',
        summary,
        payload: { key, currentPageId },
      });
      break;
    }

    case 'ReopenApp': {
      summary = 'Reopen app (new session)';
      eventBus.publish({
        type: 'bank.event',
        direction: 'event',
        summary,
        payload: { key },
      });
      void useChatStore.getState().restartWithLanguage();
      break;
    }

    case 'ChatInit': {
      summary = 'Send INIT';
      eventBus.publish({
        type: 'bank.event',
        direction: 'event',
        summary,
        payload: { key },
      });
      useChatStore.getState().resetChat();
      void useChatStore.getState().sendInit();
      usePhoneUiStore.getState().setActiveTab('chat');
      break;
    }

    case 'ChatUtterance': {
      const message = str(params, 'message', "What's my balance?");
      summary = `Chat utterance: ${message}`;
      eventBus.publish({
        type: 'bank.event',
        direction: 'event',
        summary,
        payload: { key, message },
      });
      usePhoneUiStore.getState().setActiveTab('chat');
      void useChatStore.getState().sendText(message);
      break;
    }

    case 'ChatError': {
      summary = 'Trigger error response';
      eventBus.publish({
        type: 'bank.event',
        direction: 'event',
        summary,
        payload: { key },
      });
      usePhoneUiStore.getState().setActiveTab('chat');
      void useChatStore.getState().sendText('trigger error please');
      break;
    }

    case 'PermissionDenial': {
      summary = 'Permission denial (payday-sweep)';
      eventBus.publish({
        type: 'bank.event',
        direction: 'event',
        summary,
        payload: { key },
      });
      useAgentsStore.getState().forceRun('payday-sweep', { denyPermission: true });
      break;
    }

    default: {
      summary = `Unhandled event ${key}`;
      eventBus.publish({
        type: 'bank.event',
        direction: 'event',
        summary,
        payload: { key, params },
      });
    }
  }

  return { key, summary };
}

/** Reset all demo state and re-INIT. Returns elapsed ms (target &lt; 1000). */
export async function resetDemoState(): Promise<number> {
  const started = performance.now();
  useSettingsStore.getState().resetSettings();
  // Fast INIT so reset stays under the 1s acceptance gate
  useSettingsStore.getState().setDemoPacing(false);
  useEventsStore.getState().clear();
  useAccountsStore.getState().resetAccounts();
  useAgentsStore.getState().resetAgents();
  useActivityStore.getState().resetActivity();
  usePhoneUiStore.getState().resetPhoneUi();
  useSessionStore.getState().resetSession();
  resetTransport();
  useChatStore.getState().resetChat();
  await useChatStore.getState().sendInit();
  useSettingsStore.getState().setDemoPacing(true);
  return performance.now() - started;
}
