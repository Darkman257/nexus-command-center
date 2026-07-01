import type { RuntimeEvent } from '../contracts/runtimeEvent';

export interface QualifiedSignal {
  signal_id: string;
  title: string;
  source: string;
  severity: 'INFO' | 'OBSERVATION' | 'WARNING' | 'RISK' | 'CRITICAL';
  description: string;
  timestamp: string;
  confidence: number;
  evidence_refs: string[];
  event_id: string;
  correlations: string[];
  commandSnippet?: string;
  recommendation?: string;
}

export const signalPipeline = {
  qualifyEvent(event: RuntimeEvent): QualifiedSignal | null {
    // Defensive check to avoid processing null events
    if (!event) return null;

    // Stage 1: Parse & Normalize payload safely
    const eventType = event.event_type;
    const safePayload = event.payload || {};

    // Stage 2: Validate
    if (!event.event_id || !eventType) return null;

    // Stage 3 & 4 & 5: Correlate, Calculate Confidence, Prioritize
    let title = '';
    let severity: QualifiedSignal['severity'] = 'INFO';
    let description = '';
    let recommendation = '';
    const correlations: string[] = [];
    let confidence = typeof event.confidence === 'number' ? event.confidence : 0.95;

    switch (eventType) {
      case 'omega.attendance.uploaded':
        const driverId = safePayload.driver_id || 'UNKNOWN';
        const timeVal = safePayload.time || 'N/A';
        title = 'Attendance Check-in Ingested';
        description = `Driver check-in logged via WhatsApp by ${driverId} at ${timeVal}.`;
        severity = 'INFO';
        correlations.push('whatsapp.telemetry.inbound');
        break;

      case 'fleet.refuel.logged':
        const liters = typeof safePayload.fuel_liters === 'number' 
          ? safePayload.fuel_liters 
          : parseFloat(safePayload.fuel_liters as string) || 0;
        const cost = typeof safePayload.cost_le === 'number' 
          ? safePayload.cost_le 
          : parseFloat(safePayload.cost_le as string) || 0;
        const vehicleId = safePayload.vehicle_id || 'UNKNOWN';

        title = 'Fuel Ledger Recorded';
        description = `Vehicle ${vehicleId} refueled with ${liters}L. Cost: ${cost} LE.`;
        if (liters > 60) {
          title = 'Possible Refuel Volume Discrepancy';
          description = `Vehicle ${vehicleId} logged ${liters}L (normal cap is 50L). Potential fuel leakage risk.`;
          recommendation = `Request manual fuel receipt validation for vehicle ${vehicleId}.`;
          severity = 'WARNING';
          confidence = 0.82; // Strict uncertainty awareness
          correlations.push('fleet.tank.capacity.anomaly');
        } else {
          severity = 'INFO';
          correlations.push('fleet.refuel.nominal');
        }
        break;

      case 'supplier.invoice.created':
        const amount = typeof safePayload.amount_usd === 'number' 
          ? safePayload.amount_usd 
          : parseFloat(safePayload.amount_usd as string) || 0;
        title = 'Supplier Invoice Parsed';
        description = `Supplier invoice SUP-908 received. Amount: $${amount}.`;
        if (amount > 10000) {
          title = 'High-Value Supplier Ingestion';
          description = `Supplier SUP-908 created invoice for $${amount} (threshold limit: $10,000). Active audit trail queued.`;
          recommendation = `Require level 2 authorization from finance lead before processing.`;
          severity = 'RISK';
          confidence = 0.95;
          correlations.push('supplier.invoice.high_value');
        } else {
          severity = 'INFO';
          correlations.push('supplier.invoice.nominal');
        }
        break;

      case 'recruitment.cv.detected':
        const applicantName = safePayload.applicant_name || 'UNKNOWN';
        title = 'Candidate CV Received';
        description = `Applicant CV parsed for "${applicantName}". Sanitation checks fully complete.`;
        severity = 'OBSERVATION';
        correlations.push('recruitment.ingest.cv');
        break;

      case 'housing.issue.reported':
        const plumbSeverity = typeof safePayload.severity === 'string' ? safePayload.severity : 'LOW';
        const unitId = safePayload.unit_id || 'UNKNOWN';
        title = 'Housing Maintenance Ingested';
        description = `Maintenance issue logged for housing unit ${unitId}.`;
        if (plumbSeverity === 'HIGH') {
          title = 'Possible Housing Leak Anomaly';
          description = `High severity issue reported for plumbing in unit ${unitId}. Immediate maintenance dispatch advised.`;
          severity = 'RISK';
          confidence = 0.88;
          correlations.push('housing.plumbing.high_risk');
        } else {
          severity = 'OBSERVATION';
          correlations.push('housing.maintenance.nominal');
        }
        break;

      case 'omega-ops.csv.uploaded':
      case 'omega-ops.pdf.uploaded':
        const fileName = safePayload.file_name || 'unknown-file';
        const sizeBytes = typeof safePayload.size_bytes === 'number' 
          ? safePayload.size_bytes 
          : parseFloat(safePayload.size_bytes as string) || 0;
        title = 'Manual Intake File Normalization';
        description = `Manual upload compiled: ${fileName} (${(sizeBytes / 1024).toFixed(1)} KB).`;
        severity = 'INFO';
        correlations.push('manual.intake.quarantine');
        break;

      default:
        // Generic fallback event mapping
        title = 'Raw System Telemetry Signal';
        description = `Raw operational signal triggered by event: ${eventType} from ${event.source || 'UNKNOWN'}.`;
        severity = 'OBSERVATION';
        correlations.push('telemetry.fallback');
        break;
    }

    // Stage 6: Escalate Signal (Build final QualifiedSignal payload)
    const signal: QualifiedSignal = {
      signal_id: `sig-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title,
      source: event.source,
      severity,
      description,
      timestamp: event.timestamp,
      confidence,
      evidence_refs: event.evidence_refs || [],
      event_id: event.event_id,
      correlations,
      recommendation
    };

    return signal;
  }
};
export default signalPipeline;
