import type { QualifiedSignal } from './signalPipeline';

export interface SuppressionDecision {
  shouldSuppress: boolean;
  reason?: string;
  originalSeverity: 'INFO' | 'OBSERVATION' | 'WARNING' | 'RISK' | 'CRITICAL';
}

class SuppressionEngine {
  private activeSignalsBuffer: QualifiedSignal[] = [];
  private readonly FLOOD_THRESHOLD_MS = 60000; // 60-second duplicate filter

  evaluateSignal(signal: QualifiedSignal): SuppressionDecision {
    const now = Date.now();

    // 1. Critical signals ALWAYS bypass suppression rules
    if (signal.severity === 'CRITICAL' || signal.confidence >= 0.95) {
      return {
        shouldSuppress: false,
        originalSeverity: signal.severity
      };
    }

    // 2. Suppress isolated low-confidence alerts
    if (signal.confidence < 0.80) {
      return {
        shouldSuppress: true,
        reason: `Isolated signal with insufficient confidence threshold (${Math.round(signal.confidence * 100)}% < 80%)`,
        originalSeverity: signal.severity
      };
    }

    // 3. Prevent duplicate warning spam (flood control)
    const duplicateMatch = this.activeSignalsBuffer.find(
      s => 
        s.source === signal.source && 
        s.title === signal.title && 
        s.severity === signal.severity
    );

    if (duplicateMatch) {
      const matchTime = parseFloat(duplicateMatch.signal_id.split('-')[1]) || now;
      if (now - matchTime < this.FLOOD_THRESHOLD_MS) {
        return {
          shouldSuppress: true,
          reason: `Duplicate spam suppressed (active instance qualified within current ${this.FLOOD_THRESHOLD_MS / 1000}s period)`,
          originalSeverity: signal.severity
        };
      }
    }

    // Track active signal to monitor duplicates
    this.activeSignalsBuffer = this.activeSignalsBuffer.filter(s => {
      const sTime = parseFloat(s.signal_id.split('-')[1]) || now;
      return now - sTime < this.FLOOD_THRESHOLD_MS;
    });
    this.activeSignalsBuffer.push(signal);

    return {
      shouldSuppress: false,
      originalSeverity: signal.severity
    };
  }

  getActiveBuffer(): QualifiedSignal[] {
    return this.activeSignalsBuffer;
  }
}

export const globalSuppressionEngine = new SuppressionEngine();
export default globalSuppressionEngine;
