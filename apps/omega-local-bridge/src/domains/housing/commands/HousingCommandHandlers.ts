import { HousingUnitAggregate } from '../aggregate/HousingUnitAggregate';
import { readEventsForAggregate, appendEvent } from '../../../event-bus/EventStoreHelper';
import { globalProjectionEngine } from '../../../projections/ProjectionEngine';

export class HousingCommandHandlers {
  static async handleRegisterUnit(payload: { unitId: string; name: string; roomsCount: number; location: string; projectId: string }): Promise<void> {
    const aggregate = new HousingUnitAggregate(payload.unitId);

    // Rebuild aggregate state from event stream history
    const history = await readEventsForAggregate(payload.unitId);
    aggregate.loadFromHistory(history);

    // Register unit rules execution
    aggregate.register(payload.name, payload.roomsCount, payload.location, payload.projectId);

    // Persist and project uncommitted events
    for (const event of aggregate.getUncommittedEvents()) {
      await appendEvent(event);
      await globalProjectionEngine.project(event);
    }
  }

  static async handleAssignStaff(payload: { unitId: string; staffId: string; expectedVersion?: number }): Promise<void> {
    const aggregate = new HousingUnitAggregate(payload.unitId);

    // Rebuild aggregate state from event stream history
    const history = await readEventsForAggregate(payload.unitId);
    aggregate.loadFromHistory(history);

    // Assign staff capacity check rules execution
    aggregate.assignStaff(payload.staffId, payload.expectedVersion);

    // Persist and project uncommitted events
    for (const event of aggregate.getUncommittedEvents()) {
      await appendEvent(event);
      await globalProjectionEngine.project(event);
    }
  }

  static async handleReleaseStaff(payload: { unitId: string; staffId: string }): Promise<void> {
    const aggregate = new HousingUnitAggregate(payload.unitId);

    // Rebuild aggregate state from event stream history
    const history = await readEventsForAggregate(payload.unitId);
    aggregate.loadFromHistory(history);

    // Release staff rules execution
    aggregate.releaseStaff(payload.staffId);

    // Persist and project uncommitted events
    for (const event of aggregate.getUncommittedEvents()) {
      await appendEvent(event);
      await globalProjectionEngine.project(event);
    }
  }
}
