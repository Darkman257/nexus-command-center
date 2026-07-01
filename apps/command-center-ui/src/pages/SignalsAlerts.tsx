import { useState, useEffect } from 'react';
import { Bell, ShieldAlert, AlertTriangle, CheckCircle, Terminal, Copy, Bookmark } from 'lucide-react';
import { globalRuntimeBus } from '../runtime/bus/runtimeBus';
import { signalPipeline } from '../runtime/signals/signalPipeline';
import type { QualifiedSignal } from '../runtime/signals/signalPipeline';
import { globalEvidenceRegistry } from '../runtime/evidence/evidenceRegistry';
import { globalSuppressionEngine } from '../runtime/signals/suppressionEngine';
import { globalObservabilityCore } from '../runtime/observability/observabilityCore';
import { globalDriftDetector } from '../runtime/observability/driftDetector';
import { globalOperationalJournal } from '../runtime/behavior/operationalJournal';

const actionBtnStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: 'var(--text-muted)',
  fontSize: '0.38rem',
  fontFamily: 'var(--mono)',
  padding: '4px 8px',
  borderRadius: '2px',
  cursor: 'pointer'
};

export function SignalsAlerts() {
  const [signals, setSignals] = useState<QualifiedSignal[]>([
    {
      signal_id: 'sig-01',
      title: 'Bridge Daemon Connection Error',
      source: 'NEXUS RUNTIME BRIDGE',
      severity: 'CRITICAL',
      description: 'The local Bridge Daemon is unreachable on port 9999. Ingestion hooks and chat pipelines are offline.',
      timestamp: '2m ago',
      confidence: 1.0,
      evidence_refs: ['bridge-daemon-process'],
      event_id: 'evt-bridge-01',
      correlations: ['bridge.daemon.unreachable'],
      recommendation: 'Restart Bridge Daemon service immediately and verify port 9999 is unblocked.'
    },
    {
      signal_id: 'sig-02',
      title: 'Omega Gateway Unknown State',
      source: 'OMEGA OMEGA-OPS',
      severity: 'WARNING',
      description: 'The operational dashboard is verified online, but the local data synchronization port is locked.',
      timestamp: '15m ago',
      confidence: 0.95,
      evidence_refs: ['omega-gateway-ping'],
      event_id: 'evt-omega-01',
      correlations: ['omega.ops.unknown'],
      recommendation: 'Check Omega Ops database synchronization logs.'
    },
    {
      signal_id: 'sig-03',
      title: 'Recruitment Hub Pipeline Inactive',
      source: 'RECRUITMENT STORAGE',
      severity: 'WARNING',
      description: 'No active webhooks registered for candidate PDF parsing folder ~/NEXUS/mail-intake/omega-cvs.',
      timestamp: '1h ago',
      confidence: 0.95,
      evidence_refs: ['omega-cvs-watchdog'],
      event_id: 'evt-recruit-01',
      correlations: ['recruitment.hub.inactive'],
      recommendation: 'Verify n8n webhook status for mail ingress.'
    }
  ]);

  const [leakagePercent] = useState(18);
  const [approvalLatency] = useState(42);
  const [feedbackState, setFeedbackState] = useState<Record<string, string>>({});

  const handleFeedback = (sig: QualifiedSignal, type: 'useful_signal' | 'false_positive' | 'ignored_telemetry' | 'suppression_issue') => {
    const context = {
      signal_id: sig.signal_id,
      event_id: sig.event_id || sig.signal_id,
      title: sig.title,
      workspace: sig.source,
      severity: sig.severity,
      confidence: sig.confidence,
      evidence_refs: sig.evidence_refs || [],
      timestamp: new Date().toISOString(),
      note: ''
    };

    if (type === 'useful_signal') globalOperationalJournal.logUsefulSignal(context);
    else if (type === 'false_positive') globalOperationalJournal.logFalsePositive(context);
    else if (type === 'ignored_telemetry') globalOperationalJournal.logIgnoredTelemetry(context);
    else if (type === 'suppression_issue') globalOperationalJournal.logSuppressionIssue(context);

    setFeedbackState(prev => ({ ...prev, [sig.signal_id]: 'Feedback recorded' }));
    
    setTimeout(() => {
      setFeedbackState(prev => {
        const next = { ...prev };
        delete next[sig.signal_id];
        return next;
      });
    }, 3000);
  };

  // Subscribe to live event bus & pipeline qualification
  useEffect(() => {
    const unsub = globalRuntimeBus.subscribe('*', (event) => {
      // 1. Pass raw event to parser pipeline
      const qualified = signalPipeline.qualifyEvent(event);
      if (qualified) {
        // Record all qualified signals in Observability Core metrics
        globalObservabilityCore.recordSignalSeverity(qualified.severity);

        // Run suppression evaluation to eliminate duplicate warning storm noise
        const decision = globalSuppressionEngine.evaluateSignal(qualified);

        // Record drift analysis inputs for sensor telemetry drift tracking
        globalDriftDetector.recordIngestionSignal(qualified.source, decision.shouldSuppress);
        globalDriftDetector.recordParserExecution(qualified.confidence);

        if (decision.shouldSuppress) {
          return;
        }

        // 2. Register Evidence
        const evidenceId = globalEvidenceRegistry.registerEvidence(
          qualified.source,
          event.event_type,
          event.payload
        );
        // Link signal to evidence
        globalEvidenceRegistry.linkSignalToEvidence(evidenceId, qualified.signal_id);
        
        // 3. Prepend qualified warning/anomalies to state list
        setSignals(prev => [qualified, ...prev].slice(0, 30));
      }
    });

    return unsub;
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <section className="nova-center-core" style={{
      gridColumn: 'center / span 2',
      background: 'rgba(3, 8, 16, 0.4)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '24px',
      display: 'grid',
      gridTemplateColumns: '1.2fr 0.8fr',
      gap: '24px',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Left Column: Alerts Feed & Copyable snippets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto', paddingRight: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={18} style={{ color: 'var(--cyan)' }} />
          <h2 style={{ color: 'var(--text-bright)', fontSize: '0.9rem', letterSpacing: '1px', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--mono)', margin: 0 }}>
            Operational Signals & Alerts
          </h2>
        </div>

        {/* Alerts Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {signals.map(sig => {
            const isCritical = sig.severity === 'CRITICAL';
            const isRisk = sig.severity === 'RISK';
            const isWarning = sig.severity === 'WARNING';
            const isObservation = sig.severity === 'OBSERVATION';

            const color = isCritical 
              ? 'var(--red)' 
              : isRisk 
                ? '#FF3D00' 
                : isWarning 
                  ? 'var(--amber)' 
                  : isObservation 
                    ? 'var(--purple)' 
                    : 'var(--cyan)';

            const bg = isCritical 
              ? 'rgba(255, 23, 68, 0.08)' 
              : isRisk 
                ? 'rgba(255, 61, 0, 0.06)' 
                : isWarning 
                  ? 'rgba(255, 171, 0, 0.05)' 
                  : isObservation 
                    ? 'rgba(213, 0, 249, 0.04)' 
                    : 'rgba(0, 210, 255, 0.03)';

            const border = isCritical 
              ? 'rgba(255, 23, 68, 0.2)' 
              : isRisk 
                ? 'rgba(255, 61, 0, 0.15)' 
                : isWarning 
                  ? 'rgba(255, 171, 0, 0.12)' 
                  : isObservation 
                    ? 'rgba(213, 0, 249, 0.1)' 
                    : 'rgba(0, 210, 255, 0.08)';

            return (
              <div key={sig.signal_id} className="glass" style={{
                padding: '12px 14px',
                background: bg,
                borderColor: border,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isCritical && <ShieldAlert size={12} style={{ color }} />}
                    {isRisk && <ShieldAlert size={12} style={{ color }} />}
                    {isWarning && <AlertTriangle size={12} style={{ color }} />}
                    {isObservation && <Bookmark size={12} style={{ color }} />}
                    {!isCritical && !isRisk && !isWarning && !isObservation && <CheckCircle size={12} style={{ color }} />}
                    <span style={{ fontSize: '0.42rem', fontFamily: 'var(--mono)', color, fontWeight: 800 }}>
                      {sig.source.toUpperCase()}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.38rem', fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>
                    {sig.timestamp}
                  </span>
                </div>

                <div style={{ fontSize: '0.52rem', fontWeight: 800, color: 'var(--text-bright)', fontFamily: 'var(--mono)' }}>
                  {sig.title}
                </div>

                <p style={{ fontSize: '0.46rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.4 }}>
                  {sig.description}
                </p>

                {/* Evidence Trace & Confidence scores */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.4rem',
                  fontFamily: 'var(--mono)',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid rgba(255,255,255,0.03)',
                  paddingTop: '6px',
                  marginTop: '4px'
                }}>
                  <span>CONFIDENCE: <strong style={{ color }}>{Math.round(sig.confidence * 100)}%</strong></span>
                  <span>TRACED BY: <strong style={{ color: 'var(--text-main)' }}>{sig.evidence_refs.join(', ')}</strong></span>
                </div>

                {/* Recommendation */}
                {sig.recommendation && (
                  <div style={{
                    fontSize: '0.42rem',
                    fontFamily: 'var(--mono)',
                    color: 'var(--cyan)',
                    background: 'rgba(0, 210, 255, 0.05)',
                    padding: '6px',
                    borderRadius: '2px',
                    borderLeft: '2px solid var(--cyan)',
                    marginTop: '2px'
                  }}>
                    <strong>RECOMMENDED ACTION:</strong> {sig.recommendation}
                  </div>
                )}

                {/* Feedback Actions Strip */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '4px',
                  paddingTop: '6px'
                }}>
                  {feedbackState[sig.signal_id] ? (
                    <span style={{ fontSize: '0.4rem', color: 'var(--green)', fontFamily: 'var(--mono)' }}>
                      {feedbackState[sig.signal_id]}
                    </span>
                  ) : (
                    <>
                      <button onClick={() => handleFeedback(sig, 'useful_signal')} style={actionBtnStyle}>VALIDATE</button>
                      <button onClick={() => handleFeedback(sig, 'false_positive')} style={actionBtnStyle}>FALSE POSITIVE</button>
                      <button onClick={() => handleFeedback(sig, 'ignored_telemetry')} style={actionBtnStyle}>IGNORE</button>
                      <button onClick={() => handleFeedback(sig, 'suppression_issue')} style={actionBtnStyle}>SUPPRESS</button>
                    </>
                  )}
                </div>

                {sig.commandSnippet && (
                  <div style={{
                    marginTop: '4px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255,255,255,0.03)',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontFamily: 'var(--mono)',
                    fontSize: '0.42rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--cyan)' }}>
                      <Terminal size={10} />
                      <pre style={{ margin: 0 }}>{sig.commandSnippet}</pre>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(sig.commandSnippet!)}
                      style={{ background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex' }}
                      title="Copy Diagnostic Snippet"
                    >
                      <Copy size={10} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Leakage progress metrics & Status */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: '1px solid var(--border)', paddingLeft: '24px', height: '100%', overflowY: 'auto' }}>
        <span style={{ fontSize: '0.44rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.5px', fontFamily: 'var(--mono)' }}>
          LEAKAGE & APPROVAL HUDS
        </span>

        {/* Metric 1 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.44rem', fontFamily: 'var(--mono)' }}>
            <span style={{ color: 'var(--text-muted)' }}>OPERATIONAL DATA RISK:</span>
            <span style={{ color: 'var(--amber)', fontWeight: 700 }}>{leakagePercent}%</span>
          </div>
          <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
            <div style={{ height: '100%', background: 'var(--amber)', width: `${leakagePercent}%`, borderRadius: '2px' }} />
          </div>
          <span style={{ fontSize: '0.38rem', color: 'var(--text-muted)' }}>
            Evaluated by active clearance filters
          </span>
        </div>

        {/* Metric 2 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.44rem', fontFamily: 'var(--mono)' }}>
            <span style={{ color: 'var(--text-muted)' }}>APPROVAL NODE LATENCY:</span>
            <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>{approvalLatency} MIN</span>
          </div>
          <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
            <div style={{ height: '100%', background: 'var(--cyan)', width: `${approvalLatency}%`, borderRadius: '2px' }} />
          </div>
          <span style={{ fontSize: '0.38rem', color: 'var(--text-muted)' }}>
            Average queue time for recruitment audits
          </span>
        </div>

        {/* Cyberpunk warning box */}
        <div className="glass" style={{
          padding: '10px',
          background: 'rgba(255, 23, 68, 0.02)',
          borderColor: 'rgba(255, 23, 68, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          marginTop: '10px'
        }}>
          <span style={{ fontSize: '0.42rem', color: 'var(--red)', fontWeight: 700, fontFamily: 'var(--mono)' }}>
            CRITICAL DISCLOSURE
          </span>
          <p style={{ fontSize: '0.44rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.4 }}>
            System locks are automatically armed if unauthorized API requests or migration schemas are injected without developer signature tags.
          </p>
        </div>
      </div>
    </section>
  );
}
