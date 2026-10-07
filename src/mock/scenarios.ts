import type { DemoEventKey, DemoParams } from './demoEvents';

export interface ScenarioStep {
  key: DemoEventKey;
  params?: DemoParams;
  label: string;
  delayMs?: number;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  steps: ScenarioStep[];
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'payday',
    title: 'Payday story',
    description: 'Payroll posts, sweep asks for approval, then optional low-balance check.',
    steps: [
      {
        key: 'PayrollDeposit',
        params: { amount: 4200 },
        label: 'Payroll $4,200',
      },
      {
        key: 'LowBalance',
        params: { threshold: 500 },
        label: 'Simulate low-balance alert',
        delayMs: 1200,
      },
    ],
  },
  {
    id: 'travel',
    title: 'Travel story',
    description: 'Foreign charge while home locks the card; then travel mode on.',
    steps: [
      {
        key: 'CardChargeAbroad',
        params: { merchant: 'Paris Boutique', country: 'FR', amount: 220 },
        label: 'Foreign charge while home',
      },
      {
        key: 'CustomerTraveling',
        label: 'Start traveling',
        delayMs: 900,
      },
      {
        key: 'CardChargeAbroad',
        params: { merchant: 'Cafe Roma', country: 'IT', amount: 42 },
        label: 'Foreign charge while traveling',
        delayMs: 900,
      },
    ],
  },
  {
    id: 'monday-bills',
    title: 'Monday bills',
    description: 'Scheduler Monday 9:00 runs bill reader with no approval.',
    steps: [
      { key: 'SchedulerMonday', label: 'Fire Monday 9:00' },
      {
        key: 'BillDue',
        params: { label: 'Water', amount: 48 },
        label: 'Extra bill-due alert',
        delayMs: 800,
      },
    ],
  },
  {
    id: 'error-recovery',
    title: 'Error recovery',
    description: 'Trigger an error response, then a healthy balance ask.',
    steps: [
      { key: 'ChatError', label: 'Trigger error' },
      {
        key: 'ChatUtterance',
        params: { message: "What's my balance?" },
        label: 'Ask for balance',
        delayMs: 1000,
      },
    ],
  },
];
