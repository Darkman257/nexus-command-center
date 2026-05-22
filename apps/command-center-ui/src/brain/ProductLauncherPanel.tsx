
export function ProductLauncherPanel() {
  return (
    <div>
      <h2>Product Launcher (Mock UI)</h2>
      <p style={{ color: '#ffab00' }}>UI only. Server launch from UI is disabled.</p>
      <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {['Omega Ops', 'Recruitment Hub', 'Command Center'].map(prod => (
          <div key={prod} style={{ background: '#111', padding: '20px', border: '1px solid #333', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 15px 0' }}>{prod}</h4>
            <button style={{ padding: '8px 15px', background: '#333', color: '#fff', border: 'none' }} disabled>Launch (Disabled)</button>
          </div>
        ))}
      </div>
    </div>
  );
}

