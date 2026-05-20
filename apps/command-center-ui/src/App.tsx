import { useState, useEffect } from 'react';
import './App.css';

interface LogMessage {
  time: string;
  msg: string;
  type: 'info' | 'system' | 'alert';
}

function App() {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace('T', ' ').substring(0, 19));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const [logs] = useState<LogMessage[]>([
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
          <div className="glass-card cyan-accent">
            <div className="card-header">
              <div className="card-title-group">
                <h3>Omega Ops</h3>
                <p>Operational Dashboard & Staff Registry</p>
              </div>
              <div className="status-badge online">
                <span className="dot"></span>
                ACTIVE
              </div>
            </div>
            
            <div className="metric-row">
              <div className="metric-card">
                <div className="metric-label">Staff Count</div>
                <div className="metric-value highlight">142</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Active Projects</div>
                <div className="metric-value">4</div>
              </div>
            </div>

            <div className="card-footer">
              <span className="timestamp">v1.0.0 • Verified Main</span>
              <button className="action-btn" onClick={() => alert('Access Restricted: Omega Live connection is currently in mockup/standby mode.')}>
                Open Client
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

            <div className="card-footer">
              <span className="timestamp">v0.8.4 • Standby Mode</span>
              <button className="action-btn" onClick={() => alert('Access Restricted: Recruitment Hub connection is currently in mockup/standby mode.')}>
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

            <div className="card-footer">
              <span className="timestamp">v0.9.0 • Mock Telemetry</span>
              <button className="action-btn" onClick={() => alert('Access Restricted: Asset Hub connection is currently in mockup/standby mode.')}>
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
