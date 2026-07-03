export interface NexusCommand {
  commandId: string;
  type: string;
  issuedBy: string;
  workspace: string;
  timestamp: string;
  expectedVersion?: number;
  payload: Record<string, unknown>;
}

export interface CommandAuditRecord {
  commandId: string;
  command: NexusCommand;
  status: 'Received' | 'Validated' | 'Executed' | 'Succeeded' | 'Failed';
  reason?: string;
  timestamp: string;
}

export interface Snapshot<T = unknown> {
  aggregateId: string;
  version: number;
  state: T;
  timestamp: string;
}

export interface SnapshotStore {
  get<T = unknown>(aggregateId: string): Promise<Snapshot<T> | null>;
  save<T = unknown>(snapshot: Snapshot<T>): Promise<void>;
}
