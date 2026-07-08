import { TaskAggregate } from '../aggregate/TaskAggregate';
import { readEventsForAggregate, appendEvent } from '../../../event-bus/EventStoreHelper';
import { globalProjectionEngine } from '../../../projections/ProjectionEngine';

export class TaskCommandHandlers {
  static async handleCreate(payload: { taskId: string; title: string; description: string; status?: string }): Promise<void> {
    const aggregate = new TaskAggregate(payload.taskId);

    // Rebuild current state by replaying historical events
    const history = await readEventsForAggregate(payload.taskId);
    aggregate.loadFromHistory(history);

    // Apply domain rules and generate events
    aggregate.create(payload.title, payload.description, payload.status || 'Pending');

    // Persist all generated uncommitted events to the store and run projections
    for (const event of aggregate.getUncommittedEvents()) {
      await appendEvent(event);
      await globalProjectionEngine.project(event);
    }
  }
}
