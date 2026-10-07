import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type ActivityType =
  | 'notification'
  | 'approval'
  | 'agent'
  | 'blocked'
  | 'account'
  | 'system';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  detail: string;
  at: number;
  blocked?: boolean;
}

interface ActivityState {
  items: ActivityItem[];
  add: (item: Omit<ActivityItem, 'id' | 'at'> & { at?: number; id?: string }) => void;
  clear: () => void;
  resetActivity: () => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
  items: [],
  add: (item) =>
    set((s) => ({
      items: [
        {
          id: item.id ?? uuidv4(),
          at: item.at ?? Date.now(),
          type: item.type,
          title: item.title,
          detail: item.detail,
          blocked: item.blocked,
        },
        ...s.items,
      ],
    })),
  clear: () => set({ items: [] }),
  resetActivity: () => set({ items: [] }),
}));
