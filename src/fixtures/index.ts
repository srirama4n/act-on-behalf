import type {
  ChatRequestEnvelope,
  ChatResponseEnvelope,
  LangPref,
} from '@/contracts/chatService';

import requestInitEs from './request.init.es.json';
import requestInitEn from './request.init.en.json';
import responseWelcomeEs from './response.welcome.es.json';
import responseWelcomeEn from './response.welcome.en.json';

import responseQrbBalanceEs from './response.qrb.balance.es.json';
import responseQrbBalanceEn from './response.qrb.balance.en.json';
import responseQrbTravelEs from './response.qrb.travel.es.json';
import responseQrbTravelEn from './response.qrb.travel.en.json';
import responseQrbSpendingEs from './response.qrb.spending.es.json';
import responseQrbSpendingEn from './response.qrb.spending.en.json';
import responseQrbCapabilitiesEs from './response.qrb.capabilities.es.json';
import responseQrbCapabilitiesEn from './response.qrb.capabilities.en.json';

import responseEventPayrollEs from './response.event.payroll.es.json';
import responseEventPayrollEn from './response.event.payroll.en.json';
import responseEventRentEs from './response.event.rent.es.json';
import responseEventRentEn from './response.event.rent.en.json';
import responseEventTransferOutEs from './response.event.transfer_out.es.json';
import responseEventTransferOutEn from './response.event.transfer_out.en.json';
import responseEventCardAbroadEs from './response.event.card_abroad.es.json';
import responseEventCardAbroadEn from './response.event.card_abroad.en.json';
import responseEventCardDeclinedEs from './response.event.card_declined.es.json';
import responseEventCardDeclinedEn from './response.event.card_declined.en.json';
import responseEventPriceIncreaseEs from './response.event.price_increase.es.json';
import responseEventPriceIncreaseEn from './response.event.price_increase.en.json';
import responseEventOverdraftEs from './response.event.overdraft.es.json';
import responseEventOverdraftEn from './response.event.overdraft.en.json';
import responseEventLowBalanceEs from './response.event.low_balance.es.json';
import responseEventLowBalanceEn from './response.event.low_balance.en.json';
import responseEventBillDueEs from './response.event.bill_due.es.json';
import responseEventBillDueEn from './response.event.bill_due.en.json';
import responseEventErrorEs from './response.event.error.es.json';
import responseEventErrorEn from './response.event.error.en.json';

export const initRequestByLang: Record<LangPref, ChatRequestEnvelope> = {
  es: requestInitEs as ChatRequestEnvelope,
  en: requestInitEn as ChatRequestEnvelope,
};

export const welcomeResponseByLang: Record<LangPref, ChatResponseEnvelope> = {
  es: responseWelcomeEs as ChatResponseEnvelope,
  en: responseWelcomeEn as ChatResponseEnvelope,
};

export type QrbKey =
  | 'qrb.WhatsMyBalance'
  | 'qrb.ShareMyTravelPlans'
  | 'qrb.HowsMySpending'
  | 'qrb.ShowMeWhatFargoCanDo';

export const qrbResponseById: Record<
  QrbKey,
  Record<LangPref, ChatResponseEnvelope>
> = {
  'qrb.WhatsMyBalance': {
    es: responseQrbBalanceEs as ChatResponseEnvelope,
    en: responseQrbBalanceEn as ChatResponseEnvelope,
  },
  'qrb.ShareMyTravelPlans': {
    es: responseQrbTravelEs as ChatResponseEnvelope,
    en: responseQrbTravelEn as ChatResponseEnvelope,
  },
  'qrb.HowsMySpending': {
    es: responseQrbSpendingEs as ChatResponseEnvelope,
    en: responseQrbSpendingEn as ChatResponseEnvelope,
  },
  'qrb.ShowMeWhatFargoCanDo': {
    es: responseQrbCapabilitiesEs as ChatResponseEnvelope,
    en: responseQrbCapabilitiesEn as ChatResponseEnvelope,
  },
};

export type EventFixtureKey =
  | 'PayrollDeposit'
  | 'RentPayment'
  | 'LargeTransferOut'
  | 'CardChargeAbroad'
  | 'CardDeclined'
  | 'MerchantPriceIncrease'
  | 'OverdraftFee'
  | 'LowBalance'
  | 'BillDue'
  | 'Error';

export const eventResponseByKey: Record<
  EventFixtureKey,
  Record<LangPref, ChatResponseEnvelope>
> = {
  PayrollDeposit: {
    es: responseEventPayrollEs as ChatResponseEnvelope,
    en: responseEventPayrollEn as ChatResponseEnvelope,
  },
  RentPayment: {
    es: responseEventRentEs as ChatResponseEnvelope,
    en: responseEventRentEn as ChatResponseEnvelope,
  },
  LargeTransferOut: {
    es: responseEventTransferOutEs as ChatResponseEnvelope,
    en: responseEventTransferOutEn as ChatResponseEnvelope,
  },
  CardChargeAbroad: {
    es: responseEventCardAbroadEs as ChatResponseEnvelope,
    en: responseEventCardAbroadEn as ChatResponseEnvelope,
  },
  CardDeclined: {
    es: responseEventCardDeclinedEs as ChatResponseEnvelope,
    en: responseEventCardDeclinedEn as ChatResponseEnvelope,
  },
  MerchantPriceIncrease: {
    es: responseEventPriceIncreaseEs as ChatResponseEnvelope,
    en: responseEventPriceIncreaseEn as ChatResponseEnvelope,
  },
  OverdraftFee: {
    es: responseEventOverdraftEs as ChatResponseEnvelope,
    en: responseEventOverdraftEn as ChatResponseEnvelope,
  },
  LowBalance: {
    es: responseEventLowBalanceEs as ChatResponseEnvelope,
    en: responseEventLowBalanceEn as ChatResponseEnvelope,
  },
  BillDue: {
    es: responseEventBillDueEs as ChatResponseEnvelope,
    en: responseEventBillDueEn as ChatResponseEnvelope,
  },
  Error: {
    es: responseEventErrorEs as ChatResponseEnvelope,
    en: responseEventErrorEn as ChatResponseEnvelope,
  },
};

export {
  requestInitEs,
  requestInitEn,
  responseWelcomeEs,
  responseWelcomeEn,
};
