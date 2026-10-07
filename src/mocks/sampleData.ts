import type { ReviewCard } from '@/api/types';

export const PAYDAY_REVIEW: ReviewCard = {
  type: 'review_card',
  draftId: 'd_77',
  name: 'Payday sweep',
  sourceNote: 'From a bank-reviewed template, checked by bank policy',
  effectText:
    'On payday, move checking balance above $5,000 to savings (up to $5,000 per payday)',
  params: [
    { label: 'From', value: 'Checking ••4821' },
    { label: 'To', value: 'Savings ••1182' },
    { label: 'Keep in checking', value: '$5,000' },
  ],
  limits: ['Max transfer $5,000', 'Max 1 run per day'],
  mode: 'ask',
  rules: {
    name: 'Payday sweep',
    goal: 'On payday, move checking balance above $5,000 to savings',
  },
};

export const SUBSCRIPTION_REVIEW: ReviewCard = {
  type: 'review_card',
  draftId: 'd_80',
  name: 'Subscription price guard',
  sourceNote: 'From a bank-reviewed template, checked by bank policy',
  effectText:
    'When a recurring charge increases, ask before allowing future charges',
  params: [
    { label: 'Card', value: 'Debit ••9034' },
    { label: 'Merchant', value: 'StreamFlix' },
  ],
  limits: ['Alerts only for increases over 5%'],
  mode: 'ask',
  rules: {
    name: 'Subscription price guard',
    goal: 'Block or ask on recurring price increases',
  },
};
