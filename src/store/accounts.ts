import { create } from 'zustand';
import {
  INITIAL_ACCOUNTS,
  type AccountsState,
  type Transaction,
} from '@/mock/accounts';

interface AccountsStore extends AccountsState {
  setBalances: (checking: number, savings: number) => void;
  creditChecking: (amount: number, label: string) => void;
  debitChecking: (amount: number, label: string) => void;
  transferCheckingToSavings: (amount: number, label: string) => void;
  setCardStatus: (cardStatus: AccountsState['cardStatus']) => void;
  setTraveling: (isTraveling: boolean) => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'at'> & { id?: string }) => void;
  resetAccounts: () => void;
}

export const useAccountsStore = create<AccountsStore>((set) => ({
  ...INITIAL_ACCOUNTS,
  setBalances: (checking, savings) => set({ checking, savings }),
  creditChecking: (amount, label) =>
    set((s) => ({
      checking: round2(s.checking + amount),
      transactions: [
        {
          id: `tx-${Date.now()}`,
          label,
          amount,
          at: Date.now(),
        },
        ...s.transactions,
      ],
    })),
  debitChecking: (amount, label) =>
    set((s) => ({
      checking: round2(s.checking - amount),
      transactions: [
        {
          id: `tx-${Date.now()}`,
          label,
          amount: -Math.abs(amount),
          at: Date.now(),
        },
        ...s.transactions,
      ],
    })),
  transferCheckingToSavings: (amount, label) =>
    set((s) => ({
      checking: round2(s.checking - amount),
      savings: round2(s.savings + amount),
      transactions: [
        {
          id: `tx-${Date.now()}`,
          label,
          amount: -Math.abs(amount),
          at: Date.now(),
        },
        ...s.transactions,
      ],
    })),
  setCardStatus: (cardStatus) => set({ cardStatus }),
  setTraveling: (isTraveling) => set({ isTraveling }),
  addTransaction: (tx) =>
    set((s) => ({
      transactions: [
        {
          id: tx.id ?? `tx-${Date.now()}`,
          label: tx.label,
          amount: tx.amount,
          at: Date.now(),
        },
        ...s.transactions,
      ],
    })),
  resetAccounts: () => set({ ...INITIAL_ACCOUNTS, transactions: [...INITIAL_ACCOUNTS.transactions] }),
}));

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
