import { NexusEvent } from '../../../event-bus/EventContracts';

export class HousingUnitAggregate {
  private unitId: string = '';
  private unitName: string = '';
  private roomsCount: number = 0;
  private location: string = '';
  private projectId: string = '';
  private assignedStaffIds: string[] = [];
  private version: number = 0;
  private uncommittedEvents: NexusEvent[] = [];

  constructor(id: string) {
    this.unitId = id;
  }

  getUnitId(): string {
    return this.unitId;
  }

  getUnitName(): string {
    return this.unitName;
  }

  getRoomsCount(): number {
    return this.roomsCount;
  }

  getLocation(): string {
    return this.location;
  }

  getProjectId(): string {
    return this.projectId;
  }

  getAssignedStaffIds(): string[] {
    return this.assignedStaffIds;
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

  // 1. Business logic: Register Housing Unit
  register(name: string, roomsCount: number, location: string, projectId: string): void {
    if (!name || name.trim() === '') {
      throw new Error('Housing unit name is required');
    }
    if (roomsCount <= 0) {
      throw new Error('Rooms count must be greater than zero');
    }

    const event: NexusEvent = {
      id: `evt_${Math.random().toString(36).substring(2, 9)}`,
      type: 'Housing.HousingUnitRegistered',
      workspace: 'default-workspace',
      source: 'housing-domain',
      timestamp: new Date().toISOString(),
      entity: {
        type: 'housing_unit',
        id: this.unitId,
        name: name,
      },
      payload: {
        unitId: this.unitId,
        unitName: name,
        roomsCount: roomsCount,
        location: location,
        projectId: projectId,
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

  // 2. Business logic: Assign Staff to Unit
  assignStaff(staffId: string, expectedVersion?: number): void {
    if (!staffId || staffId.trim() === '') {
      throw new Error('Staff ID is required');
    }

    // Optimistic Concurrency Check
    if (expectedVersion !== undefined && this.version !== expectedVersion) {
      throw new Error(`Concurrency Exception: Expected version ${expectedVersion} but aggregate is at version ${this.version}`);
    }

    // Capacity check: max capacity = roomsCount * 2
    const maxCapacity = this.roomsCount * 2;
    if (this.assignedStaffIds.length >= maxCapacity) {
      throw new Error(`CapacityExceeded: Cannot assign staff. Unit ${this.unitName} is at full capacity (${maxCapacity} people max for ${this.roomsCount} rooms).`);
    }

    // Duplicate check
    if (this.assignedStaffIds.includes(staffId)) {
      throw new Error(`DuplicateAssignment: Staff member ${staffId} is already assigned to this unit.`);
    }

    const event: NexusEvent = {
      id: `evt_${Math.random().toString(36).substring(2, 9)}`,
      type: 'Housing.StaffAssignedToUnit',
      workspace: 'default-workspace',
      source: 'housing-domain',
      timestamp: new Date().toISOString(),
      entity: {
        type: 'housing_unit',
        id: this.unitId,
        name: this.unitName,
      },
      payload: {
        unitId: this.unitId,
        staffId: staffId,
        projectId: this.projectId,
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

  // 3. Business logic: Release Staff
  releaseStaff(staffId: string): void {
    if (!staffId || staffId.trim() === '') {
      throw new Error('Staff ID is required');
    }

    if (!this.assignedStaffIds.includes(staffId)) {
      throw new Error(`NotFoundAssignment: Staff member ${staffId} is not assigned to this unit.`);
    }

    const event: NexusEvent = {
      id: `evt_${Math.random().toString(36).substring(2, 9)}`,
      type: 'Housing.StaffReleasedFromUnit',
      workspace: 'default-workspace',
      source: 'housing-domain',
      timestamp: new Date().toISOString(),
      entity: {
        type: 'housing_unit',
        id: this.unitId,
        name: this.unitName,
      },
      payload: {
        unitId: this.unitId,
        staffId: staffId,
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
    if (type === 'Housing.HousingUnitRegistered' || type === 'HousingUnitRegistered') {
      this.unitId = String(payload.unitId);
      this.unitName = String(payload.unitName);
      this.roomsCount = Number(payload.roomsCount || 0);
      this.location = String(payload.location || '');
      this.projectId = String(payload.projectId || '');
      this.version = payload.version !== undefined ? Number(payload.version) : 1;
    } else if (type === 'Housing.StaffAssignedToUnit' || type === 'StaffAssignedToUnit') {
      const staffId = String(payload.staffId);
      if (!this.assignedStaffIds.includes(staffId)) {
        this.assignedStaffIds.push(staffId);
      }
      this.version = payload.newVersion !== undefined ? Number(payload.newVersion) : this.version + 1;
    } else if (type === 'Housing.StaffReleasedFromUnit' || type === 'StaffReleasedFromUnit') {
      const staffId = String(payload.staffId);
      this.assignedStaffIds = this.assignedStaffIds.filter(id => id !== staffId);
      this.version = payload.newVersion !== undefined ? Number(payload.newVersion) : this.version + 1;
    }
  }
}
