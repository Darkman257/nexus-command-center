import { VehicleAggregate } from '../aggregate/VehicleAggregate';
import { readEventsForAggregate, appendEvent } from '../../../event-bus/EventStoreHelper';
import { globalProjectionEngine } from '../../../projections/ProjectionEngine';

export class FleetCommandHandlers {
  static async handleRegister(payload: { vehicleId: string; name: string }): Promise<void> {
    const aggregate = new VehicleAggregate(payload.vehicleId);

    // Rebuild current state by replaying historical events
    const history = await readEventsForAggregate(payload.vehicleId);
    aggregate.loadFromHistory(history);

    // Apply domain rules and generate events
    aggregate.register(payload.name);

    // Persist all generated uncommitted events to the store and run projections
    for (const event of aggregate.getUncommittedEvents()) {
      await appendEvent(event);
      await globalProjectionEngine.project(event);
    }
  }

  static async handleAssignDriver(payload: { vehicleId: string; driverName: string; expectedVersion?: number }): Promise<void> {
    const aggregate = new VehicleAggregate(payload.vehicleId);

    // Rebuild current state by replaying historical events
    const history = await readEventsForAggregate(payload.vehicleId);
    aggregate.loadFromHistory(history);

    // Apply domain rules and check for optimistic concurrency exceptions
    aggregate.assignDriver(payload.driverName, payload.expectedVersion);

    // Persist all generated uncommitted events to the store and run projections
    for (const event of aggregate.getUncommittedEvents()) {
      await appendEvent(event);
      await globalProjectionEngine.project(event);
    }
  }
}
