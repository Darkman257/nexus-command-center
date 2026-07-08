import { globalMemoryRepository } from '../memory/MemoryRepository';
import { systemClock } from '../utils/SystemClock';
import { logViolations } from './ComplianceLogger';

export interface RecommendationAction {
  label: string;
  command: string;
  payload: Record<string, unknown>;
}

export interface Recommendation {
  id: string;
  severity: 'info' | 'warn' | 'critical';
  confidence: number;
  reason: string;
  actions: RecommendationAction[];
  generatedAt: string;
  expiresAt: string;
}

export class DecisionEngine {
  evaluate(): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const entities = globalMemoryRepository.getEntities();
    const now = systemClock.now();
    const expires = new Date(new Date(now).getTime() + 60000).toISOString(); // 1 minute lifespan

    // 1. Rule: Active vehicles missing drivers
    const vehicles = entities.filter(e => e.type === 'vehicle');
    const unassignedVehicles = vehicles.filter(v => !v.driver);

    if (unassignedVehicles.length > 0) {
      recommendations.push({
        id: `rec_veh_${Math.random().toString(36).substring(2, 9)}`,
        severity: 'warn',
        confidence: 0.95,
        reason: `FLEET: Detect ${unassignedVehicles.length} active vehicle(s) missing driver assignments.`,
        actions: unassignedVehicles.map(v => ({
          label: `Assign driver to ${v.name || v.id}`,
          command: 'AssignDriver',
          payload: {
            vehicleId: v.id,
            vehicleName: v.name || 'Vehicle',
            driverName: 'Auto Assigned Driver',
          }
        })),
        generatedAt: now,
        expiresAt: expires,
      });
    }

    // 2. Rule: Candidate recruitment approval queues
    const candidates = entities.filter(e => e.type === 'candidate');
    const pendingCandidates = candidates.filter(c => c.status === 'Pending' || c.status === 'pending');

    if (pendingCandidates.length > 0) {
      recommendations.push({
        id: `rec_cand_${Math.random().toString(36).substring(2, 9)}`,
        severity: 'info',
        confidence: 0.85,
        reason: `RECRUITMENT: ${pendingCandidates.length} candidate approvals are pending in queue.`,
        actions: pendingCandidates.map(c => ({
          label: `Approve Candidate: ${c.name}`,
          command: 'ApproveCandidate',
          payload: {
            candidateId: c.id,
            candidateName: c.name,
          }
        })),
        generatedAt: now,
        expiresAt: expires,
      });
    }

    return recommendations;
  }

  /**
   * Evaluates violations AND persists them to the compliance archive.
   * Use this instead of evaluate() whenever a permanent audit record is needed.
   */
  async evaluateAndLog(
    context: { projectId?: string; workspace?: string } = {}
  ): Promise<Recommendation[]> {
    const recommendations = this.evaluate();

    if (recommendations.length > 0) {
      // Fire-and-forget persistence — non-blocking
      logViolations(recommendations, context).catch(err => {
        console.error('[DecisionEngine] Failed to persist compliance log:', err);
      });
    }

    return recommendations;
  }
}

export const globalDecisionEngine = new DecisionEngine();

