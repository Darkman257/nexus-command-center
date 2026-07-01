import { useEffect, useState } from 'react';
import { Server, Play, Square, RotateCw, ExternalLink, Terminal } from 'lucide-react';

interface ServiceStatus {
  id: string;
  name: string;
  port: number;
  url?: string;
  online: boolean;
  pid?: number;
}

const INITIAL_SERVICES: ServiceStatus[] = [
  { id: 'command-center', name: 'Command Center', port: 5173, url: 'http://localhost:5173', online: false },
  { id: 'recruitment-hub', name: 'Recruitment Hub', port: 5174, url: 'http://localhost:5174', online: false },
  { id: 'omega-dashboard', name: 'Omega Dashboard', port: 3000, url: 'http://localhost:3000', online: false },
  { id: 'omega-gateway', name: 'Omega Gateway', port: 5001, url: 'http://localhost:5001/api/healthz', online: false },
  { id: 'omega-bridge', name: 'Omega Bridge', port: 5057, url: 'http://127.0.0.1:5057/health', online: false },
  { id: 'ollama', name: 'Ollama', port: 11434, url: 'http://127.0.0.1:11434', online: false },
];

export function RuntimeServicesPanel() {
  const [services, setServices] = useState<ServiceStatus[]>(INITIAL_SERVICES);
  const [loading, setLoading] = useState(false);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [activeLogService, setActiveLogService] = useState<string | null>(null);
  const [logLines, setLogLines] = useState<string[]>([]);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/services/status');
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.connections) {
          const activePorts = new Map<number, number>(); // port -> pid
          data.connections.forEach((c: any) => {
            activePorts.set(c.LocalPort, c.OwningProcess);
          });

          setServices(prev => prev.map(s => ({
            ...s,
            online: activePorts.has(s.port),
            pid: activePorts.get(s.port)
          })));
        }
      }
    } catch (e) {
      console.error('Failed to fetch status:', e);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (service: string, action: 'launch' | 'kill' | 'openlog', pid?: number) => {
    setLoading(true);
    try {
      await fetch('/api/services/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, action, pid })
      });
      setTimeout(fetchStatus, 1500); // Wait a bit for process to start/stop
    } catch (e) {
      console.error(`Action ${action} failed for ${service}`, e);
    } finally {
      setLoading(false);
    }
  };

  const launchFullStack = async () => {
    setLoading(true);
    const targets = ['recruitment-hub', 'omega-dashboard', 'omega-gateway', 'omega-bridge'];
    for (const tgt of targets) {
      const svc = services.find(s => s.id === tgt);
      if (!svc?.online) {
        await handleAction(tgt, 'launch');
      }
    }
    setLoading(false);
    fetchStatus();
  };

  const openLogViewer = async (service: string) => {
    setActiveLogService(service);
    setLogModalOpen(true);
    setLogLines(['Fetching logs...']);
    try {
      const res = await fetch(`/api/services/logs?service=${service}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.lines) {
          setLogLines(data.lines);
        } else {
          setLogLines(['No logs available or error fetching.']);
        }
      }
    } catch (e) {
      setLogLines(['Error connecting to backend API.']);
    }
  };

  return (
    <section className="nova-center-core" style={{
      gridColumn: 'center / span 2',
      background: 'rgba(3, 8, 16, 0.45)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div className="compartment-label">[NEXUS-RUNTIME-ENGINE]</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <Server size={18} style={{ color: 'var(--cyan)' }} />
            <h2 style={{ color: 'var(--text-bright)', fontSize: '0.9rem', letterSpacing: '1px', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--mono)', margin: 0 }}>
              Technical service control panel
            </h2>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={fetchStatus}
            disabled={loading}
            style={{
              background: 'rgba(123, 97, 255, 0.1)',
              border: '1px solid rgba(123, 97, 255, 0.3)',
              color: 'var(--purple)',
              padding: '6px 14px',
              borderRadius: '4px',
              fontFamily: 'var(--mono)',
              fontSize: '0.45rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: loading ? 'wait' : 'pointer'
            }}
          >
            <RotateCw size={12} className={loading ? 'spin-anim' : ''} />
            REFRESH STATUS
          </button>
          <button 
            onClick={launchFullStack}
            disabled={loading}
            style={{
              background: 'rgba(0, 230, 118, 0.1)',
              border: '1px solid rgba(0, 230, 118, 0.3)',
              color: 'var(--green)',
              padding: '6px 14px',
              borderRadius: '4px',
              fontFamily: 'var(--mono)',
              fontSize: '0.45rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: loading ? 'wait' : 'pointer'
            }}
          >
            <Play size={12} />
            LAUNCH FULL STACK
          </button>
        </div>
      </div>

      {/* Usage Note */}
      <div style={{ padding: '8px 12px', background: 'rgba(123, 97, 255, 0.05)', borderLeft: '2px solid var(--purple)', color: 'var(--text-muted)', fontSize: '0.45rem', fontFamily: 'var(--mono)', borderRadius: '0 4px 4px 0' }}>
        <strong style={{ color: 'var(--purple)' }}>NOTE:</strong> Use Workspaces to launch business apps. Use this page for status, logs, and restarts.
      </div>

      {/* Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '16px',
        overflowY: 'auto',
        paddingRight: '6px'
      }}>
        {services.map(svc => (
          <div key={svc.id} className="glass" style={{
            padding: '16px',
            background: 'rgba(5, 12, 24, 0.6)',
            border: `1px solid ${svc.online ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 23, 68, 0.2)'}`,
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* Top row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: 'var(--text-bright)', fontWeight: 800, fontSize: '0.6rem', fontFamily: 'var(--mono)' }}>
                  {svc.name}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.45rem', fontFamily: 'var(--mono)' }}>
                  PORT: <span style={{ color: 'var(--cyan)' }}>{svc.port}</span>
                </span>
              </div>
              <div style={{
                background: svc.online ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 23, 68, 0.15)',
                color: svc.online ? 'var(--green)' : 'var(--red)',
                border: svc.online ? '1px solid rgba(0, 230, 118, 0.3)' : '1px solid rgba(255, 23, 68, 0.3)',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.4rem',
                fontWeight: 800,
                fontFamily: 'var(--mono)'
              }}>
                {svc.online ? 'ONLINE' : 'OFFLINE'}
              </div>
            </div>

            {/* Middle row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span style={{ color: 'var(--text-main)', fontSize: '0.45rem', fontFamily: 'var(--mono)' }}>
                  PID: {svc.pid || '--'}
               </span>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
              {!svc.online ? (
                <button 
                  onClick={() => handleAction(svc.id, 'launch')}
                  disabled={loading}
                  style={{ flex: 1, background: 'rgba(0, 210, 255, 0.1)', border: '1px solid rgba(0, 210, 255, 0.3)', color: 'var(--cyan)', padding: '6px', borderRadius: '4px', fontSize: '0.4rem', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                >
                  <Play size={10} /> LAUNCH
                </button>
              ) : (
                <a 
                  href={svc.url} target="_blank" rel="noreferrer"
                  style={{ flex: 1, textDecoration: 'none', background: 'rgba(0, 230, 118, 0.1)', border: '1px solid rgba(0, 230, 118, 0.3)', color: 'var(--green)', padding: '6px', borderRadius: '4px', fontSize: '0.4rem', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                >
                  <ExternalLink size={10} /> OPEN
                </a>
              )}
              
              <button 
                onClick={() => handleAction(svc.id, 'kill', svc.pid)}
                disabled={!svc.online || loading}
                style={{ background: 'rgba(255, 23, 68, 0.1)', border: '1px solid rgba(255, 23, 68, 0.3)', color: 'var(--red)', padding: '6px 10px', borderRadius: '4px', display: 'flex', alignItems: 'center', opacity: svc.online ? 1 : 0.4, cursor: svc.online ? 'pointer' : 'not-allowed' }}
                title="Stop Service"
              >
                <Square size={10} fill="currentColor" />
              </button>

              <button 
                onClick={() => openLogViewer(svc.id)}
                disabled={svc.id === 'command-center' || svc.id === 'ollama'}
                style={{ background: 'rgba(255, 171, 0, 0.1)', border: '1px solid rgba(255, 171, 0, 0.3)', color: 'var(--amber)', padding: '6px 10px', borderRadius: '4px', display: 'flex', alignItems: 'center', opacity: (svc.id === 'command-center' || svc.id === 'ollama') ? 0.4 : 1, cursor: 'pointer' }}
                title="View Logs"
              >
                <Terminal size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Log Viewer Modal */}
      {logModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', zIndex: 1000,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#0a0a0a', border: '1px solid var(--border)',
            width: '80%', height: '80%', borderRadius: '8px',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,210,255,0.05)' }}>
              <span style={{ color: 'var(--cyan)', fontFamily: 'var(--mono)', fontWeight: 800 }}>
                {activeLogService?.toUpperCase()} - LIVE LOGS (Tail)
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => activeLogService && handleAction(activeLogService, 'openlog')} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.45rem', cursor: 'pointer', fontFamily: 'var(--mono)' }}>
                  OPEN FILE IN NOTEPAD
                </button>
                <button onClick={() => setLogModalOpen(false)} style={{ background: 'rgba(255,23,68,0.2)', border: '1px solid var(--red)', color: 'var(--red)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.45rem', cursor: 'pointer', fontFamily: 'var(--mono)' }}>
                  CLOSE
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', fontFamily: 'var(--mono)', fontSize: '0.45rem', color: '#a8b8cc', lineHeight: 1.5, background: '#050505', whiteSpace: 'pre-wrap' }}>
              {logLines.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
