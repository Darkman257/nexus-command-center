export interface EventMetadata {
  environment: 'local' | 'production';
  tenantId: string;
  sessionId: string;
  traceId: string;
  signature?: string;
  previousSignature?: string;
}

export interface EventEntity {
  type: string; // E.g., 'candidate', 'vehicle', 'payroll'
  id: string;
  name: string;
}

export interface NexusEvent {
  id: string;
  timestamp: string;
  workspace: string;
  source: string; // E.g., 'sally', 'malik', 'command-center-ui'
  type: string;   // E.g., 'CandidateApproved', 'DriverAssigned'
  entity: EventEntity;
  payload: Record<string, unknown>;
  severity: 'info' | 'warn' | 'critical';
  correlationId: string;
  version: number;
  metadata: EventMetadata;
}
