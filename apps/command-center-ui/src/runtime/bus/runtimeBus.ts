import type { RuntimeEvent } from '../contracts/runtimeEvent';

export type SubscriptionCallback = (event: RuntimeEvent) => void;

class RuntimeBus {
  private subscribers: Record<string, SubscriptionCallback[]> = {};

  publish(event: RuntimeEvent) {
    const eventType = event.event_type;
    
    // Notify exact match subscribers
    if (this.subscribers[eventType]) {
      this.subscribers[eventType].forEach(cb => cb(event));
    }
    
    // Notify global wildcard '*' subscribers
    if (this.subscribers['*']) {
      this.subscribers['*'].forEach(cb => cb(event));
    }
  }

  subscribe(eventType: string, callback: SubscriptionCallback): () => void {
    if (!this.subscribers[eventType]) {
      this.subscribers[eventType] = [];
    }
    this.subscribers[eventType].push(callback);

    // Return a clean unsubscribe function for hooks
    return () => {
      this.unsubscribe(eventType, callback);
    };
  }

  unsubscribe(eventType: string, callback: SubscriptionCallback) {
    if (this.subscribers[eventType]) {
      this.subscribers[eventType] = this.subscribers[eventType].filter(cb => cb !== callback);
    }
  }
}

export const globalRuntimeBus = new RuntimeBus();
export default globalRuntimeBus;
