import { motion } from 'framer-motion';
import { Database, Users, Globe, Shield, Brain, Cpu } from 'lucide-react';

interface SystemItem {
  id: string;
  title: string;
  sub: string;
  Icon: React.FC<{ size?: number }>;
  color: string;
  status: string;
  onClick?: () => void;
}

interface Props {
  omegaOnline: boolean;
  bridgeOnline: boolean;
  recruitStat: string;
  apiStat: string;
  telStat: string;
  novaOnline: boolean;
  cpuUsage: number;
  ramLoad: number;
  diskUsage: number;
  netUsage: number;
  alerts: { msg: string; type: 'warn' | 'critical' | 'ok' }[];
}

function StatusDot({ status, color }: { status: string; color: string }) {
  const isActive = ['ACTIVE', 'ONLINE', 'CONNECTED'].includes(status.toUpperCase());
  return (
    <motion.div
      className="sys-dot"
      style={{ background: isActive ? color : '#ff1744' }}
      animate={isActive ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="metric-bar-track">
      <motion.div
        className="metric-bar-fill"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8 }}
      />
    </div>
  );
}

export function NovaMetricsPanel({ omegaOnline, bridgeOnline: _bridgeOnline, recruitStat, apiStat: _apiStat, telStat, novaOnline: _novaOnline, cpuUsage, ramLoad, diskUsage, netUsage, alerts }: Props) {
  const systems: SystemItem[] = [
    { id: 'core', title: 'OPERATIONS CORE', sub: 'Command & Control', Icon: Database, color: '#00d2ff', status: 'ONLINE' },
    { id: 'omega', title: 'OMEGA OPERATIONS', sub: 'Core Business Engine', Icon: Globe, color: omegaOnline ? '#00e676' : '#ff1744', status: omegaOnline ? 'ONLINE' : 'OFFLINE', onClick: () => window.open('http://127.0.0.1:3000', '_blank') },
    { id: 'recruit', title: 'RECRUITMENT HUB', sub: 'Talent Pipeline', Icon: Users, color: recruitStat === 'ACTIVE' ? '#00e676' : '#ffab00', status: recruitStat },
    { id: 'automation', title: 'AUTOMATION LAYER', sub: 'Workflows & Bots', Icon: Cpu, color: telStat === 'ACTIVE' ? '#d500f9' : '#ffab00', status: telStat },
    { id: 'security', title: 'SECURITY GRID', sub: 'Protection Layer', Icon: Shield, color: '#ffab00', status: 'ACTIVE' },
    { id: 'intelligence', title: 'INTELLIGENCE CORE', sub: 'Analytics & Insights', Icon: Brain, color: '#00d2ff', status: 'ACTIVE' },
  ];

  return (
    <aside className="nova-metrics-panel">
      {/* System Overview */}
      <div className="nmp-section">
        <div className="nmp-section-header">SYSTEM OVERVIEW</div>
        <ul className="sys-overview-list">
          {systems.map((item, idx) => (
            <motion.li
              key={item.id}
              className="sys-overview-item"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ backgroundColor: 'rgba(0,210,255,0.07)', x: 2 }}
              onClick={item.onClick}
              style={{ cursor: item.onClick ? 'pointer' : 'default' }}
            >
              <div className="sys-icon" style={{ color: item.color, borderColor: `${item.color}55` }}>
                <item.Icon size={13} />
              </div>
              <div className="sys-info">
                <span className="sys-title">{item.title}</span>
                <span className="sys-sub">{item.sub}</span>
              </div>
              <StatusDot status={item.status} color={item.color} />
              <span className="sys-status" style={{ color: ['ACTIVE','ONLINE','CONNECTED'].includes(item.status.toUpperCase()) ? item.color : '#ff1744' }}>
                {item.status}
              </span>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* System Metrics */}
      <div className="nmp-section">
        <div className="nmp-section-header">SYSTEM METRICS</div>
        <div className="metrics-quad">
          {[
            { label: 'CPU', value: cpuUsage, color: '#00d2ff' },
            { label: 'RAM', value: ramLoad, color: '#d500f9' },
            { label: 'DISK', value: diskUsage, color: '#00e676' },
            { label: 'NET', value: netUsage, color: '#ffab00' },
          ].map(m => (
            <div key={m.label} className="metric-cell">
              <span className="metric-lbl">{m.label}</span>
              <span className="metric-val" style={{ color: m.color }}>{Math.round(m.value)}%</span>
              <ProgressBar value={m.value} color={m.color} />
            </div>
          ))}
        </div>
      </div>

      {/* Active Alerts */}
      <div className="nmp-section nmp-section-alerts">
        <div className="nmp-section-header">ACTIVE ALERTS</div>
        <div className="alerts-container">
          {alerts.length === 0 && (
            <div className="alert-row alert-ok">
              <span className="alert-dot" style={{ background: '#00e676' }} />
              <span>No critical issues</span>
            </div>
          )}
          {alerts.map((a, i) => (
            <motion.div
              key={i}
              className={`alert-row alert-${a.type}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <span className="alert-dot" style={{ background: a.type === 'critical' ? '#ff1744' : a.type === 'warn' ? '#ffab00' : '#00e676' }} />
              <span>{a.msg}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </aside>
  );
}
