import { motion } from 'framer-motion';
import { Database, Globe, Users, Cpu, Shield, Brain, GitBranch, Settings } from 'lucide-react';

interface LauncherItem {
  id: string;
  name: string;
  Icon: React.FC<{ size?: number }>;
  color: string;
  status: 'online' | 'offline' | 'warning' | 'standby';
}

interface Props {
  activeItem: string | null;
  setActiveItem: (id: string | null) => void;
  omegaOnline: boolean;
  recruitStat: string;
  telStat: string;
  apiStat: string;
  novaOnline: boolean;
  bridgeOnline: boolean;
}

export function NovaLauncherRail({
  activeItem,
  setActiveItem,
  omegaOnline,
  recruitStat,
  telStat,
  apiStat,
  novaOnline,
  bridgeOnline,
}: Props) {
  const getStatus = (id: string): LauncherItem['status'] => {
    switch (id) {
      case 'cc':
        return bridgeOnline ? 'online' : 'offline';
      case 'omega':
        return omegaOnline ? 'online' : 'offline';
      case 'recruit':
        return recruitStat === 'ACTIVE' ? 'online' : recruitStat === 'OFFLINE' ? 'offline' : 'standby';
      case 'automation':
        return telStat === 'ACTIVE' ? 'online' : 'standby';
      case 'security':
        return 'online';
      case 'intelligence':
        return novaOnline ? 'online' : 'standby';
      case 'deployment':
        return apiStat === 'ACTIVE' ? 'online' : 'warning';
      default:
        return 'standby';
    }
  };

  const items: LauncherItem[] = [
    { id: 'cc', name: 'Command Center', Icon: Database, color: '#00d2ff', status: getStatus('cc') },
    { id: 'omega', name: 'Omega Operations', Icon: Globe, color: '#00e676', status: getStatus('omega') },
    { id: 'recruit', name: 'Recruitment Hub', Icon: Users, color: '#d500f9', status: getStatus('recruit') },
    { id: 'automation', name: 'Automation Layer', Icon: Cpu, color: '#7b61ff', status: getStatus('automation') },
    { id: 'security', name: 'Security Grid', Icon: Shield, color: '#ffab00', status: getStatus('security') },
    { id: 'intelligence', name: 'Intelligence Core', Icon: Brain, color: '#00d2ff', status: getStatus('intelligence') },
    { id: 'deployment', name: 'Deployment Engine', Icon: GitBranch, color: '#00d2ff', status: getStatus('deployment') },
    { id: 'settings', name: 'Settings', Icon: Settings, color: '#a8b8cc', status: 'standby' },
  ];

  const handleItemClick = (id: string) => {
    if (activeItem === id) {
      setActiveItem(null);
    } else {
      setActiveItem(id);
    }
  };

  const dotColors: Record<LauncherItem['status'], string> = {
    online: '#00e676',
    offline: '#ff1744',
    warning: '#ffab00',
    standby: '#7b61ff',
  };

  return (
    <aside className="nova-launcher-rail">
      <div className="launcher-items">
        {items.map((item) => {
          const isActive = activeItem === item.id;
          const statusColor = dotColors[item.status];
          return (
            <div key={item.id} className="launcher-btn-container">
              <motion.button
                className={`launcher-btn ${isActive ? 'active' : ''}`}
                style={{ '--btn-color': item.color } as React.CSSProperties}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleItemClick(item.id)}
              >
                <item.Icon size={18} />
                <span className="btn-indicator" style={{ background: statusColor }} />
              </motion.button>
              
              {/* Tooltip on Hover */}
              <div className="launcher-tooltip">
                <span className="tooltip-name">{item.name}</span>
                <span className="tooltip-status" style={{ color: statusColor }}>
                  ● {item.status.toUpperCase()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
