import { globalRuntimeBus } from './runtimeBus';
import type { RuntimeEvent } from '../contracts/runtimeEvent';

class TimelineEngine {
  private timelineCache: RuntimeEvent[] = [];
  private readonly MAX_TIMELINE_SIZE = 100; // Keep local rolling buffer small

  constructor() {
    // Subscribe to all incoming bus events
    globalRuntimeBus.subscribe('*', (event) => {
      this.timelineCache.push(event);

      // Enforce FIFO limit
      if (this.timelineCache.length > this.MAX_TIMELINE_SIZE) {
        this.timelineCache.shift();
      }
    });
  }

  getChronologicalTimeline(): RuntimeEvent[] {
    // Return sorted newest first
    return [...this.timelineCache].reverse();
  }

  getWorkspaceTimeline(workspace: string): RuntimeEvent[] {
    return this.timelineCache
      .filter(e => e.workspace === workspace)
      .reverse();
  }

  clear() {
    this.timelineCache = [];
  }

  async replayEvents(sequence: RuntimeEvent[], speedMultiplier = 1.0) {
    // 1. Pause the live telemetry generator feed temporarily
    const { mockRuntimeFeed } = await import('../mock/mockRuntimeFeed');
    mockRuntimeFeed.pause();

    console.log(`[TIMELINE REPLAY] Initiating playback of ${sequence.length} events...`);
    this.clear();

    for (let i = 0; i < sequence.length; i++) {
      const event = sequence[i];
      // Simulated interval between event playbacks scaled by multiplier
      const delay = 1500 / speedMultiplier;

      await new Promise(resolve => setTimeout(resolve, delay));

      // Re-publish the historical event through the global bus
      const { globalRuntimeBus } = await import('./runtimeBus');
      globalRuntimeBus.publish({
        ...event,
        event_id: `${event.event_id}-replay-${Date.now()}` // demarcate replayed events
      });
    }

    console.log('[TIMELINE REPLAY] Chronological sequence complete. Resuming live feed.');
    mockRuntimeFeed.resume();
  }
}

export const globalTimelineEngine = new TimelineEngine();
export default globalTimelineEngine;
