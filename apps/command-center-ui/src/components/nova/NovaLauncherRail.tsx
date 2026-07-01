import { Activity, LayoutGrid, Sparkles, Radio, FileText, Cpu, Settings, Server } from 'lucide-react';

interface LauncherItem {
  id: string;
  name: string;
  Icon: React.FC<{ size?: number; className?: string }>;
  color: string;
  status: 'online' | 'offline' | 'warning' | 'standby';
}

interface Props {
  activeItem: string | null;
  setActiveItem: (id: string | null) => void;
  omegaOnline: boolean;
  recruitStat: string;
  telStat: string;
  novaOnline: boolean;
  bridgeOnline: boolean;
}

export function NovaLauncherRail({
  activeItem,
  setActiveItem,
  omegaOnline,
  recruitStat,
  telStat,
  novaOnline,
  bridgeOnline,
}: Props) {
  const getStatus = (id: string): LauncherItem['status'] => {
    switch (id) {
      case 'cc':          return bridgeOnline ? 'online' : 'offline';
      case 'workspaces':  return omegaOnline || recruitStat === 'ACTIVE' ? 'online' : 'standby';
      case 'nova':        return novaOnline ? 'online' : 'offline';
      case 'intelligence':return novaOnline ? 'online' : 'standby';
      case 'automations': return telStat === 'ACTIVE' ? 'online' : 'standby';
      default:            return 'standby';
    }
  };

  const items: LauncherItem[] = [
    { id: 'cc',           name: 'Situation Room', Icon: Activity,    color: '#00d2ff', status: getStatus('cc') },
    { id: 'workspaces',   name: 'Workspaces',     Icon: LayoutGrid,  color: '#00e676', status: getStatus('workspaces') },
    { id: 'nova',         name: 'NOVA',           Icon: Sparkles,    color: '#d500f9', status: getStatus('nova') },
    { id: 'intelligence', name: 'Intelligence',   Icon: Radio,       color: '#7b61ff', status: getStatus('intelligence') },
    { id: 'reports',      name: 'Reports',        Icon: FileText,    color: '#a8b8cc', status: 'standby' },
    { id: 'automations',  name: 'Automations',    Icon: Cpu,         color: '#ffab00', status: getStatus('automations') },
    { id: 'nexus-core',   name: 'NEXUS Core',     Icon: Server,      color: '#00d2ff', status: 'online' },
    { id: 'settings',     name: 'Settings',       Icon: Settings,    color: '#546e7a', status: 'online' },
  ];

  const dotColors: Record<LauncherItem['status'], string> = {
    online:  '#00e676',
    offline: '#ff1744',
    warning: '#ffab00',
    standby: '#37474f',
  };

  const handleItemClick = (id: string) => {
    setActiveItem(activeItem === id ? null : id);
  };

  return (
    <aside className="nexus-sidebar">
      {/* Logo */}
      <div className="sidebar-logo-container">
        <div className="sidebar-logo-icon">
          <Activity size={18} style={{ color: 'var(--cyan)' }} />
        </div>
        <div className="sidebar-logo-text">
          <span className="logo-brand">NEXUS</span>
          <span className="logo-sub">COMMAND CENTER</span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="sidebar-nav">
        {items.map(item => {
          const isActive = activeItem === item.id || (activeItem === null && item.id === 'cc');
          const statusColor = dotColors[item.status];
          return (
            <button
              key={item.id}
              className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
              style={{ '--btn-color': item.color } as React.CSSProperties}
              onClick={() => handleItemClick(item.id)}
            >
              <item.Icon size={16} className="sidebar-btn-icon" />
              <span className="sidebar-btn-label">{item.name}</span>
              <span
                className="sidebar-btn-dot"
                style={{
                  background: statusColor,
                  boxShadow: item.status === 'online' ? `0 0 5px ${statusColor}` : 'none',
                }}
              />
            </button>
          );
        })}
      </nav>

      {/* Footer orb */}
      <div className="sidebar-footer">
        <div className="sidebar-glowing-orb">
          <div className="orb-ring-1" />
          <div className="orb-ring-2" />
          <div className="orb-core" />
        </div>
      </div>
    </aside>
  );
}

export default NovaLauncherRail;
