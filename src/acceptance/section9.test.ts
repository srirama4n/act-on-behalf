/**
 * SPEC §9 acceptance flows — exercised via stores/engine (demo contract).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventBus } from '@/bus/eventBus';
import {
  buildInitRequest,
  buildRequestFromAction,
  buildTextRequest,
  createSessionIds,
  emptyChannelData,
} from '@/contracts/builders';
import { INITIAL_ACCOUNTS } from '@/mock/accounts';
import { publishDemoEvent, resetDemoState } from '@/mock/engine';
import { resolveMockResponse } from '@/mock/responders';
import { useAccountsStore } from '@/store/accounts';
import { useActivityStore } from '@/store/activity';
import { useAgentsStore } from '@/store/agents';
import { useChatStore } from '@/store/chat';
import { useEventsStore } from '@/store/events';
import { ensureEventsBusSubscription } from '@/store/events';
import { usePhoneUiStore } from '@/store/phoneUi';
import { useSessionStore } from '@/store/session';
import { useSettingsStore } from '@/store/settings';
import { resetTransport } from '@/transport/createTransport';

describe('SPEC §9 acceptance flows', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    ensureEventsBusSubscription();
    useSettingsStore.getState().resetSettings();
    useSettingsStore.getState().setDemoPacing(false);
    useEventsStore.getState().clear();
    useAccountsStore.getState().resetAccounts();
    useAgentsStore.getState().resetAgents();
    useActivityStore.getState().resetActivity();
    usePhoneUiStore.getState().resetPhoneUi();
    useSessionStore.getState().resetSession();
    useChatStore.getState().resetChat();
    resetTransport();
    eventBus.clear();
    useEventsStore.getState().clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('1. Launch INIT welcome has greeting, 4 QRBs, disclosure', async () => {
    await useChatStore.getState().sendInit();
    const items = useChatStore.getState().items;
    const assistant = items.find((i) => i.kind === 'assistant');
    expect(assistant?.kind).toBe('assistant');
    if (assistant?.kind !== 'assistant') return;
    expect(assistant.message.message).toMatch(/Hola|Hi/i);
    const qrb = assistant.message.richMessages.find(
      (r) => r.responseType === 'QRB_LIST',
    );
    expect(qrb?.responseType).toBe('QRB_LIST');
    if (qrb?.responseType === 'QRB_LIST') {
      expect(qrb.data.buttons).toHaveLength(4);
    }
    const disclosure = assistant.message.richMessages.find(
      (r) => r.responseType === 'SYSTEM_MESSAGE',
    );
    expect(disclosure).toBeTruthy();
    expect(
      eventBus.getHistory().some((e) => e.type === 'chat.request'),
    ).toBe(true);
    expect(
      eventBus.getHistory().some((e) => e.type === 'chat.response'),
    ).toBe(true);
  });

  it('2. QRB balance request carries typedUtterance false + uiElementID', () => {
    const session = createSessionIds();
    const request = buildRequestFromAction({
      session,
      language: 'es',
      action: {
        id: 'a1',
        replyTo: 'sys',
        messageType: 'TEXT',
        message: null,
      },
      channelData: emptyChannelData({
        title: '¿Cuál es mi saldo?',
        goldenUtterance: '¿Cuál es mi saldo?',
        custom: { uiElementID: 'qrb.WhatsMyBalance' },
      }),
    });
    expect(request.jsonString.typedUtterance).toBe(false);
    expect(request.jsonString.channelData.custom?.uiElementID).toBe(
      'qrb.WhatsMyBalance',
    );
    const response = resolveMockResponse({
      request,
      session,
      language: 'es',
    });
    expect(response.jsonString.messages[0].custom.responseID).toBe(
      'qrb.WhatsMyBalance',
    );
  });

  it('3. Typed message is TEXT with typedUtterance true', () => {
    const request = buildTextRequest({
      session: createSessionIds(),
      language: 'en',
      message: 'hello',
    });
    expect(request.jsonString.typedUtterance).toBe(true);
    expect(request.jsonString.messageType).toBe('TEXT');
  });

  it('4. Language EN restarts with English welcome chips', async () => {
    useSettingsStore.getState().setLanguage('en');
    await useChatStore.getState().restartWithLanguage();
    const assistant = useChatStore
      .getState()
      .items.find((i) => i.kind === 'assistant');
    expect(assistant?.kind).toBe('assistant');
    if (assistant?.kind !== 'assistant') return;
    const qrb = assistant.message.richMessages.find(
      (r) => r.responseType === 'QRB_LIST',
    );
    if (qrb?.responseType === 'QRB_LIST') {
      expect(qrb.data.buttons[0].channelData.title).toMatch(/balance/i);
    }
    const lastReq = useChatStore.getState().lastRequest;
    expect(lastReq?.headers.Language_Preference).toBe('en');
    expect(lastReq?.jsonString.customerContext.languagePreference).toBe('en');
  });

  it('5. Payroll → balance, push, approval, approve moves money', async () => {
    const before = useAccountsStore.getState().checking;
    publishDemoEvent('PayrollDeposit', { amount: 4200 });
    expect(useAccountsStore.getState().checking).toBe(before + 4200);
    expect(usePhoneUiStore.getState().push?.title).toMatch(/payroll/i);

    await vi.advanceTimersByTimeAsync(600);
    expect(
      useAgentsStore.getState().runtime['payday-sweep'].pendingApproval,
    ).not.toBeNull();

    useAgentsStore.getState().approve('payday-sweep');
    expect(useAccountsStore.getState().savings).toBe(
      INITIAL_ACCOUNTS.savings + 500,
    );
    expect(
      useActivityStore.getState().items.some((i) => i.type === 'approval'),
    ).toBe(true);
    expect(
      eventBus.getHistory().some((e) => e.type === 'bank.event'),
    ).toBe(true);
  });

  it('6. Card abroad while home locks card + activity', () => {
    publishDemoEvent('CardChargeAbroad', {
      merchant: 'Paris Boutique',
      country: 'FR',
      amount: 220,
    });
    expect(useAccountsStore.getState().cardStatus).toBe('Locked');
    expect(usePhoneUiStore.getState().push).toBeTruthy();
    expect(
      useActivityStore.getState().items.some((i) =>
        i.title.toLowerCase().includes('foreign'),
      ),
    ).toBe(true);
  });

  it('7. Monday scheduler bill-reader with no approval', async () => {
    publishDemoEvent('SchedulerMonday');
    await vi.advanceTimersByTimeAsync(500);
    expect(
      useAgentsStore.getState().runtime['bill-reader'].pendingApproval,
    ).toBeNull();
    expect(
      useActivityStore.getState().items.some((i) =>
        i.title.toLowerCase().includes('bill'),
      ),
    ).toBe(true);
  });

  it('8. Permission denial is blocked in Activity and Stream payload', () => {
    publishDemoEvent('PermissionDenial');
    const blocked = useActivityStore
      .getState()
      .items.find((i) => i.type === 'blocked');
    expect(blocked?.blocked).toBe(true);
    const bus = eventBus
      .getHistory()
      .find(
        (e) =>
          e.type === 'agent.action' &&
          String(e.summary).toUpperCase().includes('BLOCKED'),
      );
    expect(bus).toBeTruthy();
    expect((bus?.payload as { action?: string }).action).toBe('blocked');
  });

  it('9. Error response surfaces errorCode for retry UI', () => {
    const session = createSessionIds();
    const request = buildInitRequest({ session, language: 'en' });
    // force error path via keyword
    const errReq = buildTextRequest({
      session,
      language: 'en',
      message: 'trigger error please',
    });
    const response = resolveMockResponse({
      request: errReq,
      session,
      language: 'en',
    });
    expect(response.jsonString.messages[0].error.errorCode).toBeTruthy();
    void request;
  });

  it('10. Reset demo restores accounts in under 1s', async () => {
    vi.useRealTimers();
    useSettingsStore.getState().setDemoPacing(false);
    publishDemoEvent('PayrollDeposit', { amount: 100 });
    const ms = await resetDemoState();
    expect(ms).toBeLessThan(1000);
    expect(useAccountsStore.getState().checking).toBe(INITIAL_ACCOUNTS.checking);
    expect(useChatStore.getState().initialized).toBe(true);
  });
});
