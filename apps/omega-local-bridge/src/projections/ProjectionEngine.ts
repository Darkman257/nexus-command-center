import * as fs from 'fs';
import * as path from 'path';
import { globalMemoryRepository } from '../memory/MemoryRepository';
import { globalNotificationService } from '../notifications/NotificationService';
import type { NexusEvent } from '../event-bus/EventContracts';
import { FleetProjection } from '../domains/fleet/projection/FleetProjection';
import { RecruitmentProjection } from '../domains/recruitment/projection/RecruitmentProjection';
import { TaskProjection } from '../domains/task/projection/TaskProjection';
import { HousingProjection } from '../domains/housing/projection/HousingProjection';

export class ProjectionEngine {
  private baseDir: string;

  constructor() {
    this.baseDir = path.join(__dirname, '..', '..', 'data', 'memory-kernel');
  }

  async project(event: NexusEvent): Promise<void> {
    const { type, payload } = event;

    try {
      switch (type) {
        case 'EntityCreated':
          globalMemoryRepository.saveEntity(payload);
          break;

        case 'RelationshipCreated':
          globalMemoryRepository.saveRelationship(payload);
          break;

        case 'TimelineMilestoneCreated':
          globalMemoryRepository.saveTimeline(payload);
          break;

        case 'PolicyCreated':
          globalMemoryRepository.savePolicy(payload);
          break;

        case 'DecisionCreated':
          globalMemoryRepository.saveDecision(payload);
          break;

        case 'Task.TaskCreated':
        case 'TaskCreated':
          await TaskProjection.project(event);
          break;

        case 'FactCreated':
          globalMemoryRepository.saveFact(payload);
          break;

        case 'Fleet.VehicleRegistered':
        case 'VehicleRegistered':
        case 'Fleet.DriverAssigned':
        case 'DriverAssigned':
          await FleetProjection.project(event);
          break;

        case 'Recruitment.CandidateApproved':
        case 'CandidateApproved':
          await RecruitmentProjection.project(event);
          break;

        case 'Housing.HousingUnitRegistered':
        case 'HousingUnitRegistered':
        case 'Housing.StaffAssignedToUnit':
        case 'StaffAssignedToUnit':
        case 'Housing.StaffReleasedFromUnit':
        case 'StaffReleasedFromUnit':
          await HousingProjection.project(event);
          break;

        default:
          console.log(`Projection Engine: Ignoring unmapped event type "${type}"`);
          break;
      }

      // Broadcast event to all SSE notification clients dynamically in real-time
      globalNotificationService.broadcast(event);

    } catch (err: any) {
      console.error(`Projection Engine: Failed to project event ${event.id} of type ${type}:`, err.message);
      throw err;
    }
  }

  async replay(): Promise<void> {
    console.log('Projection Engine: Initiating full event log replay...');

    // 1. Purge all directories
    const dirs = ['entities', 'relationships', 'timeline', 'policies', 'decisions', 'tasks', 'facts'];
    dirs.forEach(d => {
      const p = path.join(this.baseDir, d);
      this.purgeDir(p);
    });

    // 2. Read Event Store and project chronologically
    const logPath = path.join(__dirname, '..', '..', 'data', 'nexus-events.jsonl');
    if (!fs.existsSync(logPath)) {
      console.log('Projection Engine: Event store file does not exist, nothing to replay.');
      return;
    }

    const content = fs.readFileSync(logPath, 'utf8');
    const lines = content.split('\n');
    let count = 0;

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event: NexusEvent = JSON.parse(line);
        await this.project(event);
        count++;
      } catch (err: any) {
        console.error('Projection Engine Replay: Failed to parse or project event line:', err.message);
      }
    }

    console.log(`Projection Engine: Replay completed successfully. Projected ${count} events.`);
  }

  private purgeDir(dirPath: string) {
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        const curPath = path.join(dirPath, file);
        if (fs.lstatSync(curPath).isFile()) {
          fs.unlinkSync(curPath);
        }
      }
    }
  }
}

export const globalProjectionEngine = new ProjectionEngine();
