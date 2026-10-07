import { create } from 'zustand';
import type { PhoneTab } from '@/phone/types';

export interface PushBanner {
  id: string;
  title: string;
  body: string;
  targetTab: PhoneTab;
}

interface PhoneUiState {
  activeTab: PhoneTab;
  badges: Record<PhoneTab, number>;
  push: PushBanner | null;
  statusPill: string | null;
  fargoUpdates: string[];
  setActiveTab: (tab: PhoneTab) => void;
  bumpBadge: (tab: PhoneTab, delta?: number) => void;
  clearBadge: (tab: PhoneTab) => void;
  showPush: (banner: Omit<PushBanner, 'id'> & { id?: string }) => void;
  dismissPush: () => void;
  setStatusPill: (text: string | null) => void;
  pushUpdate: (text: string) => void;
  resetPhoneUi: () => void;
}

const emptyBadges = (): Record<PhoneTab, number> => ({
  home: 0,
  chat: 0,
  agents: 0,
  activity: 0,
});

export const usePhoneUiStore = create<PhoneUiState>((set, get) => ({
  activeTab: 'chat',
  badges: emptyBadges(),
  push: null,
  statusPill: null,
  fargoUpdates: [],

  setActiveTab: (activeTab) => {
    set({ activeTab });
    get().clearBadge(activeTab);
  },

  bumpBadge: (tab, delta = 1) =>
    set((s) => ({
      badges: {
        ...s.badges,
        [tab]: Math.max(0, s.badges[tab] + delta),
      },
    })),

  clearBadge: (tab) =>
    set((s) => ({
      badges: { ...s.badges, [tab]: 0 },
    })),

  showPush: (banner) => {
    set({
      push: {
        id: banner.id ?? `push-${Date.now()}`,
        title: banner.title,
        body: banner.body,
        targetTab: banner.targetTab,
      },
    });
    if (get().activeTab !== banner.targetTab) {
      get().bumpBadge(banner.targetTab, 1);
    }
  },

  dismissPush: () => set({ push: null }),

  setStatusPill: (statusPill) => set({ statusPill }),

  pushUpdate: (text) =>
    set((s) => ({
      fargoUpdates: [text, ...s.fargoUpdates].slice(0, 12),
    })),

  resetPhoneUi: () =>
    set({
      activeTab: 'chat',
      badges: emptyBadges(),
      push: null,
      statusPill: null,
      fargoUpdates: [],
    }),
}));
