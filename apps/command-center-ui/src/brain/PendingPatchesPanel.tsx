
export function PendingPatchesPanel() {
  return (
    <div>
      <h2>Pending Patches (Mock)</h2>
      <p>No memory or capability update becomes official until approved.</p>
      <div style={{ background: '#221100', padding: '15px', border: '1px solid #ffab00' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#ffab00' }}>Pending Capability: Fleet Tracking P1</h4>
        <button style={{ padding: '5px 10px', background: 'var(--green, #00e676)', border: 'none', color: '#000', marginRight: '10px' }}>Approve (Mock)</button>
        <button style={{ padding: '5px 10px', background: '#ff1744', border: 'none', color: '#fff' }}>Reject (Mock)</button>
      </div>
    </div>
  );
}

