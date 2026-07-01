import { globalRuntimeMemoryEngine } from '../memory/runtimeMemoryEngine';
import { globalTimelineEngine } from '../bus/timelineEngine';
import { globalObservabilityCore } from './observabilityCore';
import type { MemoryObservation } from '../memory/runtimeMemoryEngine';
import type { RuntimeEvent } from '../contracts/runtimeEvent';
import type { CorrelationSummary } from '../signals/correlationEngine';
import type { ObservabilityHealthReport } from './observabilityCore';

export interface RuntimeStateSnapshot {
  snapshotId: string;
  timestamp: string;
  metrics: ObservabilityHealthReport;
  observations: MemoryObservation[];
  timeline: RuntimeEvent[];
  correlations: CorrelationSummary[];
}

const SNAPSHOTS_KEY = 'nexus::runtime::snapshots';

class SnapshotManager {
  captureSnapshot(): RuntimeStateSnapshot | null {
    const now = Date.now();
    const timestampStr = new Date().toISOString();

    const snapshot: RuntimeStateSnapshot = {
      snapshotId: `snap-${now}`,
      timestamp: timestampStr,
      metrics: globalObservabilityCore.getHealthReport(),
      observations: globalRuntimeMemoryEngine.getAllMemory(),
      timeline: globalTimelineEngine.getChronologicalTimeline(),
      correlations: [] // correlation buffer does not expose summaries directly but maps events
    };

    try {
      const existingRaw = localStorage.getItem(SNAPSHOTS_KEY) || '[]';
      const existing: RuntimeStateSnapshot[] = JSON.parse(existingRaw);
      
      // Limit saved snapshots to the latest 5 snapshots to avoid local storage bloat
      existing.unshift(snapshot);
      const capped = existing.slice(0, 5);
      
      localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(capped));
      return snapshot;
    } catch (err) {
      console.warn('Snapshot Manager: Write to LocalStorage failed:', err);
      return null;
    }
  }

  getSavedSnapshots(): RuntimeStateSnapshot[] {
    try {
      const data = localStorage.getItem(SNAPSHOTS_KEY);
      if (data) {
        return JSON.parse(data) as RuntimeStateSnapshot[];
      }
    } catch (err) {
      console.warn('Snapshot Manager: Read from LocalStorage failed:', err);
    }
    return [];
  }

  clearSnapshots() {
    try {
      localStorage.removeItem(SNAPSHOTS_KEY);
    } catch (err) {
      console.warn('Snapshot Manager: Clear LocalStorage failed:', err);
    }
  }
}

export const globalSnapshotManager = new SnapshotManager();
export default globalSnapshotManager;
