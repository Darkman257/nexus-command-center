import { useState } from 'react';
import { FileText, Download, Layers, Play } from 'lucide-react';

interface CompiledReport {
  id: string;
  name: string;
  type: 'PDF' | 'EXCEL';
  compiledAt: string;
  size: string;
  checksum: string;
  status: 'VERIFIED' | 'DRAFT';
}

export function Reports() {
  const [reports, setReports] = useState<CompiledReport[]>([
    {
      id: 'rep-01',
      name: 'OMEGA_FLEET_&_PAYROLL_AUDIT_Q2.pdf',
      type: 'PDF',
      compiledAt: '2026-05-26 18:42',
      size: '2.4 MB',
      checksum: 'e3b0c442...9a12c14d',
      status: 'VERIFIED'
    },
    {
      id: 'rep-02',
      name: 'RECRUITMENT_CLEARANCE_SUMMARY.xlsx',
      type: 'EXCEL',
      compiledAt: '2026-05-26 14:10',
      size: '840 KB',
      checksum: '7f83b162...ac15db2a',
      status: 'VERIFIED'
    },
    {
      id: 'rep-03',
      name: 'NEXUS_INTELLIGENCE_BRIEF_MAY.pdf',
      type: 'PDF',
      compiledAt: '2026-05-25 09:12',
      size: '1.8 MB',
      checksum: 'fc62d3a9...8c25bf1d',
      status: 'DRAFT'
    }
  ]);

  const [compiling, setCompiling] = useState(false);
  const [timelineLogs, setTimelineLogs] = useState<string[]>([
    'PDF Compiler Daemon initialized.',
    'Verified active signatures for 3 reports.'
  ]);

  const compileNewReport = (type: 'PDF' | 'EXCEL') => {
    setCompiling(true);
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    setTimeout(() => {
      const newRep: CompiledReport = {
        id: `rep-${Date.now()}`,
        name: `NEXUS_AD_HOC_AUDIT_${Date.now().toString().slice(-4)}.${type === 'PDF' ? 'pdf' : 'xlsx'}`,
        type,
        compiledAt: `2026-05-27 ${time}`,
        size: '1.2 MB',
        checksum: 'bc82f12a...ca38df92',
        status: 'VERIFIED'
      };
      
      setReports(prev => [newRep, ...prev]);
      setTimelineLogs(prev => [
        `[${time}] COMPILE: ${newRep.name} successfully compiled.`,
        ...prev
      ]);
      setCompiling(false);
    }, 1500);
  };

  return (
    <section className="nova-center-core" style={{
      gridColumn: 'center / span 2',
      background: 'rgba(3, 8, 16, 0.4)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '24px',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '24px',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Left Column: Executive Summary & Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto', paddingRight: '4px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div className="compartment-label">[DECK-06 EXECUTIVE ARCHIVE]</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <FileText size={18} style={{ color: 'var(--cyan)' }} />
            <h2 style={{ color: 'var(--text-bright)', fontSize: '0.9rem', letterSpacing: '1px', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--mono)', margin: 0 }}>
              Executive Briefings
            </h2>
          </div>
        </div>

        {/* Executive Summary Card (Calm, structured whitespace) */}
        <div className="glass" style={{
          padding: '16px',
          background: 'rgba(5, 12, 24, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          lineHeight: '1.5'
        }}>
          <span style={{ fontSize: '0.46rem', color: 'var(--cyan)', fontWeight: 700, fontFamily: 'var(--mono)' }}>
            [OPERATIONAL EXECUTIVE REPORT]
          </span>
          <p style={{ fontSize: '0.48rem', color: 'var(--text-main)', margin: 0 }}>
            Systems show high operational fidelity across active segments. Omega Dashboard fleet and driver modules show 100% nominal activity with 0 pending approval leaks. Ingestion nodes are fully active and local advisor logs remain in a zero-disclosure quarantine buffer.
          </p>
        </div>

        {/* Operational Snapshots (Monotype Table) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.44rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.5px', fontFamily: 'var(--mono)' }}>
            OPERATIONAL SNAPSHOTS (KPI MATRIX)
          </span>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.46rem', fontFamily: 'var(--mono)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                <th style={{ textAlign: 'left', padding: '6px 4px' }}>KPI INDICATOR</th>
                <th style={{ textAlign: 'center', padding: '6px 4px' }}>METRIC</th>
                <th style={{ textAlign: 'right', padding: '6px 4px' }}>CLEARANCE</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                <td style={{ padding: '6px 4px', color: 'var(--text-bright)' }}>Fleet In-Out Utilization</td>
                <td style={{ padding: '6px 4px', textAlign: 'center', color: 'var(--green)' }}>92.4%</td>
                <td style={{ padding: '6px 4px', textAlign: 'right', color: 'var(--cyan)' }}>NOMINAL</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                <td style={{ padding: '6px 4px', color: 'var(--text-bright)' }}>Ingested CV Assets Scanner</td>
                <td style={{ padding: '6px 4px', textAlign: 'center', color: 'var(--cyan)' }}>17 files</td>
                <td style={{ padding: '6px 4px', textAlign: 'right', color: 'var(--cyan)' }}>NOMINAL</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                <td style={{ padding: '6px 4px', color: 'var(--text-bright)' }}>Approval Latency Track</td>
                <td style={{ padding: '6px 4px', textAlign: 'center', color: 'var(--amber)' }}>42 min</td>
                <td style={{ padding: '6px 4px', textAlign: 'right', color: 'var(--amber)' }}>WARNING</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tactical Sonar/Radar scan panel (Eliminating empty void at lower left of Reports) */}
        <div className="glass" style={{
          padding: '12px 14px',
          background: 'rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(0, 210, 255, 0.15)',
          borderRadius: '4px',
          display: 'grid',
          gridTemplateColumns: '70px 1fr',
          gap: '14px',
          alignItems: 'center',
          marginTop: '10px'
        }}>
          {/* Sonar Hub */}
          <div className="sonar-hub" style={{ width: '70px', height: '70px', background: 'rgba(0, 210, 255, 0.01)', borderRadius: '50%', border: '1px solid rgba(0, 210, 255, 0.08)' }}>
            <div className="sonar-sweep-circle" style={{ width: '50px', height: '50px' }} />
            <div className="sonar-sweep-circle" style={{ width: '34px', height: '34px' }} />
            <div className="sonar-sweep-circle" style={{ width: '18px', height: '18px' }} />
            <div className="sonar-blip" style={{ top: '25%', left: '30%' }} />
            <div className="sonar-blip" style={{ top: '65%', left: '70%', animationDelay: '0.8s' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.42rem', fontFamily: 'var(--mono)', color: 'var(--cyan)', fontWeight: 800 }}>
              FILE INTEGRITY RADAR
            </span>
            <p style={{ fontSize: '0.44rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.4 }}>
              System sweeps verify cryptographic hash buffers. Private storage assets remain locked under strict quarantine protocols.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Generation Deck & Action lists */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '1px solid var(--border)', paddingLeft: '24px', height: '100%', overflowY: 'auto' }}>
        <span style={{ fontSize: '0.44rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.5px', fontFamily: 'var(--mono)' }}>
          REPORT ARCHIVE & GENERATOR DECK
        </span>

        {/* Report Generation actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => compileNewReport('PDF')}
            disabled={compiling}
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
            <Play size={10} /> Compile PDF Briefing
          </button>
          <button
            onClick={() => compileNewReport('EXCEL')}
            disabled={compiling}
            style={{
              flex: 1,
              background: 'rgba(213, 0, 249, 0.06)',
              border: '1px solid rgba(213, 0, 249, 0.15)',
              color: 'var(--purple)',
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
            <Layers size={10} /> Ingest Excel Audit
          </button>
        </div>

        {/* Compiled PDF List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {reports.map(rep => (
            <div key={rep.id} className="glass" style={{
              padding: '10px 12px',
              background: 'rgba(0,0,0,0.15)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ fontSize: '0.46rem', color: 'var(--text-bright)', fontFamily: 'var(--mono)', fontWeight: 700 }}>
                  {rep.name}
                </span>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.38rem', fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>
                  <span>{rep.size}</span>
                  <span>•</span>
                  <span>{rep.compiledAt}</span>
                  <span>•</span>
                  <span>SHA256: {rep.checksum}</span>
                </div>
              </div>

              <button 
                onClick={() => navigator.clipboard.writeText(rep.checksum)}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  color: 'var(--text-main)',
                  padding: '6px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Download Report Brief"
              >
                <Download size={10} />
              </button>
            </div>
          ))}
        </div>

        {/* Compilation Log Terminal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minHeight: '80px' }}>
          <span style={{ fontSize: '0.38rem', fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>COMPILATION TIMELINE LOGS</span>
          <div style={{
            flex: 1,
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.02)',
            borderRadius: '4px',
            padding: '8px',
            fontFamily: 'var(--mono)',
            fontSize: '0.42rem',
            color: 'var(--text-main)',
            overflowY: 'auto'
          }}>
            {timelineLogs.map((log, i) => (
              <div key={i} style={{ padding: '2px 0' }}>{log}</div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
