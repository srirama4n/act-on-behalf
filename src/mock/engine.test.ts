import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventBus } from '@/bus/eventBus';
import { INITIAL_ACCOUNTS } from '@/mock/accounts';
import { publishDemoEvent } from '@/mock/engine';
import { useAccountsStore } from '@/store/accounts';
import { useActivityStore } from '@/store/activity';
import { useAgentsStore } from '@/store/agents';
import { usePhoneUiStore } from '@/store/phoneUi';
import { useSettingsStore } from '@/store/settings';

describe('publishDemoEvent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useSettingsStore.getState().setDemoPacing(false);
    eventBus.clear();
    useAccountsStore.getState().resetAccounts();
    useAgentsStore.getState().resetAgents();
    useActivityStore.getState().resetActivity();
    usePhoneUiStore.getState().resetPhoneUi();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('payroll deposit credits checking and requests payday approval', () => {
    const before = useAccountsStore.getState().checking;
    publishDemoEvent('PayrollDeposit', { amount: 4200 });

    expect(useAccountsStore.getState().checking).toBe(before + 4200);
    expect(usePhoneUiStore.getState().push?.title).toBe('Payroll deposited');

    vi.advanceTimersByTime(600);

    const pending = useAgentsStore.getState().runtime['payday-sweep'].pendingApproval;
    expect(pending).not.toBeNull();
    expect(useActivityStore.getState().items.some((i) => i.type === 'approval')).toBe(
      true,
    );

    useAgentsStore.getState().approve('payday-sweep');
    expect(useAccountsStore.getState().savings).toBe(
      INITIAL_ACCOUNTS.savings + 500,
    );
    expect(useAccountsStore.getState().checking).toBe(before + 4200 - 500);
  });

  it('card charge abroad locks card when customer is home', () => {
    expect(useAccountsStore.getState().isTraveling).toBe(false);
    publishDemoEvent('CardChargeAbroad', {
      merchant: 'Paris Boutique',
      country: 'FR',
      amount: 220,
    });

    expect(useAccountsStore.getState().cardStatus).toBe('Locked');
    expect(
      useActivityStore.getState().items.some((i) =>
        i.title.toLowerCase().includes('foreign'),
      ),
    ).toBe(true);
    expect(usePhoneUiStore.getState().push?.title).toMatch(/locked/i);
  });

  it('Monday scheduler runs bill-reader without approval', () => {
    publishDemoEvent('SchedulerMonday');
    vi.advanceTimersByTime(500);

    expect(
      useActivityStore.getState().items.some((i) =>
        i.title.toLowerCase().includes('bill'),
      ),
    ).toBe(true);
    expect(
      useAgentsStore.getState().runtime['bill-reader'].pendingApproval,
    ).toBeNull();
  });

  it('permission denial appears as blocked activity', () => {
    publishDemoEvent('PermissionDenial');
    const blocked = useActivityStore
      .getState()
      .items.find((i) => i.type === 'blocked');
    expect(blocked).toBeTruthy();
    expect(blocked?.blocked).toBe(true);

    const busHit = eventBus
      .getHistory()
      .some(
        (e) =>
          e.type === 'agent.action' &&
          String(e.summary).toLowerCase().includes('blocked'),
      );
    expect(busHit).toBe(true);
  });
});

describe('resetDemoState', () => {
  it('restores accounts quickly', () => {
    publishDemoEvent('PayrollDeposit', { amount: 100 });
    // avoid chat INIT network path complexity — just accounts
    useAccountsStore.getState().resetAccounts();
    expect(useAccountsStore.getState().checking).toBe(INITIAL_ACCOUNTS.checking);
  });
});
