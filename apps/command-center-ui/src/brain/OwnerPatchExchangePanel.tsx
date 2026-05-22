import { useState } from 'react';
import { AGENT_EXCHANGE_PROJECTS } from './agentExchangeProjects';

export function OwnerPatchExchangePanel() {
  const [project, setProject] = useState(AGENT_EXCHANGE_PROJECTS[0].id);
  const [taskTitle, setTaskTitle] = useState('');
  const [allowedFiles, setAllowedFiles] = useState('');
  const [instructions, setInstructions] = useState('');
  const [generatedCmd, setGeneratedCmd] = useState('');

  const [zipPath, setZipPath] = useState('');
  const [inspectCmd, setInspectCmd] = useState('');

  const handleCreatePack = () => {
    const cmd = `node scripts/agent-exchange/create-task-pack.mjs "${project}" "${taskTitle}" "${allowedFiles}" "${instructions}"`;
    setGeneratedCmd(cmd);
  };

  const handleInspect = () => {
    const cmd = `node scripts/agent-exchange/inspect-return-zip.mjs "${zipPath}"`;
    setInspectCmd(cmd);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px' }}>
      <h2>Owner Patch Exchange</h2>
      
      <div style={{ background: '#111', padding: '15px', border: '1px solid #333' }}>
        <h3 style={{ color: 'var(--cyan)' }}>1. Create Task Pack</h3>
        <select value={project} onChange={e => setProject(e.target.value)} style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%', background: '#222', color: '#fff', border: '1px solid #444' }}>
          {AGENT_EXCHANGE_PROJECTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input type="text" placeholder="Task Title" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%', background: '#222', color: '#fff', border: '1px solid #444' }} />
        <input type="text" placeholder="Allowed Files (comma separated)" value={allowedFiles} onChange={e => setAllowedFiles(e.target.value)} style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%', background: '#222', color: '#fff', border: '1px solid #444' }} />
        <textarea placeholder="Instructions" value={instructions} onChange={e => setInstructions(e.target.value)} rows={3} style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%', background: '#222', color: '#fff', border: '1px solid #444' }} />
        <button onClick={handleCreatePack} style={{ padding: '8px 16px', background: 'var(--cyan)', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Generate Creation Command</button>
        {generatedCmd && <pre style={{ background: '#000', padding: '10px', marginTop: '10px', color: '#00d2ff', border: '1px solid #444' }}>{generatedCmd}</pre>}
      </div>

      <div style={{ background: '#111', padding: '15px', border: '1px solid #333' }}>
        <h3 style={{ color: 'var(--amber)' }}>2. Import Returned Patch ZIP</h3>
        <input type="text" placeholder="Path to returned ZIP (e.g. D:\NEXUS\AGENT_INBOX\patch.zip)" value={zipPath} onChange={e => setZipPath(e.target.value)} style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%', background: '#222', color: '#fff', border: '1px solid #444' }} />
        <button onClick={handleInspect} style={{ padding: '8px 16px', background: 'var(--amber)', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Generate Inspect Command</button>
        {inspectCmd && <pre style={{ background: '#000', padding: '10px', marginTop: '10px', color: '#ffab00', border: '1px solid #444' }}>{inspectCmd}</pre>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div style={{ background: '#1a1a1a', padding: '15px', border: '1px solid #444' }}>
          <h3 style={{ color: '#00d2ff' }}>3. Review Patch</h3>
          <p style={{ fontSize: '12px', color: '#aaa' }}>Check `review_report.md` and `risk_report.md` in AGENT_REVIEW folder.</p>
        </div>
        <div style={{ background: '#220000', padding: '15px', border: '1px solid #ff1744' }}>
          <h3 style={{ color: '#ff1744' }}>4. Owner Approval Gate</h3>
          <p style={{ fontSize: '12px', color: '#ffab00' }}>Explicit approval required. No auto-apply.</p>
          <button disabled style={{ padding: '8px', background: '#333', color: '#777', border: 'none' }}>Approve (Not Implemented in V0)</button>
        </div>
        <div style={{ background: '#1a1a1a', padding: '15px', border: '1px solid #444' }}>
          <h3 style={{ color: '#00d2ff' }}>5. Apply Plan Preview</h3>
          <p style={{ fontSize: '12px', color: '#aaa' }}>Read `apply_plan.md`.</p>
        </div>
        <div style={{ background: '#1a1a1a', padding: '15px', border: '1px solid #444' }}>
          <h3 style={{ color: '#00d2ff' }}>6. Rejection / Notes</h3>
          <p style={{ fontSize: '12px', color: '#aaa' }}>Move to AGENT_REJECTED if failed.</p>
        </div>
      </div>
    </div>
  );
}
