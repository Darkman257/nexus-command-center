import { globalRuntimeBus } from '../bus/runtimeBus';
import type { RuntimeEvent } from '../contracts/runtimeEvent';

const MOCK_TEMPLATES = [
  {
    workspace: 'omega-ops',
    event_type: 'omega.attendance.uploaded',
    source: 'WhatsApp check-in system',
    payload: { driver_id: 'DRV-102', time: '08:15', status: 'IN_BOUND' },
    evidence_refs: ['doc-wa-4029']
  },
  {
    workspace: 'omega-ops',
    event_type: 'fleet.refuel.logged',
    source: 'Fleet Refuel Ingestion Terminal',
    payload: { vehicle_id: 'TX-409', fuel_liters: 45.2, cost_le: 650 },
    evidence_refs: ['refuel-ledger-cache']
  },
  {
    workspace: 'supplier-portal',
    event_type: 'supplier.invoice.created',
    source: 'Intake Invoice scanning node',
    payload: { supplier_id: 'SUP-908', amount_usd: 12500, checksum_ok: true },
    evidence_refs: ['inv-908-cache']
  },
  {
    workspace: 'recruitment-hub',
    event_type: 'recruitment.cv.detected',
    source: 'omega-cvs folder scanner',
    payload: { applicant_name: 'Amr Ezzat', file_name: 'Applicant_CV_Amr.pdf', sanitized: true },
    evidence_refs: ['omega-cvs/Applicant_CV_Amr.pdf']
  },
  {
    workspace: 'housing-ops',
    event_type: 'housing.issue.reported',
    source: 'Staff Housing Ingestion webhook',
    payload: { unit_id: 'A-20', category: 'PLUMBING', severity: 'HIGH' },
    evidence_refs: ['issue-log-802']
  }
];

let intervalId: any = null;
let isPaused = false;

export const mockRuntimeFeed = {
  start(intervalMs = 6000) {
    if (intervalId) return;

    intervalId = setInterval(() => {
      if (isPaused) return;

      const template = MOCK_TEMPLATES[Math.floor(Math.random() * MOCK_TEMPLATES.length)];
      const event: RuntimeEvent = {
        event_id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        workspace: template.workspace,
        event_type: template.event_type,
        timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        source: template.source,
        payload: template.payload,
        confidence: 0.95,
        evidence_refs: template.evidence_refs
      };

      globalRuntimeBus.publish(event);
    }, intervalMs);
  },

  stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  },

  pause() {
    isPaused = true;
    console.log('[TELEMETRY FEED] Ingestion loop paused.');
  },

  resume() {
    isPaused = false;
    console.log('[TELEMETRY FEED] Ingestion loop active.');
  }
};
export default mockRuntimeFeed;
