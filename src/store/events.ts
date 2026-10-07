import { create } from 'zustand';
import { eventBus, type BusEvent } from '@/bus/eventBus';

interface EventsState {
  items: BusEvent[];
  paused: boolean;
  selectedId: string | null;
  highlightToken: string | null;
  hydrateFromBus: () => void;
  append: (event: BusEvent) => void;
  setPaused: (paused: boolean) => void;
  select: (id: string | null) => void;
  setHighlightToken: (token: string | null) => void;
  clear: () => void;
}

let subscribed = false;

export const useEventsStore = create<EventsState>((set, get) => ({
  items: [],
  paused: false,
  selectedId: null,
  highlightToken: null,
  hydrateFromBus: () => {
    set({ items: [...eventBus.getHistory()] });
  },
  append: (event) => {
    if (get().paused) return;
    set((s) => ({ items: [event, ...s.items] }));
  },
  setPaused: (paused) => {
    if (!paused) {
      set({ paused: false, items: [...eventBus.getHistory()] });
      return;
    }
    set({ paused: true });
  },
  select: (selectedId) => set({ selectedId }),
  setHighlightToken: (highlightToken) => set({ highlightToken }),
  clear: () => {
    eventBus.clear();
    set({ items: [], selectedId: null, highlightToken: null });
  },
}));

/** Ensure the events store mirrors the bus (safe to call once at app boot). */
export function ensureEventsBusSubscription(): void {
  if (subscribed) return;
  subscribed = true;
  eventBus.subscribe((event) => {
    useEventsStore.getState().append(event);
  });
}
