import { useState, useEffect } from 'react';
import { Brain, Bookmark, RefreshCw, Key, Shield, Database, Play, Square, RefreshCcw } from 'lucide-react';

import { globalOmegaBridge } from '../runtime/adapters/omegaRuntimeBridge';
import { globalMemoryStore } from '../brain/nova-memory/memoryStore';
import type { NovaMemoryState } from '../brain/nova-memory/memoryTypes';
import { globalRuntimeBus } from '../runtime/bus/runtimeBus';
import { globalRuntimeMemoryEngine } from '../runtime/memory/runtimeMemoryEngine';
import type { MemoryObservation } from '../runtime/memory/runtimeMemoryEngine';
import { globalOperationalJournal } from '../runtime/behavior/operationalJournal';
import { globalAlKindiLayer } from '../runtime/council/alKindiLayer';
import { globalIbnHaythamLayer, type VerifiedObservation } from '../runtime/council/ibnHaythamLayer';

export function RuntimeMemory() {
  // Live state connection to global memory store
  const [memState, setMemState] = useState<NovaMemoryState>(() => globalMemoryStore.getState());
  const [observations, setObservations] = useState<MemoryObservation[]>(() => globalRuntimeMemoryEngine.getAllMemory());

  // Feedback Calibration State
  const [feedbackStats, setFeedbackStats] = useState({ total: 0, useful: 0, falsePositive: 0, ignored: 0, suppression: 0 });
  const [trustAdjustments, setTrustAdjustments] = useState<VerifiedObservation[]>([]);

  // Omega Bridge State
  const [bridgeStats, setBridgeStats] = useState(() => globalOmegaBridge.getStats());

  const loadBridgeStats = () => {
    setBridgeStats(globalOmegaBridge.getStats());
  };


  const loadFeedbackData = () => {
    const entries = globalOperationalJournal.getOperationalPatterns();
    setFeedbackStats({
      total: entries.length,
      useful: entries.filter(e => e.type === 'useful_signal').length,
      falsePositive: entries.filter(e => e.type === 'false_positive').length,
      ignored: entries.filter(e => e.type === 'ignored_telemetry').length,
      suppression: entries.filter(e => e.type === 'suppression_issue').length,
    });
    const rawObs = globalAlKindiLayer.getLatestObservations();
    const verified = globalIbnHaythamLayer.verifyObservations(rawObs);
    setTrustAdjustments(verified);
  };

  useEffect(() => {
    loadFeedbackData();
    const interval = setInterval(loadFeedbackData, 5000);
    const bridgeInterval = setInterval(loadBridgeStats, 2000);
    
    // Subscribe to store updates
    const unsubscribeStore = globalMemoryStore.subscribe(() => {
      setMemState({ ...globalMemoryStore.getState() });
    });

    // Subscribe to global runtime event bus to accumulate observations in engine
    const unsubscribeBus = globalRuntimeBus.subscribe('*', (event) => {
      const payloadStr = Object.entries(event.payload)
        .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
        .join(', ');
      const formattedType = event.event_type.replace(/\./g, ' ').toUpperCase();
      const observationMsg = `${formattedType} via ${event.source} -> [${payloadStr}]`;

      globalRuntimeMemoryEngine.appendMemory(
        event.workspace,
        observationMsg,
        event.evidence_refs || []
      );

      // Refresh observations local state
      setObservations([...globalRuntimeMemoryEngine.getAllMemory()]);
    });

    return () => {
      unsubscribeStore();
      unsubscribeBus();
      clearInterval(interval);
      clearInterval(bridgeInterval);
    };
  }, []);

  const handleClearMemory = () => {
    globalMemoryStore.clearSession();
    globalRuntimeMemoryEngine.clear();
    setObservations([]);
    // Add local audit confirmation log
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    globalMemoryStore.addChat('nova', `[${ts}] MEMORY KERNEL SYNC: Local session memory cache cleared by Owner.`);
  };

  const handleResetAll = () => {
    if (window.confirm('Reset Memory Kernel to default templates?')) {
      globalMemoryStore.resetAll();
    }
  };

  const handleClearJournal = () => {
    if (window.confirm('Clear all operator behavioral feedback and reset pattern trust?')) {
      globalOperationalJournal.clear();
      loadFeedbackData();
      const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      globalMemoryStore.addChat('nova', `[${ts}] BEHAVIORAL KERNEL SYNC: Operator feedback journal cleared.`);
    }
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
      {/* Left Column: Cognitive Memory Blocks & Grouped Observations */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto', paddingRight: '4px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div className="compartment-label">[VAULT-08 COGNITION VAULT]</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <Brain size={18} style={{ color: 'var(--cyan)' }} />
            <h2 style={{ color: 'var(--text-bright)', fontSize: '0.9rem', letterSpacing: '1px', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--mono)', margin: 0 }}>
              Cognitive Memory Blocks
            </h2>
          </div>
        </div>

        {/* Current Focus Header (Archival Observation link) */}
        <div className="glass" style={{
          padding: '12px 14px',
          background: 'rgba(213,0,249,0.01)',
          borderColor: 'rgba(213,0,249,0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <span style={{ fontSize: '0.38rem', color: 'var(--purple)', fontFamily: 'var(--mono)', fontWeight: 700 }}>
            [PINNED OPERATIONAL OBJECTIVE RELATIONS]
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.48rem', fontFamily: 'var(--mono)', color: 'var(--text-bright)' }}>
            <span>FOCUS:</span>
            <span style={{ color: 'var(--cyan)' }}>{memState.owner.currentOperationalFocus}</span>
            <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
            <span>PHASE:</span>
            <span style={{ color: 'var(--purple)' }}>{memState.owner.currentPhase}</span>
          </div>
        </div>

        {/* Project Context Blocks (Memory Groupings with subtle link lines) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '0.44rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.5px', fontFamily: 'var(--mono)' }}>
            LINKED SYSTEM MEMORY ENTRIES
          </span>

          {Object.values(memState.projects).map(p => (
            <div key={p.id} className="glass" style={{
              padding: '12px',
              background: 'rgba(5, 12, 24, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              position: 'relative'
            }}>
              {/* Subtle link connection visual dot */}
              <span style={{
                position: 'absolute',
                left: '-6px',
                top: '50%',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--cyan)',
                boxShadow: '0 0 8px var(--cyan-glow)'
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.52rem', fontWeight: 800, color: 'var(--text-bright)', fontFamily: 'var(--mono)' }}>
                  {p.name.toUpperCase()} (Scope: {p.id})
                </span>
                <span style={{ fontSize: '0.38rem', fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>
                  AUDITED: {p.lastAudit.split(':')[0]}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.44rem', fontFamily: 'var(--mono)' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>OBJECTIVE: </span>
                  <span style={{ color: 'var(--text-main)' }}>{p.currentObjective}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>STATUS TRACK: </span>
                  <span style={{ color: 'var(--text-bright)' }}>{p.currentStatus}</span>
                </div>
                {p.activeIssues.length > 0 && (
                  <div>
                    <span style={{ color: 'var(--red)' }}>ACTIVE ISSUE: </span>
                    <span style={{ color: 'var(--text-bright)' }}>{p.activeIssues.join(', ')}</span>
                  </div>
                )}
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>NEXT COMMAND: </span>
                  <span style={{ color: 'var(--cyan)' }}>{p.recommendedNextStep}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Live Runtime Memory Observations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          <span style={{ fontSize: '0.44rem', fontWeight: 800, color: 'var(--cyan)', letterSpacing: '0.5px', fontFamily: 'var(--mono)' }}>
            LIVE RUNTIME OBSERVATIONS
          </span>

          {observations.length === 0 ? (
            <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '4px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '0.42rem', color: 'var(--text-muted)' }}>
              NO RUNTIME OBSERVATIONS LOGGED YET.
            </div>
          ) : (
            observations.slice().reverse().map(obs => (
              <div key={obs.memory_id} className="glass" style={{
                padding: '12px',
                background: 'rgba(0, 210, 255, 0.02)',
                borderColor: 'rgba(0, 210, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                position: 'relative'
              }}>
                {/* Connection dot */}
                <span style={{
                  position: 'absolute',
                  left: '-6px',
                  top: '50%',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--cyan)',
                  boxShadow: '0 0 8px var(--cyan-glow)'
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.52rem', fontWeight: 800, color: 'var(--cyan)', fontFamily: 'var(--mono)' }}>
                    [{obs.workspace.toUpperCase()}]
                  </span>
                  <span style={{ fontSize: '0.38rem', fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>
                    {obs.timestamp}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.44rem', fontFamily: 'var(--mono)' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>OBSERVATION: </span>
                    <span style={{ color: 'var(--text-bright)' }}>{obs.observation}</span>
                  </div>
                  {obs.source_refs.length > 0 && (
                    <div>
                      <span style={{ color: 'var(--purple)' }}>EVIDENCE REFS: </span>
                      <span style={{ color: 'var(--text-main)' }}>{obs.source_refs.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Pinned Goals & Memory Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '1px solid var(--border)', paddingLeft: '24px', height: '100%', overflowY: 'auto' }}>
        <span style={{ fontSize: '0.44rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.5px', fontFamily: 'var(--mono)' }}>
          MEMORY KERNEL CONTROL DECK
        </span>

        {/* Active Memory Stats */}
        <div className="glass" style={{ padding: '12px', background: 'rgba(0,210,255,0.01)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.44rem', fontFamily: 'var(--mono)' }}>
            <span style={{ color: 'var(--text-muted)' }}>PINNED GOALS:</span>
            <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>{memState.pinnedItems.length} ITEMS</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.44rem', fontFamily: 'var(--mono)' }}>
            <span style={{ color: 'var(--text-muted)' }}>TELEMETRY CHATS:</span>
            <span style={{ color: 'var(--purple)', fontWeight: 700 }}>{memState.session.recentChats.length} LOGS</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.44rem', fontFamily: 'var(--mono)' }}>
            <span style={{ color: 'var(--text-muted)' }}>LIVE RUNTIME MEMORIES:</span>
            <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>{observations.length} OBSERVATIONS</span>
          </div>
        </div>

        {/* Omega Bridge Control Block */}
        <div className="glass" style={{ padding: '12px', background: 'rgba(255,160,0,0.02)', border: '1px solid rgba(255,160,0,0.15)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.44rem', fontWeight: 800, color: 'var(--amber)', fontFamily: 'var(--mono)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Database size={12} />
              OMEGA BRIDGE CONTROL
            </span>
            <span style={{ fontSize: '0.38rem', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>LOCAL TEST MODE</span>
          </div>

          {/* Bridge Controls — Local Backend Bridge Mode */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '0.4rem', fontFamily: 'var(--mono)' }}>
            <span style={{ color: 'var(--text-muted)' }}>STATUS:</span>
            <span style={{ color: bridgeStats.isEnabled ? 'var(--cyan)' : 'var(--amber)', textAlign: 'right', fontWeight: 700 }}>
              {bridgeStats.isEnabled ? 'READ-ONLY ACTIVE' : 'DISABLED'}
            </span>

            <span style={{ color: 'var(--text-muted)' }}>SOURCE MODE:</span>
            <span style={{ color: bridgeStats.isEnabled ? 'var(--cyan)' : 'var(--green)', textAlign: 'right' }}>
              {bridgeStats.isEnabled ? 'OMEGA READ-ONLY' : 'MOCK / LOCAL'}
            </span>

            <span style={{ color: 'var(--text-muted)' }}>LAST POLL:</span>
            <span style={{ color: 'var(--text-bright)', textAlign: 'right' }}>{bridgeStats.lastPollTime || 'NEVER'}</span>

            <span style={{ color: 'var(--text-muted)' }}>EVENTS PUBLISHED:</span>
            <span style={{ color: 'var(--text-bright)', textAlign: 'right' }}>{bridgeStats.eventsPublishedTotal}</span>

            <span style={{ color: 'var(--text-muted)' }}>MOCK FEED:</span>
            <span style={{ color: bridgeStats.isEnabled ? 'var(--red)' : 'var(--green)', textAlign: 'right' }}>
              {bridgeStats.isEnabled ? 'PAUSED' : 'ACTIVE'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            <button
              onClick={() => { globalOmegaBridge.enable(); loadBridgeStats(); }}
              disabled={bridgeStats.isEnabled}
              style={{
                flex: 1, padding: '6px', background: bridgeStats.isEnabled ? 'rgba(0,0,0,0.2)' : 'rgba(0, 210, 255, 0.1)',
                border: '1px solid rgba(0,210,255,0.2)', color: bridgeStats.isEnabled ? 'var(--text-muted)' : 'var(--cyan)',
                fontSize: '0.38rem', fontFamily: 'var(--mono)', cursor: bridgeStats.isEnabled ? 'not-allowed' : 'pointer', borderRadius: '2px',
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px'
              }}>
              <Play size={10} /> ENABLE
            </button>
            <button
              onClick={() => { globalOmegaBridge.disable(); loadBridgeStats(); }}
              disabled={!bridgeStats.isEnabled}
              style={{
                flex: 1, padding: '6px', background: !bridgeStats.isEnabled ? 'rgba(0,0,0,0.2)' : 'rgba(255, 23, 68, 0.1)',
                border: '1px solid rgba(255,23,68,0.2)', color: !bridgeStats.isEnabled ? 'var(--text-muted)' : 'var(--red)',
                fontSize: '0.38rem', fontFamily: 'var(--mono)', cursor: !bridgeStats.isEnabled ? 'not-allowed' : 'pointer', borderRadius: '2px',
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px'
              }}>
              <Square size={10} /> DISABLE
            </button>
            <button
              onClick={async () => { await globalOmegaBridge.pollOnce(); loadBridgeStats(); }}
              style={{
                flex: 1, padding: '6px', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-bright)',
                fontSize: '0.38rem', fontFamily: 'var(--mono)', cursor: 'pointer', borderRadius: '2px',
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px'
              }}>
              <RefreshCcw size={10} /> POLL ONCE
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.32rem', fontFamily: 'var(--mono)', color: 'var(--red)', marginTop: '4px' }}>
            <span>[READ ONLY]</span>
            <span>[NO WRITES]</span>
            <span>[LOCAL BRIDGE: 127.0.0.1:5057]</span>
          </div>
        </div>


        {/* Clear/Reset Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleClearMemory}
            style={{
              flex: 1,
              background: 'rgba(0, 210, 255, 0.08)',
              border: '1px solid rgba(0, 210, 255, 0.2)',
              color: 'var(--cyan)',
              fontFamily: 'var(--mono)',
              fontSize: '0.44rem',
              fontWeight: 600,
              padding: '10px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Shield size={10} /> Clear Cache
          </button>
          <button
            onClick={handleResetAll}
            style={{
              flex: 1,
              background: 'rgba(255, 23, 68, 0.06)',
              border: '1px solid rgba(255, 23, 68, 0.15)',
              color: 'var(--red)',
              fontFamily: 'var(--mono)',
              fontSize: '0.44rem',
              fontWeight: 600,
              padding: '10px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={10} /> Reset Kernel
          </button>
        </div>

        {/* Feedback Calibration Summary Panel */}
        <div className="glass" style={{ padding: '12px', background: 'rgba(0, 210, 255, 0.02)', border: '1px solid rgba(0, 210, 255, 0.15)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.44rem', fontWeight: 800, color: 'var(--cyan)', fontFamily: 'var(--mono)' }}>
              FEEDBACK CALIBRATION SUMMARY
            </span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '0.4rem', fontFamily: 'var(--mono)' }}>
            <span style={{ color: 'var(--text-muted)' }}>TOTAL ENTRIES:</span>
            <span style={{ color: 'var(--text-bright)', textAlign: 'right' }}>{feedbackStats.total}</span>
            
            <span style={{ color: 'var(--text-muted)' }}>USEFUL/VALIDATED:</span>
            <span style={{ color: 'var(--green)', textAlign: 'right' }}>{feedbackStats.useful}</span>
            
            <span style={{ color: 'var(--text-muted)' }}>FALSE POSITIVES:</span>
            <span style={{ color: 'var(--red)', textAlign: 'right' }}>{feedbackStats.falsePositive}</span>
            
            <span style={{ color: 'var(--text-muted)' }}>IGNORED/SUPPRESSED:</span>
            <span style={{ color: 'var(--amber)', textAlign: 'right' }}>{feedbackStats.ignored + feedbackStats.suppression}</span>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.38rem', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>IBN AL-HAYTHAM TRUST PREVIEW</span>
            {trustAdjustments.length === 0 ? (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.38rem', fontFamily: 'var(--mono)', color: 'var(--text-main)' }}>
                   <span>PowerShield.Ingress.Verified (Trusted)</span>
                   <span style={{ color: 'var(--green)' }}>+22%</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.38rem', fontFamily: 'var(--mono)', color: 'var(--text-main)' }}>
                   <span>Omega.Attendance.Delay (False Positive)</span>
                   <span style={{ color: 'var(--red)' }}>-45%</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.38rem', fontFamily: 'var(--mono)', color: 'var(--text-main)' }}>
                   <span>Fleet.Log.Warning (Auto-Suppressed)</span>
                   <span style={{ color: 'var(--amber)' }}>-12%</span>
                 </div>
               </div>
            ) : (
              trustAdjustments.slice(0, 4).map(adj => {
                const diff = adj.evidenceScore - adj.confidence;
                const color = diff > 0 ? 'var(--green)' : diff < 0 ? 'var(--red)' : 'var(--text-muted)';
                const sign = diff > 0 ? '+' : diff < 0 ? '' : '±';
                return (
                  <div key={adj.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.38rem', fontFamily: 'var(--mono)', color: 'var(--text-main)' }}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>{adj.relatedEntities[0] || 'Unknown'}</span>
                    <span style={{ color }}>{sign}{Math.round(diff)}%</span>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={handleClearJournal}
            style={{
              marginTop: '4px',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-muted)',
              fontFamily: 'var(--mono)',
              fontSize: '0.38rem',
              padding: '6px',
              borderRadius: '2px',
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            CLEAR BEHAVIORAL JOURNAL
          </button>
        </div>

        {/* Timeline Recall logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minHeight: '140px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Bookmark size={10} style={{ color: 'var(--purple)' }} />
            <span style={{ fontSize: '0.38rem', fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>RECENT SESSION ACTION LOGS</span>
          </div>
          <div style={{
            flex: 1,
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.02)',
            borderRadius: '4px',
            padding: '8px',
            fontFamily: 'var(--mono)',
            fontSize: '0.42rem',
            color: 'var(--text-main)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            {memState.session.lastActions.length === 0 ? (
              <span style={{ color: '#445467', fontSize: '0.4rem' }}>NO ACTION PATHS LOGGED YET.</span>
            ) : (
              memState.session.lastActions.map((act, i) => (
                <div key={i} style={{ color: 'var(--text-main)' }}>&gt; {act}</div>
              ))
            )}
          </div>
        </div>

        {/* Active Core Memory Matrix (Eliminating empty void at right lower console of Runtime Memory) */}
        <div className="glass" style={{
          padding: '10px 12px',
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(0, 210, 255, 0.12)',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
            <span style={{ fontSize: '0.4rem', fontFamily: 'var(--mono)', color: 'var(--cyan)', fontWeight: 800 }}>
              NEURAL COGNITION MATRIX DUMP
            </span>
            <span style={{ fontSize: '0.36rem', fontFamily: 'var(--mono)', color: 'var(--cyan)' }}>HEAPS: 4 ACTIVE</span>
          </div>
          <div className="hex-dump-matrix" style={{ maxHeight: '64px', overflowY: 'hidden', opacity: 0.65 }}>
            0x08F2A0: 4F 4D 45 47 41 20 44 41 54 41 20 53 59 4E 43 20   OMEGA DATA SYNC{"\n"}
            0x08F2B0: 41 54 54 45 4E 44 41 4E 43 45 20 4C 4F 47 53 20   ATTENDANCE LOGS{"\n"}
            0x08F2C0: 53 55 50 50 52 45 53 53 49 4F 4E 20 41 52 4D 45   SUPPRESSION ARME
          </div>
        </div>

        {/* Security instructions */}
        <div className="glass" style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.42rem', color: 'var(--purple)', fontWeight: 700 }}>
            <Key size={10} />
            <span>COGNITIVE KEY POLICY</span>
          </div>
          <p style={{ fontSize: '0.44rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.4 }}>
            Local advisor memory is securely locked behind sanitization regex nodes to auto-censor secrets before writing to cache arrays.
          </p>
        </div>
      </div>
    </section>
  );
}
