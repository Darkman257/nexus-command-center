import { useState } from 'react';
import { Cpu, Play, Radio } from 'lucide-react';

interface AutomationWorkflow {
  id: string;
  name: string;
  triggerSource: string;
  actionChain: string[];
  status: 'ACTIVE' | 'IDLE';
  queueBacklog: number;
  lastExecuted: string;
}

export function Automations() {
  const [workflows] = useState<AutomationWorkflow[]>([
    {
      id: 'flow-01',
      name: 'WhatsApp Driver Check-in Ingestion Loop',
      triggerSource: 'Incoming WhatsApp Webhook',
      actionChain: ['Incoming Msg Ingest', 'Parse Attendance Logs', 'Supabase DB Ingestion'],
      status: 'ACTIVE',
      queueBacklog: 0,
      lastExecuted: '4m ago'
    },
    {
      id: 'flow-02',
      name: 'CV Intake PDF Parsing Loop',
      triggerSource: 'Mail Attachment Event',
      actionChain: ['Scan omega-cvs Directory', 'Extract PDF Metadata', 'Sanitize & Cache Intake'],
      status: 'IDLE',
      queueBacklog: 0,
      lastExecuted: '1h ago'
    },
    {
      id: 'flow-03',
      name: 'Staff Payroll Clearance Sweep',
      triggerSource: 'Scheduled Cron Event',
      actionChain: ['Scan attendance logs', 'Recalculate Clearance Rules', 'Update Omega payroll_records'],
      status: 'ACTIVE',
      queueBacklog: 0,
      lastExecuted: '24h ago'
    }
  ]);

  const [activeLogs, setActiveLogs] = useState<string[]>([
    'CRON: Daily clearance sweep verified.',
    'LISTENING: WhatsApp webhook port locked on standby.'
  ]);

  const triggerWorkflowManually = (name: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setActiveLogs(prev => [
      `[${time}] TRIGGER: Initiated manual execution for ${name}.`,
      `[${time}] IN PROGRESS: Executing action chain...`,
      `[${time}] SUCCESS: Ingestion pipeline fully sync verified.`,
      ...prev
    ]);
  };

  return (
    <section className="nova-center-core" style={{
      gridColumn: 'center / span 2',
      background: 'rgba(3, 8, 16, 0.4)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '24px',
      display: 'grid',
      gridTemplateColumns: '1.25fr 0.75fr',
      gap: '24px',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Left Column: Procedural Workflows (Alfred inspired) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto', paddingRight: '4px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div className="compartment-label">[CHAMBER-12 RUNTIME PROCESS]</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <Cpu size={18} style={{ color: 'var(--cyan)' }} />
            <h2 style={{ color: 'var(--text-bright)', fontSize: '0.9rem', letterSpacing: '1px', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--mono)', margin: 0 }}>
              Operational Automation Loops
            </h2>
          </div>
        </div>

        {/* Workflow Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {workflows.map(ws => (
            <div key={ws.id} className="glass" style={{
              padding: '12px 14px',
              background: 'rgba(5, 12, 24, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.52rem', fontWeight: 800, color: 'var(--text-bright)', fontFamily: 'var(--mono)' }}>
                  {ws.name}
                </span>
                <span style={{
                  fontSize: '0.38rem',
                  fontFamily: 'var(--mono)',
                  fontWeight: 700,
                  padding: '2px 5px',
                  borderRadius: '3px',
                  background: ws.status === 'ACTIVE' ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255,255,255,0.03)',
                  color: ws.status === 'ACTIVE' ? 'var(--green)' : 'var(--text-muted)',
                  border: ws.status === 'ACTIVE' ? '1px solid rgba(0,230,118,0.2)' : '1px solid rgba(255,255,255,0.05)'
                }}>
                  {ws.status}
                </span>
              </div>

              {/* Trigger & Chains */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.44rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>TRIGGER EVENT: </span>
                  <span style={{ color: 'var(--text-main)', fontFamily: 'var(--mono)' }}>{ws.triggerSource}</span>
                </div>
                
                {/* Chain Flow Visualization */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>CHAIN: </span>
                  {ws.actionChain.map((act, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ background: 'rgba(0,210,255,0.06)', border: '1px solid rgba(0,210,255,0.15)', color: 'var(--cyan)', padding: '2px 6px', borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '0.38rem' }}>
                        {act}
                      </span>
                      {idx < ws.actionChain.length - 1 && (
                        <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontSize: '0.38rem' }}>&rarr;</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Ingestion Sparkline Graph inside Card if Active */}
              {ws.status === 'ACTIVE' && (
                <div style={{
                  marginTop: '6px',
                  background: 'rgba(0,0,0,0.15)',
                  border: '1px solid rgba(255,255,255,0.02)',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  height: '32px'
                }}>
                  <span style={{ fontSize: '0.38rem', fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>LIVE PULSE TICK:</span>
                  <svg className="p-mini-sparkline" width="90" height="18" viewBox="0 0 160 24" style={{ overflow: 'visible' }}>
                    <path d="M0,12 Q20,6 40,16 T80,8 T120,18 T160,10" fill="none" stroke="var(--green)" strokeWidth="1.5" />
                  </svg>
                </div>
              )}

              {/* Trigger manually button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.02)', paddingTop: '6px' }}>
                <span style={{ fontSize: '0.4rem', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                  QUEUE BACKLOG: <strong style={{ color: 'var(--text-main)' }}>{ws.queueBacklog}</strong> • LAST RUN: <strong style={{ color: 'var(--text-main)' }}>{ws.lastExecuted}</strong>
                </span>

                <button 
                  onClick={() => triggerWorkflowManually(ws.name)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: 'var(--text-bright)',
                    fontFamily: 'var(--mono)',
                    fontSize: '0.42rem',
                    padding: '3px 8px',
                    borderRadius: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <Play size={8} /> Run Loop
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Execution Engine Timeline Logs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: '1px solid var(--border)', paddingLeft: '24px', height: '100%', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Radio size={14} style={{ color: 'var(--purple)' }} />
          <span style={{ fontSize: '0.48rem', fontWeight: 800, color: 'var(--text-bright)', letterSpacing: '0.5px', fontFamily: 'var(--mono)' }}>
            ENGINE TIMELINE SCANNER
          </span>
        </div>

        {/* Animated Cyberwave Waveform & Telemetry Rings (Eliminating empty void at right panel of Automations) */}
        <div className="glass" style={{
          padding: '12px',
          background: 'rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(0, 210, 255, 0.15)',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.4rem', fontFamily: 'var(--mono)', color: 'var(--cyan)', fontWeight: 800 }}>
              CORE LOOP PRESSURE SCANNERS
            </span>
            <span className="osc-container">
              <div className="osc-bar" />
              <div className="osc-bar" />
              <div className="osc-bar" />
            </span>
          </div>

          {/* SVG Cyberwave Waveform line */}
          <div style={{ height: '36px', background: 'rgba(0,0,0,0.15)', borderRadius: '4px', overflow: 'hidden', padding: '4px', display: 'flex', alignItems: 'center' }}>
            <svg width="100%" height="24" viewBox="0 0 200 24" style={{ overflow: 'visible' }}>
              <path d="M0,12 L30,12 L40,4 L50,20 L60,12 L120,12 L130,2 L140,22 L150,12 L200,12" fill="none" stroke="var(--cyan)" strokeWidth="1.5" className="cyberwave-path" />
            </svg>
          </div>

          {/* Two High-tech Circular gauges side-by-side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="circle-progress-container">
              <svg width="44" height="44" className="circle-svg">
                <circle cx="22" cy="22" r="18" className="circle-bg" />
                <circle cx="22" cy="22" r="18" className="circle-fill-cyan" strokeDasharray="113" strokeDashoffset="17" />
              </svg>
              <div style={{ position: 'absolute', top: '12px', fontSize: '0.36rem', fontFamily: 'var(--mono)', color: 'var(--text-bright)' }}>85%</div>
              <span style={{ fontSize: '0.34rem', fontFamily: 'var(--mono)', color: 'var(--text-muted)', marginTop: '4px' }}>WHATSAPP</span>
            </div>

            <div className="circle-progress-container">
              <svg width="44" height="44" className="circle-svg">
                <circle cx="22" cy="22" r="18" className="circle-bg" />
                <circle cx="22" cy="22" r="18" className="circle-fill-purple" strokeDasharray="113" strokeDashoffset="99" />
              </svg>
              <div style={{ position: 'absolute', top: '12px', fontSize: '0.36rem', fontFamily: 'var(--mono)', color: 'var(--text-bright)' }}>12%</div>
              <span style={{ fontSize: '0.34rem', fontFamily: 'var(--mono)', color: 'var(--text-muted)', marginTop: '4px' }}>CV INTAKE</span>
            </div>
          </div>
        </div>

        {/* System Queue Status (Calm, structured metric) */}
        <div className="glass" style={{ padding: '12px', background: 'rgba(213,0,249,0.01)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.44rem', fontFamily: 'var(--mono)' }}>
            <span style={{ color: 'var(--text-muted)' }}>QUEUE WORKLOAD:</span>
            <span style={{ color: 'var(--green)', fontWeight: 700 }}>0 ACTIVE</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.44rem', fontFamily: 'var(--mono)' }}>
            <span style={{ color: 'var(--text-muted)' }}>LATENCY BUFFER:</span>
            <span style={{ color: 'var(--cyan)' }}>NOMINAL</span>
          </div>
        </div>

        {/* Webhook Activity Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minHeight: '140px' }}>
          <span style={{ fontSize: '0.38rem', fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>ACTIVE PIPELINE TELEMETRY</span>
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
            {activeLogs.map((log, idx) => (
              <div key={idx} style={{
                color: log.includes('SUCCESS') ? 'var(--green)' : log.includes('TRIGGER') ? 'var(--cyan)' : '#8cb3db',
                lineHeight: 1.4
              }}>
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
