

export interface SourceDriftReport {
  sourceName: string;
  totalSignalsQualified: number;
  totalSuppressed: number;
  suppressionRatio: number;
  isAnomalousNoisy: boolean;
}

class DriftDetector {
  private sourceSignalsHistory: Record<string, { total: number; suppressed: number }> = {};
  private parserAttempts = 0;
  private parserFailures = 0; // low confidence or invalid metadata

  recordIngestionSignal(source: string, isSuppressed: boolean) {
    if (!this.sourceSignalsHistory[source]) {
      this.sourceSignalsHistory[source] = { total: 0, suppressed: 0 };
    }
    this.sourceSignalsHistory[source].total++;
    if (isSuppressed) {
      this.sourceSignalsHistory[source].suppressed++;
    }
  }

  recordParserExecution(confidence: number) {
    this.parserAttempts++;
    if (confidence < 0.85) {
      this.parserFailures++;
    }
  }

  getDriftReport(): {
    sourcesDrift: SourceDriftReport[];
    parserDegradationIndex: number; // percentage of parser execution anomalies (0-100)
    abnormalBehaviorsLogged: string[];
  } {
    const sourcesDrift: SourceDriftReport[] = Object.entries(this.sourceSignalsHistory).map(
      ([sourceName, stats]) => {
        const ratio = stats.total > 0 ? stats.suppressed / stats.total : 0;
        return {
          sourceName,
          totalSignalsQualified: stats.total,
          totalSuppressed: stats.suppressed,
          suppressionRatio: parseFloat((ratio * 100).toFixed(1)),
          isAnomalousNoisy: ratio > 0.70 && stats.total >= 4 // Flag as noisy if >70% warnings are suppressed duplicates
        };
      }
    );

    const parserDegradationIndex = this.parserAttempts > 0
      ? Math.round((this.parserFailures / this.parserAttempts) * 100)
      : 0;

    const abnormalBehaviorsLogged: string[] = [];
    sourcesDrift.forEach(src => {
      if (src.isAnomalousNoisy) {
        abnormalBehaviorsLogged.push(
          `Drift Warning: Telemetry node "${src.sourceName}" exhibits abnormally repetitive duplicate flutters (${src.suppressionRatio}% alerts suppressed).`
        );
      }
    });

    if (parserDegradationIndex > 30) {
      abnormalBehaviorsLogged.push(
        `Parser Degradation Anomaly: ${parserDegradationIndex}% of recent manual ingestion uploads registered low qualification confidence.`
      );
    }

    return {
      sourcesDrift,
      parserDegradationIndex,
      abnormalBehaviorsLogged
    };
  }
}

export const globalDriftDetector = new DriftDetector();
export default globalDriftDetector;
