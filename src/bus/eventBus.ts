import { v4 as uuidv4 } from 'uuid';

export type BusEventType =
  | 'chat.request'
  | 'chat.response'
  | 'bank.event'
  | 'scheduler.tick'
  | 'notification'
  | 'agent.action'
  | 'contract.violation';

export type BusDirection =
  | 'request'
  | 'response'
  | 'event'
  | 'schedule'
  | 'notification'
  | 'agent';

export interface BusEvent<T = unknown> {
  id: string;
  type: BusEventType;
  direction: BusDirection;
  timestamp: number;
  summary: string;
  payload: T;
  correlationId?: string;
  latencyMs?: number;
  violations?: string[];
}

type Handler = (event: BusEvent) => void;

class EventBus {
  private handlers = new Set<Handler>();
  private history: BusEvent[] = [];

  publish<T>(
    partial: Omit<BusEvent<T>, 'id' | 'timestamp'> & {
      id?: string;
      timestamp?: number;
    },
  ): BusEvent<T> {
    const event: BusEvent<T> = {
      id: partial.id ?? uuidv4(),
      timestamp: partial.timestamp ?? Date.now(),
      type: partial.type,
      direction: partial.direction,
      summary: partial.summary,
      payload: partial.payload,
      correlationId: partial.correlationId,
      latencyMs: partial.latencyMs,
      violations: partial.violations,
    };
    this.history.unshift(event);
    for (const handler of this.handlers) {
      handler(event as BusEvent);
    }
    return event;
  }

  subscribe(handler: Handler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  getHistory(): readonly BusEvent[] {
    return this.history;
  }

  clear(): void {
    this.history = [];
  }
}

/** Singleton bus — Stream tab (Phase 4) subscribes; nothing happens without a publish. */
export const eventBus = new EventBus();
