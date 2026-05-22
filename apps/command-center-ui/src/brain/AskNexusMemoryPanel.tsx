import { mockMemory } from './brainData';

export function AskNexusMemoryPanel() {
  return (
    <div>
      <h2>Ask NEXUS Memory (Mock)</h2>
      <div style={{ marginBottom: '20px' }}>
        <input type="text" placeholder="Search memory... (e.g. human approval)" style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #444', color: '#fff' }} readOnly value="human approval" />
      </div>
      <div>
        {mockMemory.map(m => (
          <div key={m.id} style={{ background: '#111', padding: '15px', marginBottom: '10px', border: '1px solid #333' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--cyan, #00d2ff)' }}>{m.question}</h4>
            <p style={{ margin: 0 }}>{m.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

