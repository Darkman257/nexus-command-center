import { NexusEvent } from '../../../event-bus/EventContracts';

export class TaskAggregate {
  private taskId: string = '';
  private title: string = '';
  private description: string = '';
  private status: string = 'Pending';
  private version: number = 0;
  private uncommittedEvents: NexusEvent[] = [];

  constructor(id: string) {
    this.taskId = id;
  }

  getTaskId(): string {
    return this.taskId;
  }

  getTitle(): string {
    return this.title;
  }

  getDescription(): string {
    return this.description;
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

  // Business logic: Create Task
  create(title: string, description: string, status: string = 'Pending'): void {
    if (!title || title.trim() === '') {
      throw new Error('Task title is required');
    }

    const event: NexusEvent = {
      id: `evt_${Math.random().toString(36).substring(2, 9)}`,
      type: 'Task.TaskCreated',
      workspace: 'default-workspace',
      source: 'task-domain',
      timestamp: new Date().toISOString(),
      entity: {
        type: 'task',
        id: this.taskId,
        name: title,
      },
      payload: {
        id: this.taskId,
        title: title,
        description: description,
        status: status,
        version: 1,
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
    if (type === 'Task.TaskCreated' || type === 'TaskCreated') {
      this.taskId = String(payload.id);
      this.title = String(payload.title);
      this.description = String(payload.description || '');
      this.status = String(payload.status || 'Pending');
      this.version = payload.version !== undefined ? Number(payload.version) : 1;
    }
  }
}
