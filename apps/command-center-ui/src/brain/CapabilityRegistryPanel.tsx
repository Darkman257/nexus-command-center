import { mockCapabilities } from './brainData';

export function CapabilityRegistryPanel() {
  return (
    <div>
      <h2>Capability Registry (Mock)</h2>
      <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: '1fr 1fr' }}>
        {mockCapabilities.map(c => (
          <div key={c.id} style={{ background: '#111', padding: '15px', border: '1px solid #333' }}>
            <h3 style={{ margin: '0 0 10px 0', color: 'var(--amber, #ffab00)' }}>{c.name}</h3>
            <div>Domain: {c.domain}</div>
            <div>Maturity: {c.maturity}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

