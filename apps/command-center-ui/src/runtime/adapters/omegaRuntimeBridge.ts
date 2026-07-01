import { fetchRecentOmegaEvents } from './omegaReader';
import { globalRuntimeBus } from '../bus/runtimeBus';

class OmegaRuntimeBridge {
  private isEnabled = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private pollIntervalMs = 15000;
  private lastPollFailed = false;
  private lastPollTime: string | null = null;
  private rowsMappedTotal = 0;
  private eventsPublishedTotal = 0;

  enable() {
    if (this.isEnabled) return;
    this.isEnabled = true;
    
    // Pause local mock feed dynamically
    import('../mock/mockRuntimeFeed').then(({ mockRuntimeFeed }) => {
      mockRuntimeFeed.pause();
    });
    
    this.intervalId = setInterval(async () => {
      await this.poll();
    }, this.pollIntervalMs);

    // Initial poll
    // Initial poll
    this.poll();
  }

  async pollOnce() {
    if (!this.isEnabled) {
      await this.poll();
    }
  }

  disable() {
    if (!this.isEnabled) return;
    this.isEnabled = false;
    this.lastPollFailed = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    // Restore local mock feed
    import('../mock/mockRuntimeFeed').then(({ mockRuntimeFeed }) => {
      mockRuntimeFeed.resume();
    });
  }

  getStatus(): 'DISABLED' | 'READ-ONLY' | 'ERROR' {
    if (!this.isEnabled) return 'DISABLED';
    if (this.lastPollFailed) return 'ERROR';
    return 'READ-ONLY';
  }

  getStats() {
    return {
      lastPollTime: this.lastPollTime,
      rowsMappedTotal: this.rowsMappedTotal,
      eventsPublishedTotal: this.eventsPublishedTotal,
      isEnabled: this.isEnabled
    };
  }

  private async poll() {
    try {
      this.lastPollTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const events = await fetchRecentOmegaEvents();
      this.lastPollFailed = false;

      if (events.length === 0) {
        return;
      }

      this.rowsMappedTotal += events.length;
      this.eventsPublishedTotal += events.length;

      events.forEach(event => {
        globalRuntimeBus.publish(event);
      });
    } catch (e) {
      console.error('Omega Bridge Poll Error:', e);
      this.lastPollFailed = true;
    }
  }
}

export const globalOmegaBridge = new OmegaRuntimeBridge();

if (typeof window !== 'undefined') {
  (window as any).globalOmegaBridge = globalOmegaBridge;
}
