import { useState } from 'react';

const PROJECTS = ['Nexus Command Center', 'Omega Ops Dashboard', 'Recruitment Hub', 'Master Control'];
const TASK_TYPES = ['Audit', 'UI Review', 'Build Check', 'Code Change', 'Patch Review', 'Migration Planning', 'Session Closure'];

export function AntigravityBridgePanel() {
  const [project, setProject] = useState(PROJECTS[0]);
  const [taskType, setTaskType] = useState(TASK_TYPES[0]);
  const [goal, setGoal] = useState('');
  const [scope, setScope] = useState('');
  const [strictRules, setStrictRules] = useState('');
  const [steps, setSteps] = useState('');
  const [cmdPreview, setCmdPreview] = useState('');
  
  const [inboxOutput, setInboxOutput] = useState('');

  const generateTaskCommand = () => {
    // V1 limitation: Generate command string for owner to run, because UI cannot execute directly.
    // Replace quotes to prevent shell escape issues
    const safeGoal = goal.replace(/"/g, '\\"');
    const safeScope = scope.replace(/"/g, '\\"');
    const safeRules = strictRules.replace(/"/g, '\\"');
    const safeSteps = steps.replace(/"/g, '\\"');
    
    const cmd = `node scripts/hamada-bridge/create-hamada-task.mjs "${project}" "${taskType}" "${safeGoal}" "${safeScope}" "${safeRules}" "${safeSteps}"`;
    setCmdPreview(cmd);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleScanInbox = () => {
    setInboxOutput(`node scripts/hamada-bridge/scan-hamada-inbox.mjs`);
  };

  return (
    <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2>Hamada Local Bridge V1 (Antigravity Bridge)</h2>
      
      <div style={{ display: 'flex', gap: '10px' }}>
        <span style={{ padding: '4px 8px', background: '#330066', borderRadius: '4px', border: '1px solid #d500f9', fontSize: '11px' }}>Local Bridge Only</span>
        <span style={{ padding: '4px 8px', background: '#ff1744', borderRadius: '4px', fontSize: '11px' }}>No Real AI APIs</span>
        <span style={{ padding: '4px 8px', background: '#ff1744', borderRadius: '4px', fontSize: '11px' }}>No Shell Execution</span>
        <span style={{ padding: '4px 8px', background: '#ff1744', borderRadius: '4px', fontSize: '11px' }}>Owner Approval Required</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Outbox / Create Task Section */}
        <div style={{ background: '#111', padding: '15px', border: '1px solid #333' }}>
          <h3 style={{ color: '#00d2ff', marginTop: 0 }}>Create Hamada Task (OUTBOX)</h3>
          
          <label style={{ display: 'block', margin: '10px 0 5px', fontSize: '12px', color: '#aaa' }}>Project:</label>
          <select value={project} onChange={e => setProject(e.target.value)} style={{ width: '100%', padding: '8px', background: '#222', color: '#fff', border: '1px solid #444' }}>
            {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          
          <label style={{ display: 'block', margin: '10px 0 5px', fontSize: '12px', color: '#aaa' }}>Task Type:</label>
          <select value={taskType} onChange={e => setTaskType(e.target.value)} style={{ width: '100%', padding: '8px', background: '#222', color: '#fff', border: '1px solid #444' }}>
            {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          
          <input type="text" placeholder="Goal" value={goal} onChange={e => setGoal(e.target.value)} style={{ width: '100%', padding: '8px', margin: '10px 0', background: '#222', color: '#fff', border: '1px solid #444' }} />
          <input type="text" placeholder="Scope (e.g. D:\\NEXUS\\PROJECTS\\...)" value={scope} onChange={e => setScope(e.target.value)} style={{ width: '100%', padding: '8px', margin: '10px 0', background: '#222', color: '#fff', border: '1px solid #444' }} />
          <textarea placeholder="Strict Rules" value={strictRules} onChange={e => setStrictRules(e.target.value)} rows={3} style={{ width: '100%', padding: '8px', margin: '10px 0', background: '#222', color: '#fff', border: '1px solid #444' }} />
          <textarea placeholder="Required Steps" value={steps} onChange={e => setSteps(e.target.value)} rows={3} style={{ width: '100%', padding: '8px', margin: '10px 0', background: '#222', color: '#fff', border: '1px solid #444' }} />
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={generateTaskCommand} style={{ flex: 1, padding: '8px', background: '#00d2ff', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Create Hamada Task File</button>
          </div>
          
          {cmdPreview && (
            <div style={{ marginTop: '15px', background: '#000', border: '1px solid #444', position: 'relative' }}>
              <pre style={{ margin: 0, padding: '15px', color: '#00d2ff', fontSize: '12px', overflowX: 'auto' }}>{cmdPreview}</pre>
              <button onClick={() => copyToClipboard(cmdPreview)} style={{ position: 'absolute', top: '5px', right: '5px', background: '#333', color: '#fff', border: 'none', padding: '4px 8px', fontSize: '10px', cursor: 'pointer' }}>Copy Latest Hamada Task</button>
            </div>
          )}
          
          <div style={{ marginTop: '15px' }}>
            <button onClick={() => alert('D:\\NEXUS\\HAMADA_OUTBOX\\')} style={{ padding: '6px 12px', background: '#222', color: '#ccc', border: '1px solid #444', cursor: 'pointer', fontSize: '12px' }}>Show Outbox Path</button>
          </div>
        </div>

        {/* Inbox Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#111', padding: '15px', border: '1px solid #333' }}>
            <h3 style={{ color: '#ffab00', marginTop: 0 }}>HAMADA INBOX (Returned Reports)</h3>
            <p style={{ fontSize: '12px', color: '#aaa' }}>Reports returned from Antigravity/External Developer arrive here.</p>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>Location: D:\NEXUS\HAMADA_INBOX\</div>
            
            <button onClick={handleScanInbox} style={{ padding: '8px 16px', background: '#ffab00', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Scan Inbox for Reports</button>
            
            {inboxOutput && (
              <div style={{ marginTop: '15px', background: '#000', border: '1px solid #444', padding: '15px' }}>
                <div style={{ fontSize: '11px', color: '#777', marginBottom: '5px' }}>Run command manually:</div>
                <pre style={{ margin: 0, color: '#ffab00', fontSize: '12px', overflowX: 'auto' }}>{inboxOutput}</pre>
              </div>
            )}
          </div>

          <div style={{ background: '#1a1a1a', padding: '15px', border: '1px solid #444' }}>
            <h3 style={{ marginTop: 0, fontSize: '14px' }}>Status Badges Legend</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ padding: '4px 8px', background: '#444', color: '#fff', borderRadius: '4px', fontSize: '11px' }}>Draft</span>
              <span style={{ padding: '4px 8px', background: '#003366', color: '#00d2ff', borderRadius: '4px', fontSize: '11px' }}>Waiting for Hamada</span>
              <span style={{ padding: '4px 8px', background: '#332200', color: '#ffab00', borderRadius: '4px', fontSize: '11px' }}>Report Received</span>
              <span style={{ padding: '4px 8px', background: '#330000', color: '#ff1744', borderRadius: '4px', fontSize: '11px' }}>Needs Owner Review</span>
              <span style={{ padding: '4px 8px', background: '#003300', color: '#00ff00', borderRadius: '4px', fontSize: '11px' }}>Approved</span>
              <span style={{ padding: '4px 8px', background: '#440000', color: '#ff0000', borderRadius: '4px', fontSize: '11px' }}>Rejected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
