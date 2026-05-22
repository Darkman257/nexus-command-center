import { motion } from 'framer-motion';
import { Activity, Zap, Cpu, Bell } from 'lucide-react';

interface Props {
  currentTime: string;
  currentDate: string;
  omegaStatus: { status: string; responseMs?: number };
  novaOnline: boolean;
  novaProvider: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  bridgeOnline: boolean;
}

export function NovaTopBar({
  currentTime,
  currentDate,
  omegaStatus,
  novaOnline,
  novaProvider,
  isRefreshing,
  onRefresh,
  bridgeOnline,
}: Props) {
  return (
    <header className="nova-top-bar">
      {/* Brand */}
      <div className="top-brand">
        <span className="top-brand-title">NEXUS</span>
        <span className="top-brand-sub">COMMAND CENTER · v1.0.0</span>
      </div>

      {/* System Metrics */}
      <div className="top-metrics-strip">
        <div className="top-metric">
          <Activity size={12} className="top-metric-icon" />
          <div>
            <span className="top-metric-label">SYSTEM HEALTH</span>
            <span className={`top-metric-value ${omegaStatus.status === 'online' ? 'val-optimal' : 'val-offline'}`}>
              {omegaStatus.status === 'online' ? 'OPTIMAL' : 'DEGRADED'}
            </span>
          </div>
        </div>

        <div className="top-divider" />

        <div className="top-metric">
          <Zap size={12} className="top-metric-icon" />
          <div>
            <span className="top-metric-label">NOVA STATUS</span>
            <span className={`top-metric-value ${novaOnline ? 'val-cyan' : 'val-offline'}`}>
              {novaOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        <div className="top-divider" />

        <div className="top-metric">
          <Cpu size={12} className="top-metric-icon" />
          <div>
            <span className="top-metric-label">LOCAL ENGINE</span>
            <span className={`top-metric-value ${novaOnline ? 'val-cyan' : 'val-amber'}`}>
              {novaProvider === 'ollama' ? 'OLLAMA' : 'STANDBY'}
            </span>
          </div>
        </div>

        <div className="top-divider" />

        <div className="top-metric">
          <Bell size={12} className="top-metric-icon" />
          <div>
            <span className="top-metric-label">BRIDGE</span>
            <span className={`top-metric-value ${bridgeOnline ? 'val-optimal' : 'val-offline'}`}>
              {bridgeOnline ? 'CONNECTED' : 'OFFLINE'}
            </span>
          </div>
        </div>

        <div className="top-divider" />

        <div className="top-metric">
          <Activity size={12} className="top-metric-icon" />
          <div>
            <span className="top-metric-label">RESPONSE</span>
            <span className="top-metric-value val-cyan">
              {omegaStatus.responseMs != null ? `${omegaStatus.responseMs}ms` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Clock + Refresh */}
      <div className="top-clock-area">
        <motion.button
          className="refresh-btn"
          onClick={onRefresh}
          animate={{ rotate: isRefreshing ? 360 : 0 }}
          transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: 'linear' }}
          title="Force telemetry poll"
        >
          <Activity size={14} />
        </motion.button>
        <div className="top-clock">
          <div className="top-clock-time">{currentTime}</div>
          <div className="top-clock-date">{currentDate}</div>
        </div>
      </div>
    </header>
  );
}
