import { useState, useEffect } from 'react';
import { Radio, Bell, ShieldAlert, AlertTriangle, CheckCircle, Terminal, Copy, Bookmark, Globe, Users, Cpu } from 'lucide-react';
import { globalRuntimeBus } from '../runtime/bus/runtimeBus';
import type { RuntimeEvent } from '../runtime/contracts/runtimeEvent';
import type { QualifiedSignal } from '../runtime/signals/signalPipeline';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FeedItem {
  id: string;
  category: 'SYSTEM' | 'FLEET' | 'RECRUIT';
  title: string;
  description: string;
  timestamp: string;
}

// ─── Sub-tab: Intelligence Feed ───────────────────────────────────────────────

function FeedTab() {
  const [filter, setFilter] = useState<'ALL' | 'SYSTEM' | 'FLEET' | 'RECRUIT'>('ALL');
  const [feedItems, setFeedItems] = useState<FeedItem[]>([
    { id: 'item-01', category: 'SYSTEM', title: 'Local Bridge Daemon Port Sync Verified', description: 'System scanned port 9999 local-loop. Data synchronization pipelines verified stable.', timestamp: '5m ago' },
    { id: 'item-02', category: 'FLEET',  title: 'Vehicle Fleet Check-in Processed',       description: 'Vehicle identification parsed. Driver attendance record updated in OMEGA tables.', timestamp: '15m ago' },
    { id: 'item-03', category: 'RECRUIT',title: 'Clearance Sanitizer Passed for Candidate Briefing', description: 'Applicant profile scanned. Raw email PDF assets sanitized.', timestamp: '1h ago' },
    { id: 'item-04', category: 'SYSTEM', title: 'Omega Gateway Health Check Passed',      description: 'API gateway on port 5001 responded in under 200ms. All routes nominal.', timestamp: '2h ago' },
    { id: 'item-05', category: 'FLEET',  title: 'Refuel Request Logged for Vehicle #VH-08',description: 'Refuel consumption logged. Pending approval.', timestamp: '3h ago' },
  ]);

  useEffect(() => {
    const unsub = globalRuntimeBus.subscribe('*', (event: RuntimeEvent) => {
      if (event.event_type === 'SYSTEM_EVENT' || event.event_type === 'RUNTIME_UPDATE') {
        const payload = (event.payload ?? {}) as Record<string, unknown>;
        const newItem: FeedItem = {
          id: `item-${Date.now()}`,
          category: 'SYSTEM',
          title: typeof payload['title'] === 'string' ? payload['title'] : 'Runtime Event',
          description: typeof payload['message'] === 'string' ? payload['message'] : JSON.stringify(payload),
          timestamp: 'just now',
        };
        setFeedItems(prev => [newItem, ...prev.slice(0, 49)]);
      }
    });
    return () => { unsub?.(); };
  }, []);

  const filtered = filter === 'ALL' ? feedItems : feedItems.filter(i => i.category === filter);
  const catColors: Record<FeedItem['category'], string> = { SYSTEM: '#00d2ff', FLEET: '#ffab00', RECRUIT: '#d500f9' };
  const catIcons: Record<FeedItem['category'], React.FC<{ size?: number; className?: string }>> = {
    SYSTEM: Cpu, FLEET: Globe, RECRUIT: Users,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8 }}>
        {(['ALL', 'SYSTEM', 'FLEET', 'RECRUIT'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '5px 14px', borderRadius: 4,
              background: filter === f ? 'rgba(0,210,255,0.15)' : 'transparent',
              border: filter === f ? '1px solid #00d2ff55' : '1px solid #1a2433',
              color: filter === f ? '#00d2ff' : '#546e7a',
              fontFamily: 'monospace', fontSize: 11, cursor: 'pointer', letterSpacing: 1,
            }}
          >{f}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 10, color: '#37474f', alignSelf: 'center' }}>
          {filtered.length} events
        </span>
      </div>

      {/* Feed items */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(item => {
          const color = catColors[item.category];
          const Icon = catIcons[item.category];
          return (
            <div key={item.id} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid #1a2433',
              borderLeft: `2px solid ${color}`, borderRadius: 6, padding: '10px 14px',
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <Icon size={14} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: '#cfd8dc', fontWeight: 600, marginBottom: 3 }}>{item.title}</div>
                <div style={{ fontSize: 11, color: '#546e7a', lineHeight: 1.5 }}>{item.description}</div>
              </div>
              <div style={{ flexShrink: 0, fontSize: 10, color: '#37474f', fontFamily: 'monospace' }}>{item.timestamp}</div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: '#37474f', fontFamily: 'monospace', fontSize: 12, paddingTop: 40 }}>
            No events for filter: {filter}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-tab: Signals ─────────────────────────────────────────────────────────

const actionBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#546e7a', fontSize: 10, fontFamily: 'monospace',
  padding: '4px 8px', borderRadius: 3, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 4,
};

