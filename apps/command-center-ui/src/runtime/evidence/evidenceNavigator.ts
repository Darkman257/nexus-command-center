import { globalEvidenceRegistry } from './evidenceRegistry';
import type { EvidenceRecord } from './evidenceRegistry';

export interface ResolvedEvidenceMetadata {
  evidence_id: string;
  source_file: string;
  timestamp: string;
  event_origin: string;
  payload_summary: string;
  associated_signals: string[];
}

class EvidenceNavigator {
  resolveRef(refId: string): ResolvedEvidenceMetadata | null {
    // 1. Attempt exact lookup in registry
    const registered = globalEvidenceRegistry.getAllEvidence().find(
      e => e.evidence_id === refId || e.source_file === refId
    );

    if (registered) {
      return this.mapToResolved(registered);
    }

    // 2. Dynamic generation for untracked manual fallback refs
    return {
      evidence_id: `evd-dyn-${Date.now()}`,
      source_file: refId,
      timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      event_origin: 'Unknown Dynamic Origin',
      payload_summary: `Direct trace reference point: "${refId}"`,
      associated_signals: []
    };
  }

  resolveRefs(refIds: string[]): ResolvedEvidenceMetadata[] {
    return refIds
      .map(ref => this.resolveRef(ref))
      .filter((res): res is ResolvedEvidenceMetadata => res !== null);
  }

  private mapToResolved(record: EvidenceRecord): ResolvedEvidenceMetadata {
    const payloadSummary = Object.entries(record.payload_snapshot)
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join(', ');

    return {
      evidence_id: record.evidence_id,
      source_file: record.source_file,
      timestamp: record.timestamp,
      event_origin: record.event_origin,
      payload_summary: payloadSummary || 'No extra parameters logged.',
      associated_signals: record.associated_signals
    };
  }
}

export const globalEvidenceNavigator = new EvidenceNavigator();
export default globalEvidenceNavigator;
