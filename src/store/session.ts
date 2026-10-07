import { create } from 'zustand';
import {
  createSessionIds,
  DEFAULT_BUILDER_DEFAULTS,
  type SessionIds,
} from '@/contracts/builders';
import type { CustomerContext, LangPref } from '@/contracts/chatService';

interface SessionState {
  session: SessionIds;
  customerName: string;
  customerContext: Omit<CustomerContext, 'timeStamp' | 'languagePreference'>;
  launchSourceName: string;
  startNewSession: () => SessionIds;
  setCustomerName: (name: string) => void;
  patchCustomerContext: (
    patch: Partial<Omit<CustomerContext, 'timeStamp' | 'languagePreference'>>,
  ) => void;
  setLaunchSourceName: (name: string) => void;
  resetSession: () => void;
}

const fresh = () => ({
  session: createSessionIds(),
  customerName: 'SamA',
  customerContext: { ...DEFAULT_BUILDER_DEFAULTS.customerContext },
  launchSourceName: 'NAV_ICON',
});

export const useSessionStore = create<SessionState>((set) => ({
  ...fresh(),
  startNewSession: () => {
    const session = createSessionIds();
    set({ session });
    return session;
  },
  setCustomerName: (customerName) => set({ customerName }),
  patchCustomerContext: (patch) =>
    set((s) => ({
      customerContext: { ...s.customerContext, ...patch },
    })),
  setLaunchSourceName: (launchSourceName) => set({ launchSourceName }),
  resetSession: () => set(fresh()),
}));

export function sessionLanguageFields(language: LangPref) {
  return { language };
}
