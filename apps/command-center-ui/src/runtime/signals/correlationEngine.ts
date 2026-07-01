import type { RuntimeEvent } from '../contracts/runtimeEvent';

export interface CorrelationSummary {
  correlation_id: string;
  workspace: string;
  pattern_type: 'REPEATED_ACTIVITY' | 'CROSS_DOMAIN_ANOMALY' | 'STORM_DETECTED';
  related_events: string[];
  description: string;
  timestamp: string;
  confidence: number;
  explanation?: string;
}

class CorrelationEngine {
  private eventsBuffer: RuntimeEvent[] = [];
  private readonly WINDOW_LIMIT_MS = 60000; // 60s sliding window

  addEventAndCorrelate(event: RuntimeEvent): CorrelationSummary | null {
    const now = Date.now();
    this.eventsBuffer.push(event);

    // Prune events older than 60 seconds
    const cutoff = now - this.WINDOW_LIMIT_MS;
    this.eventsBuffer = this.eventsBuffer.filter(e => {
      // Parse or estimate event timestamp
      const evtTime = parseFloat(e.event_id.split('-')[1]) || now;
      return evtTime > cutoff;
    });

    // 1. Detect Repeated Activity (chattering nodes)
    const identicalTypeEvents = this.eventsBuffer.filter(
      e => e.workspace === event.workspace && e.event_type === event.event_type
    );

    if (identicalTypeEvents.length >= 3) {
      const times = identicalTypeEvents.map(e => parseFloat(e.event_id.split('-')[1]) || now);
      const spreadMs = Math.max(...times) - Math.min(...times);
      // Base confidence of 0.95, decaying up to 0.15 based on temporal spread over 60s
      const decay = Math.min(0.15, (spreadMs / 60000) * 0.15);
      const calculatedConfidence = parseFloat((0.95 - decay).toFixed(2));
      const explanation = `REPEATED_ACTIVITY: Qualified because event type "${event.event_type}" triggered ${identicalTypeEvents.length} times within a ${Math.round(spreadMs / 1000)}s window under workspace cluster "${event.workspace}". Highly consistent source "${event.source}" is chattering.`;

      return {
        correlation_id: `corr-rep-${now}-${Math.floor(Math.random() * 1000)}`,
        workspace: event.workspace,
        pattern_type: 'REPEATED_ACTIVITY',
        related_events: identicalTypeEvents.map(e => e.event_id),
        description: `Operational chatter detected: event type "${event.event_type}" triggered ${identicalTypeEvents.length} times within a ${Math.round(spreadMs / 1000)}s window.`,
        timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        confidence: calculatedConfidence,
        explanation
      };
    }

    // 2. Detect Cross-Domain Anomalies (e.g. plumbing anomaly + high expense invoice)
    if (event.workspace === 'omega-ops' || event.workspace === 'supplier-portal' || event.workspace === 'housing-ops') {
      const anomalies = this.eventsBuffer.filter(e => {
        const isPlumbWarning = e.event_type === 'housing.issue.reported' && (e.payload.severity === 'HIGH');
        const isRefuelAnomaly = e.event_type === 'fleet.refuel.logged' && ((e.payload.fuel_liters as number) > 60);
        const isInvoiceAnomaly = e.event_type === 'supplier.invoice.created' && ((e.payload.amount_usd as number) > 10000);
        return isPlumbWarning || isRefuelAnomaly || isInvoiceAnomaly;
      });

      if (anomalies.length >= 2) {
        // Confidence scales dynamically with the volume of concurrent anomalies
        let baseConfidence = 0.80;
        if (anomalies.length === 3) baseConfidence = 0.95;
        if (anomalies.length >= 4) baseConfidence = 0.99;

        const times = anomalies.map(e => parseFloat(e.event_id.split('-')[1]) || now);
        const spreadMs = Math.max(...times) - Math.min(...times);
        // Time decay up to 0.10 based on temporal scatter over 60s
        const decay = Math.min(0.10, (spreadMs / 60000) * 0.10);
        const calculatedConfidence = parseFloat((baseConfidence - decay).toFixed(2));
        const domains = Array.from(new Set(anomalies.map(a => a.event_type.split('.')[0]))).join(', ');
        const explanation = `CROSS_DOMAIN_ANOMALY: Qualified because ${anomalies.length} high-severity anomaly logs detected concurrently across OMEGA interfaces within a ${Math.round(spreadMs / 1000)}s window. Affected domains: ${domains}. Shared workspace cluster: "${event.workspace}".`;

        return {
          correlation_id: `corr-cross-${now}-${Math.floor(Math.random() * 1000)}`,
          workspace: event.workspace,
          pattern_type: 'CROSS_DOMAIN_ANOMALY',
          related_events: anomalies.map(e => e.event_id),
          description: `Cross-system leak anomaly warning: ${anomalies.length} high-severity telemetry signals detected concurrently across OMEGA operational interfaces. Temporal spread: ${Math.round(spreadMs / 1000)}s.`,
          timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          confidence: calculatedConfidence,
          explanation
        };
      }
    }

    return null;
  }

  getBuffer(): RuntimeEvent[] {
    return this.eventsBuffer;
  }
}

export const globalCorrelationEngine = new CorrelationEngine();
export default globalCorrelationEngine;
