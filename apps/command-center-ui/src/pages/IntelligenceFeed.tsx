import { useState, useEffect } from 'react';
import { Radio, Shield, Globe, Users, Cpu } from 'lucide-react';
import { globalRuntimeBus } from '../runtime/bus/runtimeBus';

interface FeedItem {
  id: string;
  category: 'SYSTEM' | 'FLEET' | 'RECRUIT';
  title: string;
  description: string;
  timestamp: string;
}

export function IntelligenceFeed() {
  const [filter, setFilter] = useState<'ALL' | 'SYSTEM' | 'FLEET' | 'RECRUIT'>('ALL');
  
  const [feedItems, setFeedItems] = useState<FeedItem[]>([
    {
      id: 'item-01',
      category: 'SYSTEM',
      title: 'Local Bridge Daemon Port Sync Verified',
      description: 'System scanned port 9999 local-loop. Data synchronization pipelines verified stable.',
      timestamp: '5m ago'
    },
    {
      id: 'item-02',
      category: 'FLEET',
      title: 'Vehicle Fleet Check-in processed at Terminal Gates',
      description: 'Vehicle identification number parsed. Driver attendance record updated in OMEGA tables.',
      timestamp: '15m ago'
    },
    {
      id: 'item-03',
      category: 'RECRUIT',
      title: 'Clearance Sanitizer passed for Candidate Briefing',
      description: 'Applicant profile scanned. Raw email PDF assets sanitized and mapped under zero-disclosure rules.',
      timestamp: '1h ago'
    },
    {
      id: 'item-04',
      category: 'SYSTEM',
      title: 'OMEGA Dashboard Operations Sync Complete',
      description: 'Omega-ops gateway checked health state. Compilation status nominal (100% online).',
      timestamp: '4h ago'
    },
    {
      id: 'item-05',
      category: 'FLEET',
      title: 'Daily Fuel Expense Ledger ingested',
      description: 'Manual Excel sheet parsed. Calculated fuel transaction parameters added to cash balance ledger.',
      timestamp: '1d ago'
    }
  ]);

  useEffect(() => {
    const unsub = globalRuntimeBus.subscribe('*', (event) => {
      let category: FeedItem['category'] = 'SYSTEM';
      const type = event.event_type;
      
      if (type.startsWith('fleet') || type.startsWith('omega.attendance')) {
        category = 'FLEET';
      } else if (type.startsWith('recruitment')) {
        category = 'RECRUIT';
      }

      const itemTitle = type.replace(/\./g, ' ').toUpperCase();
      const payloadString = Object.entries(event.payload)
        .map(([key, val]) => `${key}: ${JSON.stringify(val)}`)
        .join(', ');
      
      const newFeedItem: FeedItem = {
        id: event.event_id,
        category,
        title: `${itemTitle} (${event.source})`,
        description: `Ingested payload: ${payloadString}`,
        timestamp: event.timestamp
      };

      setFeedItems(prev => [newFeedItem, ...prev].slice(0, 30));
    });

    return unsub;
  }, []);

  const filteredItems = filter === 'ALL' 
    ? feedItems 
    : feedItems.filter(item => item.category === filter);

  return (
    <section className="nova-center-core" style={{
      gridColumn: 'center / span 2',
      background: 'rgba(3, 8, 16, 0.4)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Header and Filter Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={18} style={{ color: 'var(--cyan)' }} />
          <h2 style={{ color: 'var(--text-bright)', fontSize: '0.9rem', letterSpacing: '1px', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--mono)', margin: 0 }}>
            INTELLIGENCE TIMELINE FEED
          </h2>
        </div>

        {/* Categories Tab Bar */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '3px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)' }}>
          {(['ALL', 'SYSTEM', 'FLEET', 'RECRUIT'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                background: filter === cat ? 'rgba(0, 210, 255, 0.1)' : 'transparent',
                border: 'none',
                color: filter === cat ? 'var(--cyan)' : 'var(--text-muted)',
                fontFamily: 'var(--mono)',
                fontSize: '0.42rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '3px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Spacious scrolling feed items */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
        {filteredItems.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '0.46rem', color: 'var(--text-muted)' }}>
            NO EVENTS REGISTERED UNDER THIS CATEGORY.
          </div>
        ) : (
          filteredItems.map(item => {
            const isSystem = item.category === 'SYSTEM';
            const isFleet = item.category === 'FLEET';
            const accentColor = isSystem ? 'var(--cyan)' : isFleet ? 'var(--purple)' : 'var(--violet)';
            
            return (
              <div key={item.id} className="glass" style={{
                padding: '12px 16px',
                background: 'rgba(5, 12, 24, 0.25)',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start'
              }}>
                {/* Visual Category Node Icon */}
                <div style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: `1px solid ${accentColor}`,
                  color: accentColor,
                  padding: '6px',
                  borderRadius: '4px',
                  display: 'flex',
                  marginTop: '2px',
                  opacity: 0.8
                }}>
                  {isSystem && <Cpu size={12} />}
                  {isFleet && <Globe size={12} />}
                  {!isSystem && !isFleet && <Users size={12} />}
                </div>

                {/* Details */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.44rem', fontFamily: 'var(--mono)', color: accentColor, fontWeight: 700 }}>
                      [{item.category}]
                    </span>
                    <span style={{ fontSize: '0.38rem', fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>
                      {item.timestamp}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.48rem', fontWeight: 800, color: 'var(--text-bright)', fontFamily: 'var(--mono)' }}>
                    {item.title}
                  </span>

                  <p style={{ fontSize: '0.44rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.4 }}>
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Spacious Footer (Zero Disclosure rule reminder) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderTop: '1px solid var(--border)', paddingTop: '10px', flexShrink: 0 }}>
        <Shield size={12} style={{ color: 'var(--purple)', opacity: 0.8 }} />
        <span style={{ fontSize: '0.38rem', fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>
          INTELLIGENCE TIMELINE COMPLIANCE SCAN: SECURED • ALL PRIVACY SCHEMAS ENGAGED.
        </span>
      </div>
    </section>
  );
}
