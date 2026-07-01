import { globalRuntimeBus } from './runtimeBus';
import { globalRuntimeMemoryEngine } from '../memory/runtimeMemoryEngine';
import { globalSuppressionEngine } from '../signals/suppressionEngine';
import { globalCorrelationEngine } from '../signals/correlationEngine';

export interface RuntimeMetricsReport {
  eventRatePerMin: number;
  totalEventsProcessed: number;
  suppressedSignalsCount: number;
  activeObservationsCount: number;
  localStorageBytes: number;
  correlationCount: number;
  uptimeSeconds: number;
}

class RuntimeMetricsEngine {
  private totalEvents = 0;
  private recentEventsTimestamps: number[] = [];
  private readonly startTimestamp = Date.now();

  constructor() {
    // Listen to wildcard * to measure processing throughput
    globalRuntimeBus.subscribe('*', () => {
      this.totalEvents++;
      const now = Date.now();
      this.recentEventsTimestamps.push(now);
      
      // Keep only events from the last 60 seconds for rate calculations
      this.recentEventsTimestamps = this.recentEventsTimestamps.filter(
        t => now - t < 60000
      );
    });
  }

  getMetricsReport(): RuntimeMetricsReport {
    const now = Date.now();
    const uptime = Math.floor((now - this.startTimestamp) / 1000);

    // Prune expired timestamps
    this.recentEventsTimestamps = this.recentEventsTimestamps.filter(
      t => now - t < 60000
    );

    // Calculate localStorage character size
    let storageBytes = 0;
    try {
      const serialized = localStorage.getItem('nexus::runtime::observations') || '';
      storageBytes = serialized.length * 2; // UTF-16 characters = 2 bytes each
    } catch {
      // localStorage disabled or full fallback
    }

    return {
      eventRatePerMin: this.recentEventsTimestamps.length,
      totalEventsProcessed: this.totalEvents,
      suppressedSignalsCount: globalSuppressionEngine.getActiveBuffer().length, // we can track suppression engine size
      activeObservationsCount: globalRuntimeMemoryEngine.getAllMemory().length,
      localStorageBytes: storageBytes,
      correlationCount: globalCorrelationEngine.getBuffer().length, // correlates to sliding correlation buffer
      uptimeSeconds: uptime
    };
  }
}

export const globalRuntimeMetrics = new RuntimeMetricsEngine();
export default globalRuntimeMetrics;
