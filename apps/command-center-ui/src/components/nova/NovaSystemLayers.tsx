import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Users, Settings, Shield, Brain, GitBranch, X, AlertTriangle } from 'lucide-react';

interface LayerDef {
  id: string;
  title: string;
  Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  health: number;
  stat1Label: string;
  stat1Val: string;
  stat2Label: string;
  stat2Val: string;
  color: string;
  position: string;
  risk: 'Nominal' | 'Low' | 'Medium' | 'Critical';
  recommendation: string;
}

interface Props {
  omegaOnline: boolean;
  recruitStat: string;
  telStat: string;
  apiStat: string;
  onLayerClick: (id: string) => void;
}

export function NovaSystemLayers({ omegaOnline, recruitStat, telStat, apiStat, onLayerClick }: Props) {
  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);

  const layers: LayerDef[] = [
    {
      id: 'operations', title: 'OPERATIONS', Icon: Database,
      health: omegaOnline ? 98 : 0,
      stat1Label: 'Active Tasks', stat1Val: omegaOnline ? '12' : '0',
      stat2Label: 'Events', stat2Val: omegaOnline ? '84' : '0',
      color: '#00e676', position: 'pos-tl',
      risk: omegaOnline ? 'Nominal' : 'Critical',
      recommendation: omegaOnline ? 'Maintain current build queue.' : 'Verify Omega Docker node and restore Supabase connectivity.',
    },
    {
      id: 'recruitment', title: 'RECRUITMENT', Icon: Users,
      health: recruitStat === 'ACTIVE' ? 93 : 0,
      stat1Label: 'Active Tasks', stat1Val: '7',
      stat2Label: 'Candidates', stat2Val: '128',
      color: '#d500f9', position: 'pos-ml',
      risk: recruitStat === 'ACTIVE' ? 'Nominal' : 'Medium',
      recommendation: recruitStat === 'ACTIVE' ? 'Processing daily candidate logs.' : 'Ingestion daemon suspended. Run manual restart.',
    },
    {
      id: 'automation', title: 'AUTOMATION', Icon: Settings,
      health: telStat === 'ACTIVE' ? 97 : 0,
      stat1Label: 'Active Bots', stat1Val: '9',
      stat2Label: 'Executions', stat2Val: '312',
      color: '#7b61ff', position: 'pos-bl',
      risk: telStat === 'ACTIVE' ? 'Nominal' : 'Medium',
      recommendation: telStat === 'ACTIVE' ? 'Monitoring WhatsApp & Slack bots.' : 'Telegram status indicates loop crash. Check token configurations.',
    },
    {
      id: 'security', title: 'SECURITY', Icon: Shield,
      health: 99,
      stat1Label: 'Threats Blocked', stat1Val: '0',
      stat2Label: 'Port Scans', stat2Val: '23',
      color: '#ffab00', position: 'pos-tr',
      risk: 'Nominal',
      recommendation: 'All gateway interfaces secured. Key rotation up to date.',
    },
    {
      id: 'intelligence', title: 'INTELLIGENCE', Icon: Brain,
      health: 96,
      stat1Label: 'Analyses Run', stat1Val: '15',
      stat2Label: 'Active Insights', stat2Val: '42',
      color: '#00d2ff', position: 'pos-mr',
      risk: 'Nominal',
      recommendation: 'Ollama local inference response rates within bounds.',
    },
    {
      id: 'deployment', title: 'DEPLOYMENT', Icon: GitBranch,
      health: apiStat === 'ACTIVE' ? 94 : 60,
      stat1Label: 'Pipelines', stat1Val: '3',
      stat2Label: 'Deploys Today', stat2Val: '27',
      color: '#00d2ff', position: 'pos-br',
      risk: apiStat === 'ACTIVE' ? 'Nominal' : 'Low',
      recommendation: apiStat === 'ACTIVE' ? 'All deployment pipelines online.' : 'Bridge API unreachable. Local artifacts compiling in fallback mode.',
    },
  ];

  const handleChipClick = (layer: LayerDef) => {
    setActiveLayer(activeLayer === layer.id ? null : layer.id);
    onLayerClick(layer.id);
  };

  const getRiskColor = (risk: LayerDef['risk']) => {
    switch (risk) {
      case 'Nominal': return '#00e676';
      case 'Low': return '#00d2ff';
      case 'Medium': return '#ffab00';
      case 'Critical': return '#ff1744';
      default: return '#a8b8cc';
    }
  };

  return (
    <>
      {layers.map((layer, idx) => {
        const isHovered = hoveredLayer === layer.id;
        const isSelected = activeLayer === layer.id;
        const isOnline = layer.health > 0;

        return (
          <div
            key={layer.id}
            className={`layer-chip-container ${layer.position}`}
            style={{ '--layer-color': layer.color } as React.CSSProperties}
          >
            {/* MINIMIZED CHIP */}
            <motion.div
              className={`layer-chip ${isSelected ? 'selected' : ''}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.05 }}
              onMouseEnter={() => setHoveredLayer(layer.id)}
              onMouseLeave={() => setHoveredLayer(null)}
              onClick={() => handleChipClick(layer)}
            >
              <div className="chip-icon" style={{ color: layer.color }}>
                <layer.Icon size={12} />
              </div>
              <span className="chip-title">{layer.title}</span>
              <span className="chip-dot" style={{ background: isOnline ? '#00e676' : '#ff1744' }} />
              
              {/* Mini Sparkline Line */}
              <div className="chip-pulse-line" style={{ background: layer.color }} />
            </motion.div>

            {/* MINI HOVER CARD (Only if not selected) */}
            <AnimatePresence>
              {isHovered && !isSelected && (
                <motion.div
                  className="chip-hover-popover glass"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                >
                  <span className="pop-health">HEALTH: {layer.health}%</span>
                  <span className="pop-stats">{layer.stat1Label}: {layer.stat1Val}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* FLOATING TACTICAL OVERLAY */}
            <AnimatePresence>
              {isSelected && (
                <motion.div
                  className="tactical-layer-card glass"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="tc-header">
                    <div className="tc-title-row">
                      <layer.Icon size={12} style={{ color: layer.color }} />
                      <span className="tc-title">{layer.title} TACTICAL FEED</span>
                    </div>
                    <button className="tc-close-btn" onClick={() => setActiveLayer(null)}>
                      <X size={12} />
                    </button>
                  </div>

                  <div className="tc-body">
                    <div className="tc-metric-row">
                      <div>
                        <div className="tc-label">LAYER HEALTH</div>
                        <div className="tc-value" style={{ color: isOnline ? '#00e676' : '#ff1744' }}>
                          {isOnline ? `${layer.health}%` : 'OFFLINE'}
                        </div>
                      </div>
                      <div>
                        <div className="tc-label">RISK FACTOR</div>
                        <div className="tc-value" style={{ color: getRiskColor(layer.risk) }}>
                          {layer.risk}
                        </div>
                      </div>
                    </div>

                    <div className="tc-divider" />

                    <div className="tc-stats-grid">
                      <div>
                        <span className="tc-stat-lbl">{layer.stat1Label}</span>
                        <span className="tc-stat-val">{layer.stat1Val}</span>
                      </div>
                      <div>
                        <span className="tc-stat-lbl">{layer.stat2Label}</span>
                        <span className="tc-stat-val">{layer.stat2Val}</span>
                      </div>
                    </div>

                    <div className="tc-recommendation">
                      <div className="rec-title">
                        <AlertTriangle size={10} style={{ color: getRiskColor(layer.risk) }} />
                        <span>RECOMMENDED COMMAND</span>
                      </div>
                      <p className="rec-text">{layer.recommendation}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </>
  );
}
