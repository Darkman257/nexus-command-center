import { NexusEvent } from '../../../event-bus/EventContracts';

export class CandidateAggregate {
  private candidateId: string = '';
  private name: string = '';
  private status: string = 'Pending';
  private version: number = 0;
  private uncommittedEvents: NexusEvent[] = [];

  constructor(id: string) {
    this.candidateId = id;
  }

  getCandidateId(): string {
    return this.candidateId;
  }

  getName(): string {
    return this.name;
  }

  getStatus(): string {
    return this.status;
  }

  getVersion(): number {
    return this.version;
  }

  getUncommittedEvents(): NexusEvent[] {
    return this.uncommittedEvents;
  }

  clearUncommittedEvents(): void {
    this.uncommittedEvents = [];
  }

  loadFromHistory(events: NexusEvent[]): void {
    for (const event of events) {
      this.apply(event);
    }
  }

  // Business logic: Approve Candidate
  approve(candidateName: string, expectedVersion?: number): void {
    if (!candidateName || candidateName.trim() === '') {
      throw new Error('Candidate name is required');
    }

    // Optimistic Concurrency Check
    if (expectedVersion !== undefined && this.version !== expectedVersion) {
      throw new Error(`Concurrency Exception: Expected version ${expectedVersion} but aggregate is at version ${this.version}`);
    }

    const event: NexusEvent = {
      id: `evt_${Math.random().toString(36).substring(2, 9)}`,
      type: 'Recruitment.CandidateApproved',
      workspace: 'default-workspace',
      source: 'recruitment-domain',
      timestamp: new Date().toISOString(),
      entity: {
        type: 'candidate',
        id: this.candidateId,
        name: candidateName,
      },
      payload: {
        candidateId: this.candidateId,
        candidateName: candidateName,
        status: 'Approved',
        newVersion: this.version + 1,
      },
      severity: 'info',
      correlationId: `corr_${Math.random().toString(36).substring(2, 9)}`,
      version: 1,
      metadata: {
        environment: 'local',
        tenantId: 'default-tenant',
        sessionId: 'system-session',
        traceId: `tr_${Math.random().toString(36).substring(2, 9)}`,
      },
    };

    this.apply(event);
    this.uncommittedEvents.push(event);
  }

  private apply(event: NexusEvent): void {
    const { type, payload } = event;
    if (type === 'Recruitment.CandidateApproved' || type === 'CandidateApproved') {
      this.candidateId = String(payload.candidateId);
      this.name = String(payload.candidateName);
      this.status = String(payload.status || 'Approved');
      this.version = payload.newVersion !== undefined ? Number(payload.newVersion) : this.version + 1;
    }
  }
}
