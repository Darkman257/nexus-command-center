import { useState } from 'react';
import { Cpu, Network, Brain, Database, Server } from 'lucide-react';
import { RuntimeMemory } from './RuntimeMemory';
import { DataIntake } from './DataIntake';
import { RuntimeServicesPanel } from './RuntimeServicesPanel';
import SystemGraph3D from './SystemGraph3D';
import { OperationalGraph } from './OperationalGraph';

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview',  label: 'Overview',  icon: Cpu },
  { id: 'graph',     label: 'Graph 3D',  icon: Network },
  { id: 'memory',    label: 'Memory',    icon: Brain },
  { id: 'dataflow',  label: 'Data Flow', icon: Database },
  { id: 'services',  label: 'Services',  icon: Server },
] as const;

type TabId = typeof TABS[number]['id'];

// ─── Overview sub-page ────────────────────────────────────────────────────────

function OverviewTab() {
  const cards = [
    {
      title: 'Graph 3D',
      desc: 'Interactive 3D map of every NEXUS node, edge, and data flow. Click a node to inspect its operational role, ports, and dependencies.',
      icon: Network,
      color: '#00d2ff',
      tab: 'graph',
    },
    {
      title: 'Memory',
      desc: 'NOVA runtime memory engine — observation log, calibration stats, evidence registry, Al-Kindi and Ibn Haytham reasoning councils.',
      icon: Brain,
      color: '#d500f9',
      tab: 'memory',
    },
    {
      title: 'Data Flow',
      desc: 'Intake channel status — WhatsApp, email, Excel pipeline. Monitor active ingestion sources and processing state.',
      icon: Database,
      color: '#7b61ff',
      tab: 'dataflow',
    },
    {
      title: 'Services',
      desc: 'Technical service control panel (hidden from main nav). Start, stop, restart, and inspect all runtime services.',
      icon: Server,
      color: '#ffab00',
      tab: 'services',
    },
  ] satisfies { title: string; desc: string; icon: React.FC<{ size?: number }>; color: string; tab: TabId }[];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, padding: '8px 0' }}>
      {cards.map(card => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            style={{
              background: `${card.color}0a`,
              border: `1px solid ${card.color}22`,
              borderRadius: 10, padding: '18px 20px',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: `${card.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={16} style={{ color: card.color }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#e0e6ef' }}>{card.title}</span>
            </div>
            <div style={{ fontSize: 12, color: '#546e7a', lineHeight: 1.6 }}>{card.desc}</div>
          </div>
        );
      })}

      {/* Operational metrics card */}
      <div style={{
        background: 'rgba(255,255,255,0.02)', border: '1px solid #1a2433',
        borderRadius: 10, padding: '18px 20px', gridColumn: '1 / -1',
      }}>
        <div style={{ fontSize: 11, color: '#37474f', fontFamily: 'monospace', letterSpacing: 2, marginBottom: 14 }}>
          OPERATIONAL GRAPH — QUICK METRICS
        </div>
        <OperationalGraph />
      </div>
    </div>
  );
}

// ─── NEXUS Core Page ──────────────────────────────────────────────────────────

export function NexusCore({ onAskNova }: { onAskNova?: (prompt: string) => void } = {}) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <section style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px 24px 0', gap: 16, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <Cpu size={18} style={{ color: '#00d2ff' }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e0e6ef', letterSpacing: 1 }}>NEXUS CORE</div>
          <div style={{ fontSize: 10, color: '#546e7a', letterSpacing: 1 }}>system graph · memory · data flow · services</div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #1a2433', flexShrink: 0 }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          const isServices = tab.id === 'services';
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', background: 'none', border: 'none',
                borderBottom: active ? '2px solid #00d2ff' : '2px solid transparent',
                color: active ? '#00d2ff' : isServices ? '#ffab0088' : '#546e7a',
                fontFamily: 'monospace', fontSize: 12, cursor: 'pointer', letterSpacing: 1,
                marginBottom: -1, transition: 'color 0.15s',
              }}
            >
              <Icon size={13} />
              {tab.label}
              {isServices && (
                <span style={{ fontSize: 8, color: '#546e7a', border: '1px solid #1a2433', padding: '1px 4px', borderRadius: 3, marginLeft: 4 }}>TECH</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'overview' && (
          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24 }}>
            <OverviewTab />
          </div>
        )}
        {activeTab === 'graph' && <SystemGraph3D onAskNova={(prompt) => {
          try { sessionStorage.setItem('nexus_nova_pending_prompt', prompt); } catch {}
          onAskNova?.(prompt);
        }} />}
        {activeTab === 'memory' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <RuntimeMemory />
          </div>
        )}
        {activeTab === 'dataflow' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <DataIntake />
          </div>
        )}
        {activeTab === 'services' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <RuntimeServicesPanel />
          </div>
        )}
      </div>
    </section>
  );
}

export default NexusCore;
