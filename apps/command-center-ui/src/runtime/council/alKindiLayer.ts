import { globalPatternMemory } from '../memory/patternMemory';
import { globalOperationalJournal } from '../behavior/operationalJournal';
import { globalRuntimeBus } from '../bus/runtimeBus';

export interface AlKindiObservation {
  id: string;
  type: 'weak_signal' | 'anomaly_hint' | 'pattern_observation' | 'operational_drift';
  message: string;
  confidence: number;
  relatedEntities: string[];
  timestamp: string;
}

class AlKindiLayer {
  private observations: AlKindiObservation[] = [];

  constructor() {
    // Al-Kindi subscribes to system events to perform real-time correlation
    globalRuntimeBus.subscribe('*', this.handleSystemEvent.bind(this));
  }

  private handleSystemEvent() {
    // We throttle deep reasoning to avoid render storms
    // In a real system, we'd debounce this or run it on a scheduled tick.
    // For now, we perform a lightweight check when events flow.
    this.reasonOverPatterns();
  }

  private reasonOverPatterns() {
    const patterns = globalPatternMemory.getRecurringPatterns();
    const journal = globalOperationalJournal.getOperationalPatterns();

    const newObservations: AlKindiObservation[] = [];

    // 1. Detect unusual repetition
    patterns.forEach(p => {
      if (p.frequency >= 5 && p.confidence > 70) {
        newObservations.push({
          id: `obs-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          type: 'pattern_observation',
          message: `High frequency repetition detected for ${p.eventType} in ${p.workspace}.`,
          confidence: p.confidence,
          relatedEntities: [p.workspace, p.eventType],
          timestamp: new Date().toISOString()
        });
      }
    });

    // 2. Identify emerging operational drift (e.g., lots of ignored telemetry)
    const recentIgnores = journal.filter(j => j.type === 'ignored_telemetry');
    if (recentIgnores.length >= 3) {
      newObservations.push({
        id: `obs-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: 'operational_drift',
        message: `Operator is repeatedly ignoring telemetry. Suppression thresholds may be misaligned.`,
        confidence: 85,
        relatedEntities: ['operator_behavior'],
        timestamp: new Date().toISOString()
      });
    }

    // Keep the top most relevant observations (lightweight)
    this.observations = newObservations.slice(-10);
  }

  public getLatestObservations(): AlKindiObservation[] {
    // If no events triggered reasoning recently, force a check
    if (this.observations.length === 0) {
      this.reasonOverPatterns();
    }
    return this.observations;
  }
}

export const globalAlKindiLayer = new AlKindiLayer();
export default globalAlKindiLayer;
