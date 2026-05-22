import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Database, Globe, Users, Cpu, Shield, Brain, GitBranch, Settings, X, Activity } from 'lucide-react';

interface Props {
  activeItem: string | null;
  onClose: () => void;
  omegaOnline: boolean;
  recruitStat: string;
  telStat: string;
  apiStat: string;
  novaOnline: boolean;
  bridgeOnline: boolean;
  cpuUsage: number;
  ramLoad: number;
  diskUsage: number;
  netUsage: number;
  alerts: { msg: string; type: 'warn' | 'critical' | 'ok' }[];
}

export function NovaLauncherPreview({
  activeItem,
  onClose,
  omegaOnline,
  recruitStat,
  telStat,
  apiStat,
  novaOnline,
  bridgeOnline,
  cpuUsage,
  ramLoad,
  diskUsage,
  netUsage,
  alerts,
}: Props) {
  if (!activeItem) return null;

  const renderContent = () => {
    switch (activeItem) {
      case 'cc':
        return (
          <>
            <div className="preview-stat-row">
              <span className="p-lbl">Bridge Connection</span>
              <span className="p-val" style={{ color: bridgeOnline ? '#00e676' : '#ff1744' }}>
                {bridgeOnline ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>
            
            {/* System Metrics */}
            <div className="preview-divider-title">SYSTEM RESOURCE METRICS</div>
            <div className="preview-metrics-grid">
              {[
                { label: 'CPU Load', value: cpuUsage, color: '#00d2ff' },
                { label: 'RAM Usage', value: ramLoad, color: '#d500f9' },
                { label: 'Disk Storage', value: diskUsage, color: '#00e676' },
                { label: 'Network I/O', value: netUsage, color: '#ffab00' },
              ].map(m => (
                <div key={m.label} className="p-metric-card">
                  <div className="p-m-lbl">{m.label}</div>
                  <div className="p-m-val" style={{ color: m.color }}>{Math.round(m.value)}%</div>
                  <div className="p-m-bar-track">
                    <div className="p-m-bar-fill" style={{ width: `${m.value}%`, background: m.color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Active Alerts */}
            <div className="preview-divider-title">ACTIVE ALERTS ({alerts.length})</div>
            <div className="p-alerts-list">
              {alerts.length === 0 ? (
                <div className="p-alert-ok">● All systems operating within nominal parameters.</div>
              ) : (
                alerts.map((a, i) => (
                  <div key={i} className={`p-alert-item p-alert-${a.type}`}>
                    ● {a.msg}
                  </div>
                ))
              )}
            </div>
          </>
        );

      case 'omega':
        return (
          <>
            <div className="preview-stat-row">
              <span className="p-lbl">Status</span>
              <span className="p-val" style={{ color: omegaOnline ? '#00e676' : '#ff1744' }}>
                {omegaOnline ? 'ONLINE' : 'UNREACHABLE'}
              </span>
            </div>
            <p className="p-desc">
              Omega Operations is the core operational dashboard mapping fleet logs, housing units, staff directory, clearances, and payroll tracking.
            </p>
            <div className="p-actions">
              <button className="p-action-btn" onClick={() => window.open('http://127.0.0.1:3000', '_blank')}>
                <ExternalLink size={12} /> Launch Dashboard
              </button>
            </div>
          </>
        );

      case 'recruit':
        return (
          <>
            <div className="preview-stat-row">
              <span className="p-lbl">Pipeline Status</span>
              <span className="p-val" style={{ color: recruitStat === 'ACTIVE' ? '#00e676' : '#ffab00' }}>
                {recruitStat}
              </span>
            </div>
            <p className="p-desc">
              Recruitment Hub manages applicant directories, CV screening databases, intake workflows, and private media assets. All files are secured behind zero-disclosure policies.
            </p>
            <div className="p-actions">
              <button className="p-action-btn" onClick={() => window.open('http://127.0.0.1:3820', '_blank')}>
                <ExternalLink size={12} /> Launch Recruitment Hub
              </button>
            </div>
          </>
        );

      case 'automation':
        return (
          <>
            <div className="preview-stat-row">
              <span className="p-lbl">Workflow Status</span>
              <span className="p-val" style={{ color: telStat === 'ACTIVE' ? '#00e676' : '#ffab00' }}>
                {telStat === 'ACTIVE' ? 'RUNNING' : 'STANDBY'}
              </span>
            </div>
            <p className="p-desc">
              Automation Layer triggers instant webhooks, processes CV ingestion, runs notifications inside Telegram channels, and routes data pipelines into Supabase.
            </p>
          </>
        );

      case 'security':
        return (
          <>
            <div className="preview-stat-row">
              <span className="p-lbl">Intrusion Shield</span>
              <span className="p-val" style={{ color: '#00e676' }}>ENABLED (100%)</span>
            </div>
            <p className="p-desc">
              Zero-Trust authentication protocols, secure token rotation, clearance check mechanisms, and private credential validation grids.
            </p>
          </>
        );

      case 'intelligence':
        return (
          <>
            <div className="preview-stat-row">
              <span className="p-lbl">AI Advisor Engine</span>
              <span className="p-val" style={{ color: novaOnline ? '#00d2ff' : '#ff1744' }}>
                {novaOnline ? 'ONLINE' : 'STANDBY'}
              </span>
            </div>
            <p className="p-desc">
              NOVA strategic AI layer powered by local LLM nodes. Monitors system health anomalies, drafts CLI patches, and provides context-aware command support.
            </p>
          </>
        );

      case 'deployment':
        return (
          <>
            <div className="preview-stat-row">
              <span className="p-lbl">Compiler Daemon</span>
              <span className="p-val" style={{ color: apiStat === 'ACTIVE' ? '#00e676' : '#ffab00' }}>
                {apiStat === 'ACTIVE' ? 'ACTIVE' : 'OFFLINE'}
              </span>
            </div>
            <p className="p-desc">
              Handles production bundle compilers, workspace asset verification, bridge polling logs, and telemetry daemons.
            </p>
          </>
        );

      case 'settings':
        return (
          <>
            <div className="preview-stat-row">
              <span className="p-lbl">Settings Node</span>
              <span className="p-val" style={{ color: '#a8b8cc' }}>ACTIVE</span>
            </div>
            <p className="p-desc">
              Adjust telemetry intervals, configure chat presets, toggle hardware acceleration, and map terminal layouts.
            </p>
          </>
        );

      default:
        return null;
    }
  };

  const getHeaderInfo = () => {
    const titles: Record<string, { title: string; Icon: React.ComponentType<{ size?: number; className?: string }> }> = {
      cc: { title: 'COMMAND CENTER', Icon: Database },
      omega: { title: 'OMEGA OPERATIONS', Icon: Globe },
      recruit: { title: 'RECRUITMENT HUB', Icon: Users },
      automation: { title: 'AUTOMATION LAYER', Icon: Cpu },
      security: { title: 'SECURITY GRID', Icon: Shield },
      intelligence: { title: 'INTELLIGENCE CORE', Icon: Brain },
      deployment: { title: 'DEPLOYMENT ENGINE', Icon: GitBranch },
      settings: { title: 'SYSTEM SETTINGS', Icon: Settings },
    };
    return titles[activeItem] || { title: 'SYSTEM MODULE', Icon: Activity };
  };

  const header = getHeaderInfo();

  return (
    <AnimatePresence>
      <motion.div
        className="nova-launcher-preview-panel glass"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.25 }}
      >
        <div className="p-header">
          <div className="p-header-title">
            <header.Icon size={14} className="p-header-icon" />
            <span>{header.title}</span>
          </div>
          <button className="p-close-btn" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
        <div className="p-body">
          {renderContent()}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
