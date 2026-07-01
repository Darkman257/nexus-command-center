export interface RuntimeEvent {
  event_id: string;
  workspace: string;
  event_type: string;
  timestamp: string;
  source: string;
  payload: Record<string, unknown>;
  confidence?: number;
  evidence_refs?: string[];
}
