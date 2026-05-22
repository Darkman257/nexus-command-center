import { useState } from 'react';
import { getLocalResponse } from './nexusLocalResponder';
import { generateHamadaCommand } from './nexusCommandTemplates';

export function AskNexusAssistantPanel() {
  const [project, setProject] = useState('Nexus Command Center');
  const [input, setInput] = useState('');
  const [chatLog, setChatLog] = useState<{ role: 'user' | 'assistant', data: { type: 'text' | 'command', content: string }[] }[]>([]);

  const handleSend = (text: string = input) => {
    if (!text.trim()) return;
    const response = getLocalResponse(text, project);
    setChatLog(prev => [
      ...prev,
      { role: 'user', data: [{ type: 'text', content: text }] },
      { role: 'assistant', data: response }
    ]);
    setInput('');
  };

  const handleQuickAction = (actionLabel: string, actionGoal: string) => {
    const cmd = generateHamadaCommand(project, actionGoal, `Triggered via quick action: ${actionLabel}`);
    setChatLog(prev => [
      ...prev,
      { role: 'user', data: [{ type: 'text', content: `Quick Action: ${actionLabel}` }] },
      { role: 'assistant', data: [
        { type: 'text', content: `Drafted command for ${actionLabel}:` },
        { type: 'command', content: cmd }
      ]}
    ]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '15px' }}>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '11px' }}>
        <span style={{ padding: '4px 8px', background: '#330066', borderRadius: '4px', border: '1px solid #d500f9' }}>Local Advisor Only</span>
        <span style={{ padding: '4px 8px', background: '#ff1744', borderRadius: '4px' }}>No Real AI API</span>
        <span style={{ padding: '4px 8px', background: '#ff1744', borderRadius: '4px' }}>No Real Execution</span>
        <span style={{ padding: '4px 8px', background: '#ff1744', borderRadius: '4px' }}>No Push</span>
        <span style={{ padding: '4px 8px', background: '#ff1744', borderRadius: '4px' }}>No Production Writes</span>
        <span style={{ padding: '4px 8px', background: '#ff1744', borderRadius: '4px' }}>Hamada Bridge Not Connected</span>
      </div>

      <div style={{ background: '#1a1a1a', padding: '15px', border: '1px solid #00d2ff', borderRadius: '4px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#00d2ff' }}>Current Phase Card</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.6' }}>
          <li><strong>Command Center:</strong> NEXUS Brain V0 installed</li>
          <li><strong>Ask NEXUS Assistant:</strong> V0 local advisor</li>
          <li><strong>Antigravity Bridge:</strong> mock composer only</li>
          <li><strong>Omega Phase 1E:</strong> pending UI review / DB migration decision</li>
          <li><strong>Recruitment:</strong> candidate import committed locally</li>
        </ul>
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <label>Target Project:</label>
        <select value={project} onChange={(e) => setProject(e.target.value)} style={{ padding: '8px', background: '#222', color: '#fff', border: '1px solid #444', flex: 1 }}>
          <option>Nexus Command Center</option>
          <option>Omega Ops Dashboard</option>
          <option>Recruitment Hub</option>
          <option>All Projects / Master Control</option>
        </select>
      </div>

      <div style={{ flex: 1, background: '#111', border: '1px solid #333', padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {chatLog.length === 0 && <div style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>Select an action or ask a question. Local mode active.</div>}
        {chatLog.map((log, i) => (
          <div key={i} style={{ alignSelf: log.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
            <div style={{ fontSize: '11px', color: log.role === 'user' ? '#00d2ff' : '#d500f9', marginBottom: '4px' }}>
              {log.role === 'user' ? 'YOU' : 'NEXUS ASSISTANT (LOCAL)'}
            </div>
            <div style={{ background: log.role === 'user' ? '#003344' : '#220033', padding: '10px', borderRadius: '6px', border: `1px solid ${log.role === 'user' ? '#00d2ff' : '#d500f9'}` }}>
              {log.data.map((item, idx) => (
                <div key={idx} style={{ marginTop: idx > 0 ? '10px' : '0' }}>
                  {item.type === 'text' && <div style={{ whiteSpace: 'pre-wrap' }}>{item.content}</div>}
                  {item.type === 'command' && (
                    <div style={{ background: '#000', padding: '10px', border: '1px solid #444', position: 'relative' }}>
                      <pre style={{ margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>{item.content}</pre>
                      <button onClick={() => copyToClipboard(item.content)} style={{ position: 'absolute', top: '5px', right: '5px', background: '#444', color: '#fff', border: 'none', padding: '4px 8px', fontSize: '10px', cursor: 'pointer' }}>Copy Command</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => handleQuickAction('Next Step', 'Analyze Next Step')} style={{ padding: '6px 10px', background: '#333', color: '#fff', border: '1px solid #555', cursor: 'pointer', fontSize: '12px' }}>Next Step</button>
        <button onClick={() => handleQuickAction('Generate Hamada Command', 'General Action')} style={{ padding: '6px 10px', background: '#333', color: '#fff', border: '1px solid #555', cursor: 'pointer', fontSize: '12px' }}>Generate Hamada Command</button>
        <button onClick={() => handleQuickAction('Audit Current Project', 'Full Audit')} style={{ padding: '6px 10px', background: '#333', color: '#fff', border: '1px solid #555', cursor: 'pointer', fontSize: '12px' }}>Audit Current Project</button>
        <button onClick={() => handleQuickAction('Check Risks', 'Risk Scan')} style={{ padding: '6px 10px', background: '#333', color: '#fff', border: '1px solid #555', cursor: 'pointer', fontSize: '12px' }}>Check Risks</button>
        <button onClick={() => handleQuickAction('Prepare Commit Safety Check', 'Safety Check')} style={{ padding: '6px 10px', background: '#333', color: '#fff', border: '1px solid #555', cursor: 'pointer', fontSize: '12px' }}>Prepare Commit Safety Check</button>
        <button onClick={() => handleQuickAction('Migration Guard', 'Verify Migration Readiness')} style={{ padding: '6px 10px', background: '#333', color: '#fff', border: '1px solid #555', cursor: 'pointer', fontSize: '12px' }}>Migration Guard</button>
        <button onClick={() => handleQuickAction('UI Review', 'UI/UX Audit')} style={{ padding: '6px 10px', background: '#333', color: '#fff', border: '1px solid #555', cursor: 'pointer', fontSize: '12px' }}>UI Review</button>
        <button onClick={() => handleQuickAction('Close Session Report', 'Session Summary Report')} style={{ padding: '6px 10px', background: '#333', color: '#fff', border: '1px solid #555', cursor: 'pointer', fontSize: '12px' }}>Close Session Report</button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask NEXUS Assistant... (e.g. إيه الخطوة الجاية؟)" 
          style={{ flex: 1, padding: '12px', background: '#222', border: '1px solid #444', color: '#fff' }} 
        />
        <button onClick={() => handleSend()} style={{ padding: '10px 20px', background: 'var(--cyan, #00d2ff)', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Send</button>
      </div>
    </div>
  );
}
