import type { AlKindiObservation } from './alKindiLayer';
import { globalOperationalJournal } from '../behavior/operationalJournal';

export interface VerifiedObservation extends AlKindiObservation {
  verified: boolean;
  rejectionReason?: string;
  evidenceScore: number;
}

class IbnHaythamLayer {
  
  public verifyObservations(observations: AlKindiObservation[]): VerifiedObservation[] {
    const journal = globalOperationalJournal.getOperationalPatterns();
    const verifiedList: VerifiedObservation[] = [];

    observations.forEach(obs => {
      let evidenceScore = obs.confidence;
      let verified = true;
      let rejectionReason: string | undefined;

      // 1. Weak evidence rejection
      if (evidenceScore < 65) {
        verified = false;
        rejectionReason = 'Insufficient baseline confidence.';
      }

      // 2. False-positive reduction check
      const recentFalsePositives = journal.filter(
        j => j.type === 'false_positive' && obs.relatedEntities.some(ent => JSON.stringify(j.context).includes(ent))
      );

      if (recentFalsePositives.length > 0) {
        // Drop score significantly if operator previously flagged this as false positive
        evidenceScore -= (recentFalsePositives.length * 15);
        if (evidenceScore < 60) {
          verified = false;
          rejectionReason = 'Historically flagged as false positive by operator.';
        }
      }

      // 3. Useful signal trust gain
      const recentUsefulSignals = journal.filter(
        j => j.type === 'useful_signal' && obs.relatedEntities.some(ent => JSON.stringify(j.context).includes(ent))
      );

      if (recentUsefulSignals.length > 0) {
        // Boost score if operator previously validated this
        evidenceScore += (recentUsefulSignals.length * 10);
      }

      // 4. Contradiction detection (stubbed for future expansion)
      // If we see two observations that are mutually exclusive, we lower the score.
      
      // Ensure score stays bounded
      evidenceScore = Math.max(0, Math.min(100, evidenceScore));

      verifiedList.push({
        ...obs,
        verified,
        evidenceScore,
        rejectionReason
      });
    });

    return verifiedList;
  }
}

export const globalIbnHaythamLayer = new IbnHaythamLayer();
export default globalIbnHaythamLayer;
