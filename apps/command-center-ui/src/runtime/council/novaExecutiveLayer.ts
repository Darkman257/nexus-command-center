import { globalAlKindiLayer } from './alKindiLayer';
import { globalIbnHaythamLayer, type VerifiedObservation } from './ibnHaythamLayer';

export interface ExecutiveSummary {
  id: string;
  message: string;
  confidence: number;
  type: 'insight' | 'warning' | 'recommendation';
  timestamp: string;
}

class NovaExecutiveLayer {
  
  public getExecutiveInsights(): ExecutiveSummary[] {
    const rawObservations = globalAlKindiLayer.getLatestObservations();
    const verifiedObservations = globalIbnHaythamLayer.verifyObservations(rawObservations);
    
    // Filter out rejected observations
    const trustedObservations = verifiedObservations.filter(o => o.verified && o.evidenceScore >= 70);

    const summaries: ExecutiveSummary[] = trustedObservations.map(obs => {
      return this.synthesizeMessage(obs);
    });

    return summaries;
  }

  private synthesizeMessage(obs: VerifiedObservation): ExecutiveSummary {
    let message = obs.message; // fallback
    let type: 'insight' | 'warning' | 'recommendation' = 'insight';

    // Map observation types to executive, calm phrasing
    switch (obs.type) {
      case 'pattern_observation':
        message = `Pattern detected: recurring events in ${obs.relatedEntities.join(', ')}. Monitoring trajectory.`;
        type = 'insight';
        break;
      case 'operational_drift':
        message = `Operational drift noted: suppression behaviors suggest threshold misalignment.`;
        type = 'recommendation';
        break;
      case 'anomaly_hint':
      case 'weak_signal':
        message = `Weak signal isolated: irregular correlation in ${obs.relatedEntities.join(' and ')}.`;
        type = 'warning';
        break;
    }

    return {
      id: `exec-${obs.id}`,
      message,
      confidence: obs.evidenceScore,
      type,
      timestamp: obs.timestamp
    };
  }
}

export const globalNovaExecutiveLayer = new NovaExecutiveLayer();
export default globalNovaExecutiveLayer;
