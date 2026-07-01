import { useState, useEffect } from 'react';
import { Network, Database, Shield, Radio, Terminal, Settings } from 'lucide-react';

export function OperationalGraph() {
  // Active pressure fluctuations
  const [omegaPing, setOmegaPing] = useState(42);
  const [bridgeStability, setBridgeStability] = useState(99.8);
  const [lossRate, setLossRate] = useState(0.0);

  useEffect(() => {
    const id = setInterval(() => {
      setOmegaPing(Math.floor(38 + Math.random() * 12));
      setBridgeStability(+(99.2 + Math.random() * 0.7).toFixed(2));
      setLossRate(+(Math.random() * 0.3).toFixed(2));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="nova-center-core" style={{
      gridColumn: 'center / span 2',
      background: 'rgba(3, 8, 16, 0.4)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '20px',
      display: 'grid',
      gridTemplateColumns: '1.4fr 0.6fr',
      gap: '20px',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Left Column: Full-Scale Topology Map (PRIMARY FOCAL AREA) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', overflow: 'hidden' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Network size={16} style={{ color: 'var(--cyan)' }} />
            <div className="compartment-label">[MAP-09 COGNITIVE TOPOLOGY]</div>
          </div>
          
          {/* Micro Equalizer visualizer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.36rem', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>TOPOLOGY FREQ</span>
            <div className="osc-container">
              <div className="osc-bar" />
              <div className="osc-bar" />
              <div className="osc-bar" />
              <div className="osc-bar" />
              <div className="osc-bar" />
            </div>
          </div>
        </div>

        {/* Massive 200% SVG Diagram Canvas */}
        <div className="glass primary-focal-card" style={{
          flex: 1,
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Hologram sweep scanner */}
          <div className="scan-sweep-overlay" />

          <svg width="100%" height="100%" viewBox="0 0 840 560" style={{ overflow: 'visible', zIndex: 3 }}>
            
            {/* Background connection pipelines (Stealth current lines) */}
            <path d="M140,280 L420,280" fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.4" />
            <path d="M700,280 L420,280" fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.4" />
            <path d="M420,120 L420,280" fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.4" />
            <path d="M420,440 L420,280" fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.4" />

            {/* FLOWING ENERGY CONDUITS (Stroke dashoffset moving dots) */}
            {/* Left to Center (Omega Ops -> Core): Flashing Degraded yellow current */}
            <path d="M140,280 L420,280" fill="none" stroke="var(--amber)" strokeWidth="2.5" strokeDasharray="8,50" className="cyberwave-path" opacity="0.95" />
            
            {/* Right to Center (Recruitment -> Core): Purple flows */}
            <path d="M700,280 L420,280" fill="none" stroke="var(--purple)" strokeWidth="2" strokeDasharray="12,60" className="cyberwave-path" style={{ animationDirection: 'reverse' }} opacity="0.8" />
            
            {/* Top to Center (n8n Gate -> Core): Unstable Red/Violet current */}
            <path d="M420,120 L420,280" fill="none" stroke="var(--red)" strokeWidth="2" strokeDasharray="6,40" className="cyberwave-path" opacity="0.85" />

            {/* Bottom to Center (Local Bridge -> Core): Active Cyan current */}
            <path d="M420,440 L420,280" fill="none" stroke="var(--cyan)" strokeWidth="2.5" strokeDasharray="10,40" className="cyberwave-path" opacity="0.9" />

            {/* Concentric rotating bridge rings around NEXUS core */}
            <circle cx="420" cy="280" r="100" fill="none" stroke="rgba(0, 210, 255, 0.12)" strokeWidth="0.8" strokeDasharray="10,25" style={{ transformOrigin: '420px 280px', animation: 'orb-spin-slow 28s infinite linear' }} />
            <circle cx="420" cy="280" r="85" fill="none" stroke="rgba(213, 0, 249, 0.08)" strokeWidth="0.5" strokeDasharray="4,12" style={{ transformOrigin: '420px 280px', animation: 'orb-spin-slow 18s infinite linear reverse' }} />

            {/* ==================== NODES CONFIGURATION ==================== */}

            {/* Node Top: NOVA & MEMORY KERNEL */}
            <g transform="translate(420, 120)">
              <rect x="-90" y="-22" width="180" height="44" rx="4" fill="rgba(8, 2, 14, 0.95)" stroke="var(--purple)" strokeWidth="1" style={{ filter: 'drop-shadow(0 0 6px rgba(213, 0, 249, 0.3))' }} />
              <text x="0" y="-4" fill="var(--text-bright)" fontSize="10" fontFamily="var(--mono)" textAnchor="middle" fontWeight="bold">NOVA & RUNTIME MEMORY</text>
              <text x="0" y="10" fill="var(--purple)" fontSize="7" fontFamily="var(--mono)" textAnchor="middle" fontWeight="bold" className="pulse-warn">LEARNING CYCLE ACTIVE</text>
              <circle cx="0" cy="22" r="3.5" fill="var(--purple)" style={{ animation: 'sonar-fade 1.5s infinite ease-out' }} />
            </g>

            {/* Node Left: Data Intake & Signals */}
            <g transform="translate(140, 280)">
              <rect x="-95" y="-26" width="190" height="52" rx="4" fill="rgba(10, 8, 2, 0.95)" stroke="var(--amber)" strokeWidth="1" />
              <text x="0" y="-8" fill="var(--text-bright)" fontSize="10" fontFamily="var(--mono)" textAnchor="middle" fontWeight="bold">DATA INTAKE & SIGNALS</text>
              <text x="0" y="6" fill="var(--amber)" fontSize="7" fontFamily="var(--mono)" textAnchor="middle" fontWeight="bold">PROCESSING STREAMS</text>
              <text x="0" y="16" fill="var(--text-muted)" fontSize="6" fontFamily="var(--mono)" textAnchor="middle">LATENCY: {omegaPing}MS • LOSS: {lossRate}%</text>
              <circle cx="95" cy="0" r="3.5" fill="var(--amber)" />
            </g>

            {/* Node Center: NEXUS Core Supervisor (PRIMARY OPERATIONAL CORE) */}
            <g transform="translate(420, 280)">
              <rect x="-105" y="-32" width="210" height="64" rx="4" fill="rgba(2, 6, 12, 0.98)" stroke="var(--cyan)" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 10px var(--cyan-glow))' }} />
              <text x="0" y="-12" fill="var(--cyan)" fontSize="12" fontFamily="var(--mono)" textAnchor="middle" fontWeight="bold">NEXUS INTELLIGENCE STUDIO</text>
              <text x="0" y="6" fill="var(--text-bright)" fontSize="8" fontFamily="var(--mono)" textAnchor="middle">CENTRAL ORCHESTRATOR</text>
              <text x="0" y="18" fill="var(--green)" fontSize="7" fontFamily="var(--mono)" textAnchor="middle">SYSTEM STABILITY • {bridgeStability}%</text>
              
              {/* Core Connectors */}
              <circle cx="-105" cy="0" r="4.5" fill="var(--cyan)" />
              <circle cx="105" cy="0" r="4.5" fill="var(--purple)" />
              <circle cx="0" cy="-32" r="4.5" fill="var(--red)" />
              <circle cx="0" cy="32" r="4.5" fill="var(--cyan)" />
            </g>

            {/* Node Right: Workspaces */}
            <g transform="translate(700, 280)">
              <rect x="-90" y="-24" width="180" height="48" rx="4" fill="rgba(7, 3, 12, 0.95)" stroke="var(--purple)" strokeWidth="1" />
              <text x="0" y="-6" fill="var(--text-bright)" fontSize="10" fontFamily="var(--mono)" textAnchor="middle" fontWeight="bold">GENERATED WORKSPACES</text>
              <text x="0" y="8" fill="var(--text-muted)" fontSize="7" fontFamily="var(--mono)" textAnchor="middle">OMEGA • RECRUITMENT • POWERSHIELD</text>
              <text x="0" y="16" fill="var(--purple)" fontSize="6" fontFamily="var(--mono)" textAnchor="middle">ACTIVE SUPERVISION</text>
              <circle cx="-90" cy="0" r="3.5" fill="var(--purple)" />
            </g>

            {/* Node Bottom: Reports & Graph */}
            <g transform="translate(420, 440)">
              <rect x="-95" y="-24" width="190" height="48" rx="4" fill="rgba(2, 8, 12, 0.95)" stroke="var(--green)" strokeWidth="1" />
              <text x="0" y="-6" fill="var(--text-bright)" fontSize="10" fontFamily="var(--mono)" textAnchor="middle" fontWeight="bold">REPORTS & ANALYTICS</text>
              <text x="0" y="8" fill="var(--green)" fontSize="7" fontFamily="var(--mono)" textAnchor="middle" fontWeight="bold">METRICS GENERATION ACTIVE</text>
              <text x="0" y="16" fill="var(--text-muted)" fontSize="6" fontFamily="var(--mono)" textAnchor="middle">AUTO-DISTRIBUTION: READY</text>
              <circle cx="0" cy="-24" r="3.5" fill="var(--green)" />
            </g>
          </svg>
        </div>

        {/* TACTICAL LAUNCH ACTIONS DECK (Military Cockpit Panel Buttons) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          <button 
            className="glass" 
            style={{
              background: 'rgba(0, 210, 255, 0.05)',
              border: '1px solid rgba(0, 210, 255, 0.25)',
              color: 'var(--cyan)',
              padding: '8px',
              borderRadius: '4px',
              fontFamily: 'var(--mono)',
              fontSize: '0.45rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onClick={() => console.log('[GATEWAY] OMEGA PORT DIRECT')}
          >
            <Terminal size={12} /> OPEN RUNTIME BRIDGE
          </button>
          
          <button 
            className="glass" 
            style={{
              background: 'rgba(213, 0, 249, 0.04)',
              border: '1px solid rgba(213, 0, 249, 0.2)',
              color: 'var(--purple)',
              padding: '8px',
              borderRadius: '4px',
              fontFamily: 'var(--mono)',
              fontSize: '0.45rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onClick={() => console.log('[GATEWAY] RECRUITMENT SANDBOX')}
          >
            <Shield size={12} /> VERIFY SECURE CV CORE
          </button>

          <button 
            className="glass" 
            style={{
              background: 'rgba(123, 97, 255, 0.05)',
              border: '1px solid rgba(123, 97, 255, 0.25)',
              color: 'var(--violet)',
              padding: '8px',
              borderRadius: '4px',
              fontFamily: 'var(--mono)',
              fontSize: '0.45rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onClick={() => console.log('[GATEWAY] COCKPIT SWEEP')}
          >
            <Settings size={12} /> OPEN SYSTEM CONSOLE
          </button>
        </div>

      </div>

      {/* Right Column: Node Connection Specifications (SECONDARY OPERATIONAL AREA) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: '1px solid var(--border)', paddingLeft: '20px', height: '100%', overflowY: 'auto' }}>
        <span style={{ fontSize: '0.44rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.5px', fontFamily: 'var(--mono)' }}>
          TOPOLOGY CONDUIT SPECS
        </span>

        {/* Node description card 1 */}
        <div className="glass" style={{ padding: '10px', background: 'rgba(5, 12, 24, 0.2)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.46rem', color: 'var(--amber)', fontWeight: 700, fontFamily: 'var(--mono)' }}>
            <Database size={10} />
            <span>DATA INTAKE & SIGNALS</span>
          </div>
          <p style={{ fontSize: '0.44rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.4 }}>
            Processes all inbound files (CSVs/PDFs), extracts anomalies, and converts them into operational signals.
          </p>
        </div>

        {/* Node description card 2 */}
        <div className="glass" style={{ padding: '10px', background: 'rgba(5, 12, 24, 0.2)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.46rem', color: 'var(--purple)', fontWeight: 700, fontFamily: 'var(--mono)' }}>
            <Shield size={10} />
            <span>NOVA & MEMORY</span>
          </div>
          <p style={{ fontSize: '0.44rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.4 }}>
            Analyzes signals against past patterns to filter false positives and calibrate trust weights.
          </p>
        </div>

        {/* Node connection rules */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Radio size={10} style={{ color: 'var(--violet)' }} />
            <span style={{ fontSize: '0.38rem', fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>INTELLIGENCE FREQUENCY</span>
          </div>
          <p style={{ fontSize: '0.42rem', color: 'var(--text-muted)', fontFamily: 'var(--mono)', margin: 0, lineHeight: 1.4 }}>
            System current pipelines monitor n8n gates constantly. If telemetry RTT exceeds 50ms, warning pulses trigger automatic local route remapping.
          </p>
        </div>
      </div>
    </section>
  );
}

export default OperationalGraph;
