export type DemoEventKey =
  | 'PayrollDeposit'
  | 'RentPayment'
  | 'LargeTransferOut'
  | 'CardChargeAbroad'
  | 'CardDeclined'
  | 'MerchantPriceIncrease'
  | 'OverdraftFee'
  | 'LowBalance'
  | 'BillDue'
  | 'SchedulerMonday'
  | 'SchedulerFriday'
  | 'SchedulerCustom'
  | 'CustomerTraveling'
  | 'ChangePage'
  | 'ReopenApp'
  | 'ChatInit'
  | 'ChatUtterance'
  | 'ChatError'
  | 'PermissionDenial';

export type ParamField =
  | { key: string; label: string; type: 'number'; default: number }
  | { key: string; label: string; type: 'string'; default: string };

export interface DemoEventDef {
  key: DemoEventKey;
  group: string;
  title: string;
  description: string;
  params: ParamField[];
}

export const DEMO_EVENT_CATALOG: DemoEventDef[] = [
  {
    key: 'PayrollDeposit',
    group: 'Deposits & payments',
    title: 'Payroll deposit',
    description: 'Credit checking and prompt Payday sweep for approval.',
    params: [{ key: 'amount', label: 'Amount', type: 'number', default: 4200 }],
  },
  {
    key: 'RentPayment',
    group: 'Deposits & payments',
    title: 'Rent payment',
    description: 'Debit checking for monthly rent.',
    params: [{ key: 'amount', label: 'Amount', type: 'number', default: 1850 }],
  },
  {
    key: 'LargeTransferOut',
    group: 'Deposits & payments',
    title: 'Large transfer out',
    description: 'Send a large outbound transfer from checking.',
    params: [{ key: 'amount', label: 'Amount', type: 'number', default: 2500 }],
  },
  {
    key: 'CardChargeAbroad',
    group: 'Card',
    title: 'Card charge abroad',
    description: 'Foreign charge — locks card if customer is home.',
    params: [
      { key: 'merchant', label: 'Merchant', type: 'string', default: 'Paris Boutique' },
      { key: 'country', label: 'Country', type: 'string', default: 'FR' },
      { key: 'amount', label: 'Amount', type: 'number', default: 220 },
    ],
  },
  {
    key: 'CardDeclined',
    group: 'Card',
    title: 'Card declined',
    description: 'Simulate a declined card authorization.',
    params: [
      { key: 'merchant', label: 'Merchant', type: 'string', default: 'FuelStop' },
      { key: 'amount', label: 'Amount', type: 'number', default: 65 },
    ],
  },
  {
    key: 'MerchantPriceIncrease',
    group: 'Card',
    title: 'Merchant price increase',
    description: 'Recurring merchant raised their price.',
    params: [
      { key: 'merchant', label: 'Merchant', type: 'string', default: 'StreamFlix' },
      { key: 'amount', label: 'New price', type: 'number', default: 18.99 },
    ],
  },
  {
    key: 'OverdraftFee',
    group: 'Fees & alerts',
    title: 'Overdraft fee',
    description: 'Apply a $35 overdraft fee.',
    params: [{ key: 'amount', label: 'Fee', type: 'number', default: 35 }],
  },
  {
    key: 'LowBalance',
    group: 'Fees & alerts',
    title: 'Low balance',
    description: 'Force checking below the $500 threshold.',
    params: [{ key: 'threshold', label: 'Threshold', type: 'number', default: 500 }],
  },
  {
    key: 'BillDue',
    group: 'Fees & alerts',
    title: 'Bill due',
    description: 'Post a bill-due alert to Activity.',
    params: [
      { key: 'label', label: 'Bill', type: 'string', default: 'Electric' },
      { key: 'amount', label: 'Amount', type: 'number', default: 120 },
    ],
  },
  {
    key: 'SchedulerMonday',
    group: 'Scheduler',
    title: 'Fire “Monday 9:00”',
    description: 'Bill reader posts a due reminder (no approval).',
    params: [],
  },
  {
    key: 'SchedulerFriday',
    group: 'Scheduler',
    title: 'Fire “Friday 9:00”',
    description: 'Weekend spend check-in from agents.',
    params: [],
  },
  {
    key: 'SchedulerCustom',
    group: 'Scheduler',
    title: 'Fire custom cron',
    description: 'Fire a custom schedule expression.',
    params: [
      { key: 'cron', label: 'Cron', type: 'string', default: '0 9 * * 1' },
    ],
  },
  {
    key: 'CustomerTraveling',
    group: 'Customer',
    title: 'Customer starts traveling',
    description: 'Mark customer as traveling (foreign charges allowed).',
    params: [],
  },
  {
    key: 'ChangePage',
    group: 'Customer',
    title: 'Change page',
    description: 'Update customerContext.currentPageId.',
    params: [
      {
        key: 'currentPageId',
        label: 'Page id',
        type: 'string',
        default: 'ACCOUNT_SUMMARY_REACT',
      },
    ],
  },
  {
    key: 'ReopenApp',
    group: 'Customer',
    title: 'Reopen app',
    description: 'Start a new session and re-send INIT.',
    params: [],
  },
  {
    key: 'ChatInit',
    group: 'Chat',
    title: 'Send INIT',
    description: 'Re-send the Fargo INIT / sunrise request.',
    params: [],
  },
  {
    key: 'ChatUtterance',
    group: 'Chat',
    title: 'Send utterance',
    description: 'Send an arbitrary customer message through chat.',
    params: [
      {
        key: 'message',
        label: 'Message',
        type: 'string',
        default: "What's my balance?",
      },
    ],
  },
  {
    key: 'ChatError',
    group: 'Chat',
    title: 'Trigger error response',
    description: 'Force the mock error fixture into chat.',
    params: [],
  },
  {
    key: 'PermissionDenial',
    group: 'Customer',
    title: 'Simulate permission denial',
    description: 'Force-run Payday sweep with permission denied.',
    params: [],
  },
];

export function groupCatalog(
  catalog: DemoEventDef[] = DEMO_EVENT_CATALOG,
): { group: string; events: DemoEventDef[] }[] {
  const map = new Map<string, DemoEventDef[]>();
  for (const event of catalog) {
    const list = map.get(event.group) ?? [];
    list.push(event);
    map.set(event.group, list);
  }
  return [...map.entries()].map(([group, events]) => ({ group, events }));
}

export type DemoParams = Record<string, string | number>;

export function defaultParams(def: DemoEventDef): DemoParams {
  const out: DemoParams = {};
  for (const p of def.params) out[p.key] = p.default;
  return out;
}
