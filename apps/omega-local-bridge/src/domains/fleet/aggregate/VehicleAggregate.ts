import { NexusEvent } from '../../../event-bus/EventContracts';

export class VehicleAggregate {
  private vehicleId: string = '';
  private name: string = '';
  private driver: string = '';
  private version: number = 0;
  private uncommittedEvents: NexusEvent[] = [];

  constructor(id: string) {
    this.vehicleId = id;
  }

  getVehicleId(): string {
    return this.vehicleId;
  }

  getName(): string {
    return this.name;
  }

  getDriver(): string {
    return this.driver;
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

  // 1. Business logic: Register Vehicle
  register(name: string): void {
    if (!name || name.trim() === '') {
      throw new Error('Vehicle name is required');
    }

    const event: NexusEvent = {
      id: `evt_${Math.random().toString(36).substring(2, 9)}`,
      type: 'Fleet.VehicleRegistered',
      workspace: 'default-workspace',
      source: 'fleet-domain',
      timestamp: new Date().toISOString(),
      entity: {
        type: 'vehicle',
        id: this.vehicleId,
        name: name,
      },
      payload: {
        vehicleId: this.vehicleId,
        name: name,
        driver: '',
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

  // 2. Business logic: Assign Driver
  assignDriver(driverName: string, expectedVersion?: number): void {
    if (!driverName || driverName.trim() === '') {
      throw new Error('Driver name is required');
    }

    // Optimistic Concurrency Check
    if (expectedVersion !== undefined && this.version !== expectedVersion) {
      throw new Error(`Concurrency Exception: Expected version ${expectedVersion} but aggregate is at version ${this.version}`);
    }

    const event: NexusEvent = {
      id: `evt_${Math.random().toString(36).substring(2, 9)}`,
      type: 'Fleet.DriverAssigned',
      workspace: 'default-workspace',
      source: 'fleet-domain',
      timestamp: new Date().toISOString(),
      entity: {
        type: 'vehicle',
        id: this.vehicleId,
        name: this.name,
      },
      payload: {
        vehicleId: this.vehicleId,
        driverName: driverName,
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
    if (type === 'Fleet.VehicleRegistered' || type === 'VehicleRegistered') {
      this.vehicleId = String(payload.vehicleId);
      this.name = String(payload.name);
      this.driver = String(payload.driver || '');
      this.version = payload.version !== undefined ? Number(payload.version) : 1;
    } else if (type === 'Fleet.DriverAssigned' || type === 'DriverAssigned') {
      this.driver = String(payload.driverName);
      this.version = payload.newVersion !== undefined ? Number(payload.newVersion) : this.version + 1;
    }
  }
}
