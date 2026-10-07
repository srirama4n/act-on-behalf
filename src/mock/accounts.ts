export type CardStatus = 'Active' | 'Locked';

export interface Transaction {
  id: string;
  label: string;
  amount: number;
  at: number;
}

export interface AccountsState {
  checking: number;
  savings: number;
  cardStatus: CardStatus;
  transactions: Transaction[];
  isTraveling: boolean;
}

export const INITIAL_ACCOUNTS: AccountsState = {
  checking: 2450,
  savings: 8120.5,
  cardStatus: 'Active',
  isTraveling: false,
  transactions: [
    {
      id: 'tx-rent',
      label: 'Rent — Harbor Apts',
      amount: -1850,
      at: Date.now() - 1000 * 60 * 60 * 24 * 3,
    },
    {
      id: 'tx-grocery',
      label: 'Market Street Market',
      amount: -64.2,
      at: Date.now() - 1000 * 60 * 60 * 24,
    },
    {
      id: 'tx-coffee',
      label: 'Cafe Norte',
      amount: -5.75,
      at: Date.now() - 1000 * 60 * 60 * 5,
    },
  ],
};

export function formatMoney(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}
