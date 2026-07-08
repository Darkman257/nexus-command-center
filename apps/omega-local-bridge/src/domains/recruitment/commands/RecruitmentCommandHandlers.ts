import { CandidateAggregate } from '../aggregate/CandidateAggregate';
import { readEventsForAggregate, appendEvent } from '../../../event-bus/EventStoreHelper';
import { globalProjectionEngine } from '../../../projections/ProjectionEngine';

export class RecruitmentCommandHandlers {
  static async handleApprove(payload: { candidateId: string; candidateName: string; expectedVersion?: number }): Promise<void> {
    const aggregate = new CandidateAggregate(payload.candidateId);

    // Rebuild current state by replaying historical events
    const history = await readEventsForAggregate(payload.candidateId);
    aggregate.loadFromHistory(history);

    // Apply domain rules and generate events
    aggregate.approve(payload.candidateName, payload.expectedVersion);

    // Persist all generated uncommitted events to the store and run projections
    for (const event of aggregate.getUncommittedEvents()) {
      await appendEvent(event);
      await globalProjectionEngine.project(event);
    }
  }
}