function SignalsTab() {
  const [signals, setSignals] = useState<QualifiedSignal[]>([
    {
      signal_id: 'sig-01', title: 'Bridge Daemon Connection Error', source: 'NEXUS RUNTIME BRIDGE',
      severity: 'CRITICAL',
      description: 'The local Bridge Daemon is unreachable on port 9999.',
      timestamp: '2m ago', confidence: 1.0, evidence_refs: ['bridge-daemon-process'],
      event_id: 'evt-bridge-01', correlations: ['bridge.daemon.unreachable'],
      recommendation: 'Restart Bridge Daemon service and verify port 9999.',
    },
    {
      signal_id: 'sig-02', title: 'Omega Gateway Unknown State', source: 'NEXUS TELEMETRY',
      severity: 'WARNING',
      description: 'Bridge is offline so Omega Gateway status cannot be confirmed.',
      timestamp: '2m ago', confidence: 0.5, evidence_refs: [],
      event_id: 'evt-gateway-02', correlations: [],
      recommendation: 'Start Bridge Daemon to restore Omega telemetry.',
    },
  ]);

  useEffect(() => {
    const unsub = globalRuntimeBus.subscribe('SIGNAL_FIRED', (event: RuntimeEvent) => {
      const raw = (event.payload ?? {}) as Partial<QualifiedSignal>;
      setSignals(prev => [{
        signal_id: raw.signal_id ?? `sig-${Date.now()}`,
        title: raw.title ?? 'Runtime Signal',
        source: raw.source ?? 'RUNTIME',
        severity: raw.severity ?? 'INFO',
        description: raw.description ?? '',
        timestamp: 'just now',
        confidence: raw.confidence ?? 0.8,
        evidence_refs: raw.evidence_refs ?? [],
        event_id: raw.event_id ?? '',
        correlations: raw.correlations ?? [],
        recommendation: raw.recommendation ?? '',
      }, ...prev.slice(0, 49)]);
    });

    return () => { unsub?.(); };
  }, []);

  const sevColor: Record<string, string> = { CRITICAL: '#ff1744', WARNING: '#ffab00', RISK: '#ff6d00', INFO: '#00d2ff', OBSERVATION: '#7b61ff' };
  const SevIcon: Record<string, React.FC<{ size?: number }>> = { CRITICAL: ShieldAlert, WARNING: AlertTriangle, RISK: AlertTriangle, INFO: Terminal, OBSERVATION: Bell };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', overflowY: 'auto' }}>
      {signals.map(sig => {
        const color = sevColor[sig.severity] ?? '#546e7a';
        const Icon = SevIcon[sig.severity] ?? Bell;
        return (
          <div key={sig.signal_id} style={{
            background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}22`,
            borderLeft: `3px solid ${color}`, borderRadius: 6, padding: '12px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Icon size={14} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#e0e6ef' }}>{sig.title}</span>
              <span style={{ marginLeft: 'auto', fontSize: 9, color, border: `1px solid ${color}44`, padding: '2px 6px', borderRadius: 3, fontFamily: 'monospace' }}>{sig.severity}</span>
            </div>
            <div style={{ fontSize: 11, color: '#546e7a', lineHeight: 1.6, marginBottom: 6 }}>{sig.description}</div>
            {sig.recommendation && (
              <div style={{ fontSize: 11, color: '#00d2ff88', marginBottom: 8 }}>→ {sig.recommendation}</div>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={actionBtnStyle} onClick={() => navigator.clipboard.writeText(sig.signal_id).catch(() => {})}><Copy size={10} /> Copy ID</button>
              <button style={actionBtnStyle}><Bookmark size={10} /> Suppress</button>
              <span style={{ marginLeft: 'auto', fontSize: 9, color: '#37474f', fontFamily: 'monospace' }}>{sig.timestamp}</span>
            </div>
          </div>
        );
      })}
      {signals.length === 0 && (
        <div style={{ textAlign: 'center', color: '#37474f', fontFamily: 'monospace', fontSize: 12, paddingTop: 40 }}>
          <CheckCircle size={24} />
          <div style={{ marginTop: 8 }}>All clear — no active signals.</div>
        </div>
      )}
    </div>
  );
}

// ─── Intelligence Page ─────────────────────────────────────────────────────────

const TABS = [
  { id: 'feed',    label: 'Feed',             icon: Radio },
  { id: 'signals', label: 'Signals & Alerts', icon: ShieldAlert },
] as const;

type TabId = typeof TABS[number]['id'];

export function Intelligence() {
  const [activeTab, setActiveTab] = useState<TabId>('feed');

  return (
    <section style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px 24px', gap: 16, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <Radio size={18} style={{ color: '#d500f9' }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e0e6ef', letterSpacing: 1 }}>INTELLIGENCE</div>
          <div style={{ fontSize: 10, color: '#546e7a', letterSpacing: 1 }}>Runtime event feed · signals · alerts</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #1a2433', flexShrink: 0 }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', background: 'none', border: 'none',
                borderBottom: active ? '2px solid #d500f9' : '2px solid transparent',
                color: active ? '#d500f9' : '#546e7a',
                fontFamily: 'monospace', fontSize: 12, cursor: 'pointer', letterSpacing: 1,
                marginBottom: -1, transition: 'color 0.15s',
              }}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'feed'    && <FeedTab />}
        {activeTab === 'signals' && <SignalsTab />}
      </div>
    </section>
  );
}

export default Intelligence;
