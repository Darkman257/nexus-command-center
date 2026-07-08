import { globalMemoryRepository } from '../../memory/MemoryRepository';
import { systemClock } from '../../utils/SystemClock';

export interface PolicyViolation {
  id: string;
  policyId: string;
  entityId: string;
  entityType: string;
  severity: 'info' | 'warn' | 'critical';
  message: string;
  detectedAt: string;
}

export class PolicyEngine {
  evaluateViolations(): PolicyViolation[] {
    const violations: PolicyViolation[] = [];
    const entities = globalMemoryRepository.getEntities();
    const now = systemClock.now();

    // Policy 1: Vehicle must have an assigned driver (Fleet.AssignDriver)
    const vehicles = entities.filter(e => e.type === 'vehicle');
    for (const v of vehicles) {
      if (!v.driver) {
        violations.push({
          id: `viol_fleet_${v.id}_${Math.random().toString(36).substring(2, 7)}`,
          policyId: 'fleet-driver-required',
          entityId: v.id,
          entityType: 'vehicle',
          severity: 'warn',
          message: `Vehicle "${v.name || v.id}" is active but has no assigned driver.`,
          detectedAt: now
        });
      }
    }

    // Policy 2: Candidates cannot sit in 'Pending' status indefinitely
    const candidates = entities.filter(e => e.type === 'candidate');
    for (const c of candidates) {
      if (c.status === 'Pending' || c.status === 'pending') {
        violations.push({
          id: `viol_rec_${c.id}_${Math.random().toString(36).substring(2, 7)}`,
          policyId: 'recruitment-approval-pending',
          entityId: c.id,
          entityType: 'candidate',
          severity: 'info',
          message: `Candidate "${c.name}" is pending recruitment intake approval.`,
          detectedAt: now
        });
      }
    }

    return violations;
  }
}

export const globalPolicyEngine = new PolicyEngine();
