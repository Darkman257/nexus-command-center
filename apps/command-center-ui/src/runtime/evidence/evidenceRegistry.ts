export interface EvidenceRecord {
  evidence_id: string;
  source_file: string;
  timestamp: string;
  event_origin: string;
  payload_snapshot: Record<string, unknown>;
  associated_signals: string[];
}

class EvidenceRegistry {
  private registry: Record<string, EvidenceRecord> = {};

  registerEvidence(
    sourceFile: string,
    eventOrigin: string,
    payload: Record<string, unknown>
  ): string {
    const evidenceId = `evd-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    this.registry[evidenceId] = {
      evidence_id: evidenceId,
      source_file: sourceFile,
      timestamp,
      event_origin: eventOrigin,
      payload_snapshot: payload,
      associated_signals: []
    };

    return evidenceId;
  }

  linkSignalToEvidence(evidenceId: string, signalId: string) {
    if (this.registry[evidenceId]) {
      if (!this.registry[evidenceId].associated_signals.includes(signalId)) {
        this.registry[evidenceId].associated_signals.push(signalId);
      }
    }
  }

  getEvidence(evidenceId: string): EvidenceRecord | undefined {
    return this.registry[evidenceId];
  }

  getAllEvidence(): EvidenceRecord[] {
    return Object.values(this.registry);
  }

  resolveEvidenceMetadata(evidenceId: string) {
    const record = this.registry[evidenceId];
    if (!record) return null;
    const payloadSummary = Object.entries(record.payload_snapshot)
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join(', ');
    return {
      evidence_id: record.evidence_id,
      source_file: record.source_file,
      timestamp: record.timestamp,
      event_origin: record.event_origin,
      payload_summary: payloadSummary,
      associated_signals: record.associated_signals
    };
  }
}

export const globalEvidenceRegistry = new EvidenceRegistry();
export default globalEvidenceRegistry;
