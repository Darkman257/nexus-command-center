import { useState, useEffect } from 'react';
import './App.css';
import { checkOmegaStatus } from '../../../packages/connectors/src/omegaConnector';
import type { SystemStatus } from '../../../packages/shared-types/src/systemStatus';

interface LogMessage {
  time: string;
  msg: string;
  type: 'info' | 'system' | 'alert';
}

function App() {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [omegaStatus, setOmegaStatus] = useState<SystemStatus>({
    systemId: 'omega-ops',
    label: 'Omega Ops',
    status: 'offline',
    checkedAt: new Date().toISOString(),
    message: 'Initializing health telemetry...'
  });

  const [logs, setLogs] = useState<LogMessage[]>([
    { time: '12:04:30', msg: 'System verification initialized: D:\\NEXUS\\PROJECTS\\omega-ops-dashboard', type: 'system' },
    { time: '12:06:40', msg: 'Merge completed: origin/work/omega-policies integrated cleanly into main', type: 'info' },
    { time: '12:07:06', msg: 'Vite build completed: omega-dashboard UI compiled (dist/index.html 0.76 kB)', type: 'info' },
    { time: '12:09:39', msg: 'Merge completed: origin/work/omega-telegram-tasks-runtime integrated cleanly', type: 'info' },
    { time: '12:10:07', msg: 'Vite build completed: omega-dashboard compiled successfully (1.59 MB bundle)', type: 'info' },
    { time: '12:10:36', msg: 'Merge completed: origin/work/omega-utility-scripts integrated cleanly', type: 'info' },
    { time: '12:12:34', msg: 'Push succeeded: Local main branch pushed to origin (0bb1c93..e9f972e)', type: 'info' },
    { time: '12:13:51', msg: 'Governance compliance audit: 3 proposed database migrations reviewed', type: 'system' },
    { time: '12:31:21', msg: 'Project initialized: D:\\NEXUS\\PROJECTS\\nexus-command-center Phase 1', type: 'alert' },
    { time: '12:33:49', msg: 'Package setup completed: react/react-dom dependencies configured', type: 'system' },
  ]);

  const fetchOmegaHealth = async () => {
    setIsRefreshing(true);
    const result = await checkOmegaStatus();
    setOmegaStatus(result);
    setIsRefreshing(false);
    
    const now = new Date();
    const timeStr = now.toTimeString().substring(0, 8);
    const statusLabel = result.status.toUpperCase();
    const logMsg = `Telemetry Poll - Omega: ${statusLabel} (${result.responseMs !== undefined ? `${result.responseMs}ms` : 'unreachable'}) - ${result.message}`;
    
    setLogs(prev => [
      ...prev,
      { time: timeStr, msg: logMsg, type: result.status === 'online' ? 'info' : 'alert' }
    ]);
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace('T', ' ').substring(0, 19));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    // Initial health check
    fetchOmegaHealth();

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo">NEXUS</div>
          <div className="brand-subtitle">Command Center Cockpit</div>
        </div>
        <div className="telemetry-status">
          <div className="timestamp">SYSTEM TIME (UTC): {currentTime || '2026-05-20 12:33:49'}</div>
          <div className="status-badge online">
            <span className="dot"></span>
            SYS-RUNNING
          </div>
        </div>
      </header>

      <main>
        <section className="system-grid">
          {/* Omega Ops Card */}
          <div className={`glass-card cyan-accent`}>
            <div className="card-header">
              <div className="card-title-group">
                <h3>Omega Ops</h3>
                <p>Operational Dashboard & Staff Registry</p>
              </div>
              <div className={`status-badge ${omegaStatus.status}`}>
                <span className="dot"></span>
                {omegaStatus.status}
              </div>
            </div>
            
            <div className="metric-row">
              <div className="metric-card">
                <div className="metric-label">Connection</div>
                <div className="metric-value highlight" style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
                  {omegaStatus.status === 'online' ? '127.0.0.1:5001' : 'OFFLINE'}
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Latency</div>
                <div className="metric-value" style={{ color: omegaStatus.status === 'online' ? 'var(--neon-green)' : 'var(--text-muted)' }}>
                  {omegaStatus.responseMs !== undefined ? `${omegaStatus.responseMs}ms` : '—'}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem', height: '1.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Signal: {omegaStatus.message || 'No signal data'}
            </div>

            <div className="card-footer">
              <span className="timestamp" style={{ fontSize: '0.7rem' }}>Checked: {omegaStatus.checkedAt.substring(11, 19)} UTC</span>
              <button 
                className="action-btn" 
                disabled={isRefreshing}
                onClick={fetchOmegaHealth}
                style={{ minWidth: '80px' }}
              >
                {isRefreshing ? 'Polling...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Recruitment Hub Card */}
          <div className="glass-card amber-accent">
            <div className="card-header">
              <div className="card-title-group">
                <h3>Recruitment Hub</h3>
                <p>Candidate Intake & Compliance Portal</p>
              </div>
              <div className="status-badge pending">
                <span className="dot"></span>
                AUDIT REQD
              </div>
            </div>
            
            <div className="metric-row">
              <div className="metric-card">
                <div className="metric-label">Applicants</div>
                <div className="metric-value highlight">18</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Ingested CVs</div>
                <div className="metric-value">52</div>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem', height: '1.25rem' }}>
              Signal: Ingestion pipeline paused for review
            </div>

            <div className="card-footer">
              <span className="timestamp" style={{ fontSize: '0.7rem' }}>Checked: Simulation</span>
              <button className="action-btn" onClick={() => alert('Access Restricted: Recruitment Hub is in standby mode.')}>
                Open Client
              </button>
            </div>
          </div>

          {/* Asset Hub Card */}
          <div className="glass-card emerald-accent">
            <div className="card-header">
              <div className="card-title-group">
                <h3>AL-Sebaei Asset Hub</h3>
                <p>Asset & Fleet Management System</p>
              </div>
              <div className="status-badge online">
                <span className="dot"></span>
                SIMULATING
              </div>
            </div>
            
            <div className="metric-row">
              <div className="metric-card">
                <div className="metric-label">Total Assets</div>
                <div className="metric-value highlight">24</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Active Vehicles</div>
                <div className="metric-value">8</div>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem', height: '1.25rem' }}>
              Signal: Standby telemetry simulation active
            </div>

            <div className="card-footer">
              <span className="timestamp" style={{ fontSize: '0.7rem' }}>Checked: Simulation</span>
              <button className="action-btn" onClick={() => alert('Access Restricted: Asset Hub is in standby mode.')}>
                Open Client
              </button>
            </div>
          </div>
        </section>

        <section className="log-panel">
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#FFF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--neon-cyan)', borderRadius: '50%' }}></span>
              NEXUS Runtime Event Log
            </h3>
          </div>
          <div className="log-terminal">
            {logs.map((log, idx) => (
              <div className="log-entry" key={idx}>
                <span className="log-time">[{log.time}]</span>
                <span className={`log-msg ${log.type}`}>{log.msg}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
