import { globalPolicyEngine, PolicyViolation } from './PolicyEngine';
import { systemClock } from '../../utils/SystemClock';

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

export class ReasoningEngine {
  evaluateRecommendations(): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const violations = globalPolicyEngine.evaluateViolations();
    const now = systemClock.now();
    const expires = new Date(new Date(now).getTime() + 60000).toISOString(); // 1 minute expiry

    // Group violations by policyId or map them directly to recommendations
    for (const violation of violations) {
      if (violation.policyId === 'fleet-driver-required') {
        recommendations.push({
          id: `rec_fleet_${violation.entityId}_${Math.random().toString(36).substring(2, 7)}`,
          severity: violation.severity,
          confidence: 0.95,
          reason: violation.message,
          actions: [
            {
              label: `Assign Driver to Vehicle`,
              command: 'AssignDriver',
              payload: {
                vehicleId: violation.entityId,
                driverName: 'Auto Assigned Driver',
                expectedVersion: 1
              }
            }
          ],
          generatedAt: now,
          expiresAt: expires
        });
      }

      if (violation.policyId === 'recruitment-approval-pending') {
        recommendations.push({
          id: `rec_recruitment_${violation.entityId}_${Math.random().toString(36).substring(2, 7)}`,
          severity: violation.severity,
          confidence: 0.85,
          reason: violation.message,
          actions: [
            {
              label: `Approve Candidate intake`,
              command: 'ApproveCandidate',
              payload: {
                candidateId: violation.entityId,
                candidateName: 'Candidate'
              }
            }
          ],
          generatedAt: now,
          expiresAt: expires
        });
      }
    }

    return recommendations;
  }
}

export const globalReasoningEngine = new ReasoningEngine();
