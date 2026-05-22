
export function DeveloperGuardrailsPanel() {
  return (
    <div>
      <h2>Developer Guardrails</h2>
      <div style={{ background: '#220000', padding: '20px', border: '1px solid #ff1744' }}>
        <h3 style={{ color: '#ff1744', marginTop: 0 }}>CRITICAL RULES</h3>
        <ul style={{ lineHeight: '1.8' }}>
          <li>Work only in selected project</li>
          <li>Audit first</li>
          <li>No secrets</li>
          <li>No direct production writes</li>
          <li>No DB migration without explicit approval</li>
          <li>No importing quarantined code</li>
          <li>Admindashboard is visual reference only</li>
        </ul>
      </div>
    </div>
  );
}

