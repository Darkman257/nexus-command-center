
export function AntigravityBridgePanel() {
  return (
    <div>
      <h2>Antigravity Bridge / Agent Console</h2>
      <p style={{ color: 'var(--cyan, #00d2ff)' }}>Command Composer Only - No Execution</p>
      
      <div style={{ background: '#111', padding: '20px', border: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Target Project:</label>
          <select style={{ width: '100%', padding: '10px', background: '#222', color: '#fff', border: '1px solid #444' }}>
            <option>Omega Ops Dashboard</option>
            <option>Recruitment Hub</option>
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Safety Mode:</label>
          <select style={{ width: '100%', padding: '10px', background: '#222', color: '#fff', border: '1px solid #444' }}>
            <option>Mock Mode / Planning Only</option>
            <option>Read-Only Audit</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Task Command:</label>
          <textarea rows={4} style={{ width: '100%', padding: '10px', background: '#222', color: '#fff', border: '1px solid #444' }} placeholder="Describe task..." defaultValue="Prepare task pack for candidate update..."></textarea>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ padding: '10px 20px', background: 'var(--purple, #d500f9)', color: '#fff', border: 'none', cursor: 'pointer' }}>Copy Command</button>
          <button style={{ padding: '10px 20px', background: '#333', color: '#fff', border: 'none', cursor: 'pointer' }}>Mark as Draft/Pending</button>
        </div>
      </div>
    </div>
  );
}

