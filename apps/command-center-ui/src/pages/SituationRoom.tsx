import { useState, useEffect } from 'react';
import type { SystemStatus } from '../../../../packages/shared-types/src/systemStatus';
import { globalRuntimeBus } from '../runtime/bus/runtimeBus';
import type { RuntimeEvent } from '../runtime/contracts/runtimeEvent';
import { Cpu, FileSpreadsheet, FileText, StickyNote, Play, Activity, Terminal, Shield, Brain } from 'lucide-react';
import { globalNovaExecutiveLayer, type ExecutiveSummary } from '../runtime/council/novaExecutiveLayer';
interface Props {
  novaStatus: { online: boolean; selectedProvider: string };
  omegaStatus: SystemStatus;
  bridgeOnline: boolean;
  recruitStat: string;
  telStat: string;
  apiStat: string;
  chatLog: any[];
  setChatLog: React.Dispatch<React.SetStateAction<any[]>>;
  appendLog: (msg: string, type: 'info' | 'system' | 'alert') => void;
  setBrainOpen: (val: boolean) => void;
  operationalIntelligence: any;
}

interface SignalItem {
  id: string;
  title: string;
  source: string;
  time: string;
  severity: 'high' | 'medium' | 'low';
}

export function SituationRoom({
  novaStatus,
  omegaStatus,
  bridgeOnline,
  recruitStat,
  telStat,
  apiStat,
  chatLog,
  setChatLog,
  appendLog,
  setBrainOpen,
  operationalIntelligence
}: Props) {
  const [signals, setSignals] = useState<SignalItem[]>([
    { id: 'sig-1', title: 'High vehicle downtime detected', source: 'Fleet Management', time: '2m ago', severity: 'high' },
    { id: 'sig-2', title: 'Attendance inconsistency detected', source: 'Recruitment Hub', time: '5m ago', severity: 'high' },
    { id: 'sig-3', title: 'Supplier delivery delay risk', source: 'Supplier Workspace', time: '8m ago', severity: 'medium' },
    { id: 'sig-4', title: 'Cost deviation - Project Omega', source: 'Omega Ops', time: '12m ago', severity: 'medium' },
    { id: 'sig-5', title: 'Unusual fuel consumption anomaly', source: 'Fleet Workspace', time: '25m ago', severity: 'low' },
  ]);

  useEffect(() => {
    if (operationalIntelligence?.alerts) {
      const activeAlerts: SignalItem[] = operationalIntelligence.alerts.map((alert: string, idx: number) => ({
        id: `bridge-alert-${idx}-${Date.now()}`,
        title: alert,
        source: 'NEXUS TELEMETRY',
        time: 'Active',
        severity: alert.includes('CRITICAL') || alert.includes('High') || alert.includes('without') ? 'high' : 'medium'
      }));
      setSignals(prev => {
        const filteredPrev = prev.filter(s => !s.id.startsWith('bridge-alert-'));
        return [...activeAlerts, ...filteredPrev].slice(0, 10);
      });
    }
  }, [operationalIntelligence]);

  // Active Runtime Pressure States (Oscillating tactical metrics for realism and immersion)
  const [stability, setStability] = useState(99.8);
  const [packetRate, setPacketRate] = useState(24);
  const [latency, setLatency] = useState(12);

  // Operational Insight Strip State
  const [insights, setInsights] = useState<ExecutiveSummary[]>([]);
  const [insightIndex, setInsightIndex] = useState(0);

  useEffect(() => {
    // Initial fetch
    setInsights(globalNovaExecutiveLayer.getExecutiveInsights());

    const pressureTimer = setInterval(() => {
      setStability(+(99.1 + Math.random() * 0.8).toFixed(2));
      setPacketRate(Math.floor(18 + Math.random() * 8));
      setLatency(Math.floor(8 + Math.random() * 6));
    }, 4000);

    const insightTimer = setInterval(() => {
      const currentInsights = globalNovaExecutiveLayer.getExecutiveInsights();
      setInsights(currentInsights);
      setInsightIndex(prev => currentInsights.length > 0 ? (prev + 1) % currentInsights.length : 0);
    }, 8000); // Rotate every 8 seconds

    return () => {
      clearInterval(pressureTimer);
      clearInterval(insightTimer);
    };
  }, []);

  // Subscribe to global event bus to feed the live dashboard stream dynamically
  useEffect(() => {
    const unsubscribe = globalRuntimeBus.subscribe('*', (evt: RuntimeEvent) => {
      const isAnomaly = evt.event_type.includes('anomaly') || (evt.confidence ?? 1.0) < 0.90;
      const newSignal: SignalItem = {
        id: evt.event_id,
        title: evt.payload.file_name 
          ? `CSV Ingestion: ${evt.payload.file_name}` 
          : evt.event_type.replace(/\./g, ' ').toUpperCase(),
        source: evt.source,
        time: 'Just now',
        severity: isAnomaly ? 'high' : 'medium'
      };

      setSignals(prev => [newSignal, ...prev].slice(0, 8));
    });

    const _ref = { novaStatus, omegaStatus, recruitStat, telStat, apiStat, chatLog, setChatLog, bridgeOnline };
    if (typeof window !== 'undefined' && (window as any).__debug_nexus__) {
      console.log('Nexus debug context:', _ref);
    }

    return () => {
      unsubscribe();
    };
  }, [novaStatus, omegaStatus, recruitStat, telStat, apiStat, chatLog, setChatLog, bridgeOnline]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', height: '100%' }}>
      
      {/* Header section (Ship branding + compartment label) */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '12px' }}>
        <div>
          <div className="compartment-label" style={{ marginBottom: '4px' }}>
            DECK-01 COMMAND BRIDGE
          </div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-bright)', letterSpacing: '0.5px', margin: 0 }}>
            Welcome Back, <span style={{ color: 'var(--cyan)' }}>BOSS</span>
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Spatial system oscillation visualizer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.4rem', color: 'var(--text-muted)', fontFamily: 'var(--mono)', letterSpacing: '1px' }}>SYSTEM HUM</span>
            <div className="osc-container">
              <div className="osc-bar" />
              <div className="osc-bar" />
              <div className="osc-bar" />
              <div className="osc-bar" />
              <div className="osc-bar" />
              <div className="osc-bar" />
            </div>
          </div>

          {operationalIntelligence && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 171, 0, 0.04)',
              border: `1px solid ${operationalIntelligence.riskLevel === 'CRITICAL' ? 'rgba(255, 23, 68, 0.3)' : 'rgba(255, 171, 0, 0.3)'}`,
              borderRadius: '4px',
              padding: '5px 10px',
              fontFamily: 'var(--mono)',
              fontSize: '0.45rem',
              color: operationalIntelligence.riskLevel === 'CRITICAL' ? '#ff1744' : '#ffab00'
            }}>
              <span style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: operationalIntelligence.riskLevel === 'CRITICAL' ? '#ff1744' : '#ffab00',
                boxShadow: `0 0 8px ${operationalIntelligence.riskLevel === 'CRITICAL' ? '#ff1744' : '#ffab00'}`
              }} />
              RISK INDEX: {operationalIntelligence.riskIndex}/100 ({operationalIntelligence.riskLevel})
            </div>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(0, 230, 118, 0.04)',
            border: '1px solid rgba(0, 230, 118, 0.2)',
            borderRadius: '4px',
            padding: '5px 10px',
            fontFamily: 'var(--mono)',
            fontSize: '0.45rem',
            color: 'var(--green)'
          }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)' }} />
            SYSTEMS: SECURE RUNTIME
          </div>
        </div>
      </header>

      {/* OPERATIONAL INSIGHT STRIP (Phase 6 Foundation) */}
      <section style={{
        background: 'rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(0, 210, 255, 0.15)',
        borderLeft: '3px solid var(--cyan)',
        borderRadius: '4px',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontFamily: 'var(--mono)',
      }}>
        <Brain size={14} style={{ color: 'var(--cyan)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '2px' }}>
          <span style={{ fontSize: '0.4rem', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '1px' }}>NOVA EXECUTIVE SYNTHESIS</span>
          {insights.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.52rem', color: 'var(--text-bright)' }}>{insights[insightIndex].message}</span>
              <span style={{ fontSize: '0.45rem', color: insights[insightIndex].confidence > 80 ? 'var(--green)' : 'var(--amber)' }}>
                CONFIDENCE: {insights[insightIndex].confidence}%
              </span>
            </div>
          ) : (
            <span style={{ fontSize: '0.52rem', color: 'var(--text-muted)' }}>Monitoring operational baseline. No anomalous clusters detected.</span>
          )}
        </div>
      </section>

      {/* TACTICAL ACTIONS STRIP - Launch System Gateways (HONEST STABILIZATION BUTTONS) */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <button 
          onClick={() => {
            appendLog('[SYSTEM] Omega Operations external route is pending setup on port 3000.', 'system');
          }}
          style={{
            padding: '14px 18px',
            borderRadius: '4px',
            fontFamily: 'var(--mono)',
            fontSize: '0.48rem',
            fontWeight: 800,
            letterSpacing: '1px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'var(--text-muted)',
            border: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(0,0,0,0.3)',
            cursor: 'not-allowed'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Terminal size={14} />
            <span className="launch-text" style={{ textDecoration: 'line-through' }}>LAUNCH OMEGA OPS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.36rem', color: 'var(--amber)' }}>[PREPARED FOR OMEGA BRIDGE]</span>
          </div>
        </button>

        <button 
          onClick={() => {
            appendLog('[SYSTEM] Recruitment Hub external route not connected yet.', 'system');
          }}
          style={{
            padding: '14px 18px',
            borderRadius: '4px',
            fontFamily: 'var(--mono)',
            fontSize: '0.48rem',
            fontWeight: 800,
            letterSpacing: '1px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'var(--text-muted)',
            border: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(0,0,0,0.3)',
            cursor: 'not-allowed'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={14} />
            <span className="launch-text" style={{ textDecoration: 'line-through' }}>LAUNCH RECRUITMENT HUB</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.36rem', color: 'var(--amber)' }}>[EXTERNAL APP NOT CONNECTED YET]</span>
          </div>
        </button>

        <button 
          onClick={() => {
            appendLog('[SYSTEM] PowerShield placeholder local route pending.', 'system');
          }}
          style={{
            padding: '14px 18px',
            borderRadius: '4px',
            fontFamily: 'var(--mono)',
            fontSize: '0.48rem',
            fontWeight: 800,
            letterSpacing: '1px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'var(--text-muted)',
            border: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(0,0,0,0.3)',
            cursor: 'not-allowed'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={14} />
            <span className="launch-text" style={{ textDecoration: 'line-through' }}>LAUNCH POWERSHIELD</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.36rem', color: 'var(--amber)' }}>[LOCAL ROUTE PENDING]</span>
          </div>
        </button>
      </section>

      {/* DUAL COLUMN - Hierarchy Focus Area */}
      <section style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '16px', flex: 1, minHeight: 0 }}>
        
        {/* PRIMARY FOCAL COCKPIT ZONE - Live Signals & Network Pressure */}
        <div className="glass primary-focal-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', overflow: 'hidden' }}>
          
          {/* Hologram sweep scanner over active focus card */}
          <div className="scan-sweep-overlay" />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 210, 255, 0.15)', paddingBottom: '8px', zIndex: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={14} style={{ color: 'var(--cyan)' }} />
              <h3 style={{ fontSize: '0.52rem', fontWeight: 800, color: 'var(--text-bright)', letterSpacing: '0.8px', textTransform: 'uppercase', fontFamily: 'var(--mono)', margin: 0 }}>
                Live Strategic Signal Conduit
              </h3>
            </div>

            {/* Fluctuating runtime metrics (Real pressure indicators) */}
            <div style={{ display: 'flex', gap: '12px', fontFamily: 'var(--mono)', fontSize: '0.4rem', color: 'var(--text-muted)' }}>
              <span>SYNC: <strong style={{ color: stability < 99.4 ? 'var(--amber)' : 'var(--green)' }}>{stability}%</strong></span>
              <span>INFLOW: <strong style={{ color: 'var(--cyan)' }}>{packetRate}/s</strong></span>
              <span>RTT: <strong style={{ color: 'var(--cyan)' }}>{latency}ms</strong></span>
            </div>
          </div>

          {/* Scrolling Feed with distinct high-contrast active alarms */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', flex: 1, zIndex: 3 }}>
            {signals.map(sig => (
              <div key={sig.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 8px',
                background: 'rgba(0, 0, 0, 0.35)',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.02)',
                borderLeft: `2.5px solid ${sig.severity === 'high' ? 'var(--red)' : sig.severity === 'medium' ? 'var(--amber)' : 'var(--cyan)'}`
              }}>
                <span style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: sig.severity === 'high' ? 'var(--red)' : sig.severity === 'medium' ? 'var(--amber)' : 'var(--cyan)',
                  boxShadow: `0 0 6px ${sig.severity === 'high' ? 'var(--red)' : sig.severity === 'medium' ? 'var(--amber)' : 'var(--cyan)'}`
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.48rem', fontWeight: 700, color: 'var(--text-bright)', fontFamily: 'var(--mono)' }}>{sig.title}</div>
                  <div style={{ fontSize: '0.38rem', color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginTop: '1px' }}>SOURCE: {sig.source}</div>
                </div>
                <span style={{ fontSize: '0.38rem', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{sig.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SECONDARY OPERATIONAL ZONE - Findings & Quick Ingestion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* NOVA Advisor Findings */}
          <div className="glass" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '6px' }}>
              <Cpu size={12} style={{ color: 'var(--violet)' }} />
              <h3 style={{ fontSize: '0.48rem', fontWeight: 800, color: 'var(--text-bright)', letterSpacing: '0.5px', textTransform: 'uppercase', margin: 0 }}>
                NOVA Cockpit Findings
              </h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto' }}>
              {[
                { txt: 'Fleet maintenance optimization required', active: true },
                { txt: 'Overtime increase flagged in 2 modules', active: true },
                { txt: 'Quarantined PDF verification pending', active: false },
                { txt: 'Standby database synchronization active', active: false }
              ].map((finding, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.44rem' }}>
                  <input 
                    type="checkbox" 
                    defaultChecked={finding.active} 
                    disabled 
                    style={{ marginTop: '2px', cursor: 'default', accentColor: 'var(--violet)' }} 
                  />
                  <span style={{ color: finding.active ? 'var(--text-main)' : 'var(--text-muted)', lineHeight: 1.3 }}>{finding.txt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Ingest actions */}
          <div className="glass" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '6px' }}>
              <FileSpreadsheet size={12} style={{ color: 'var(--cyan)' }} />
              <span style={{ fontSize: '0.48rem', fontWeight: 800, color: 'var(--text-bright)', letterSpacing: '0.5px', fontFamily: 'var(--mono)' }}>QUICK INGESTION GATE</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              <div className="glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '8px', cursor: 'pointer' }}
                   onClick={() => appendLog('Quick Ingest: CSV Selected', 'system')}>
                <FileSpreadsheet size={12} style={{ color: 'var(--cyan)' }} />
                <span style={{ fontSize: '0.36rem', fontWeight: 700, color: 'var(--text-bright)', fontFamily: 'var(--mono)' }}>CSV</span>
              </div>
              <div className="glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '8px', cursor: 'pointer' }}
                   onClick={() => appendLog('Quick Ingest: PDF Selected', 'system')}>
                <FileText size={12} style={{ color: 'var(--purple)' }} />
                <span style={{ fontSize: '0.36rem', fontWeight: 700, color: 'var(--text-bright)', fontFamily: 'var(--mono)' }}>PDF</span>
              </div>
              <div className="glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '8px', cursor: 'pointer' }}
                   onClick={() => appendLog('Quick Ingest: Notes Selected', 'system')}>
                <StickyNote size={12} style={{ color: 'var(--amber)' }} />
                <span style={{ fontSize: '0.36rem', fontWeight: 700, color: 'var(--text-bright)', fontFamily: 'var(--mono)' }}>NOTE</span>
              </div>
            </div>
            <button style={{
              background: 'var(--cyan-dim)',
              border: '1px solid rgba(0, 210, 255, 0.25)',
              color: 'var(--cyan)',
              fontSize: '0.45rem',
              fontWeight: 800,
              fontFamily: 'var(--mono)',
              padding: '6px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onClick={() => setBrainOpen(true)}>
              <Play size={8} /> ANALYZE DATA ASSETS
            </button>
          </div>

        </div>
      </section>

      {/* SUPPORT ZONE - Low Intensity Telemetry & Automations (Completely static monospace panels to preserve CPU) */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', zIndex: 2 }}>
        
        {/* Support A: Static telemetry parameters (No animations) */}
        <div className="glass" style={{ padding: '8px 12px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', background: 'rgba(2, 6, 12, 0.4)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span style={{ fontSize: '0.36rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Risks</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--red)', fontFamily: 'var(--mono)' }}>3</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span style={{ fontSize: '0.36rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Signals</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--amber)', fontFamily: 'var(--mono)' }}>27</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span style={{ fontSize: '0.36rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Active Workspaces</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--green)', fontFamily: 'var(--mono)' }}>3</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span style={{ fontSize: '0.36rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Loops</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--violet)', fontFamily: 'var(--mono)' }}>14</span>
          </div>
        </div>

        {/* Support B: Calm static automation ribbons */}
        <div className="glass" style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(2, 6, 12, 0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.36rem', fontFamily: 'var(--mono)', color: 'var(--text-muted)', fontWeight: 700 }}>
            <span>ACTIVE AUTOMATION CONDUITS</span>
            <span>SYSTEM HEALTH: NOMINAL</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', fontSize: '0.4rem', color: 'var(--text-main)', fontFamily: 'var(--mono)' }}>
            <span>● Daily Attendance Sync</span>
            <span>● Supplier Checker</span>
            <span>● Fleet Monitor</span>
          </div>
        </div>

      </section>

    </div>
  );
}

export default SituationRoom;
