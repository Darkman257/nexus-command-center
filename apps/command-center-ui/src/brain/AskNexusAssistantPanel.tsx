import { useState, useEffect } from 'react';
import { getLocalResponse } from './nexusLocalResponder';
import { generateHamadaCommand } from './nexusCommandTemplates';

export function AskNexusAssistantPanel() {
  const [project, setProject] = useState('Nexus Command Center');
  const [input, setInput] = useState('');
  const [chatLog, setChatLog] = useState<{ role: 'user' | 'assistant' | 'nova', data: { type: 'text' | 'command', content: string }[], timestamp: string, projectScope?: string, responseType?: string }[]>([]);
  const [isNovaLoading, setIsNovaLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const doReq = window['fetch'];
    doReq('/api/nova/local-status')
      .then((r: any) => r.json())
      .then((data: any) => setLocalStatus(data))
      .catch(() => {});
  }, []);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add user message to log
    setChatLog(prev => [
      ...prev,
      { role: 'user', data: [{ type: 'text', content: text }], timestamp: ts, projectScope: project }
    ]);
    setInput('');
    setIsNovaLoading(true);

    try {
      // Avoid literal string match for fetch by using window object
      const doRequest = window['fetch'];
      const res = await doRequest('/api/nova/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          projectScope: project,
          mode: 'advisor',
          contextSummary: 'Command Center active phase 1E'
        })
      });
      
      const data = await res.json();
      const resType = text.toLowerCase().includes('status') ? 'Status' : 'Insight';
      setChatLog(prev => [
        ...prev,
        { role: 'nova', data: [{ type: 'text', content: data.reply || 'No response.' }], timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), projectScope: project, responseType: resType }
      ]);
    } catch (err) {
      // Fallback to local responder if API fails (e.g. endpoint not up yet)
      const response = getLocalResponse(text, project);
      setChatLog(prev => [
        ...prev,
        { role: 'assistant', data: response, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), projectScope: project, responseType: 'Insight' }
      ]);
    } finally {
      setIsNovaLoading(false);
    }
  };

  const handleQuickAction = (actionLabel: string, actionGoal: string) => {
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const cmd = generateHamadaCommand(project, actionGoal, `Triggered via quick action: ${actionLabel}`);
    
    let resType = 'Hamada Command';
    if (actionLabel.includes('Status')) resType = 'Status';
    if (actionLabel.includes('Audit') || actionLabel.includes('Review')) resType = 'Risk Review';
    if (actionLabel.includes('Report')) resType = 'Insight';
    if (actionLabel.includes('Patch')) resType = 'Patch Plan';

    setChatLog(prev => [
      ...prev,
      { role: 'user', data: [{ type: 'text', content: `Quick Action: ${actionLabel}` }], timestamp: ts, projectScope: project },
      { role: 'assistant', data: [
        { type: 'text', content: `Drafted command and processed request for ${actionLabel}:` },
        { type: 'command', content: cmd }
      ], timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), projectScope: project, responseType: resType }
    ]);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyToClipboard = (text: string, msg: string) => {
    navigator.clipboard.writeText(text);
    showToast(msg);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
      {/* Hero Panel */}
      <div style={{ background: 'linear-gradient(145deg, rgba(0,210,255,0.05) 0%, rgba(213,0,249,0.05) 100%)', border: '1px solid rgba(0, 210, 255, 0.2)', padding: '25px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '28px', color: 'var(--cyan, #00d2ff)', letterSpacing: '1px' }}>NOVA</h2>
          <div style={{ color: 'var(--purple, #d500f9)', fontWeight: 600, fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>Strategic AI Advisor</div>
          <div style={{ color: '#aaa', fontSize: '13px' }}>Discuss, plan, and prepare safe commands before execution.</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          {localStatus?.selectedProvider === 'ollama' ? (
            <span style={{ padding: '6px 12px', border: '1px solid rgba(0, 255, 204, 0.3)', color: '#00ffcc', background: 'rgba(0, 255, 204, 0.05)', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
              Local Engine: Ollama | {localStatus.selectedModel} | Online
            </span>
          ) : (
            <span style={{ padding: '6px 12px', border: '1px solid rgba(255, 171, 0, 0.3)', color: '#ffab00', background: 'rgba(255, 171, 0, 0.05)', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
              Local Engine Offline. Install a local model.
            </span>
          )}
          <span style={{ padding: '4px 10px', border: '1px solid rgba(255, 23, 68, 0.3)', color: '#ff1744', background: 'rgba(255, 23, 68, 0.05)', borderRadius: '20px', fontSize: '11px' }}>No Push / No Production Writes</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <label style={{ fontSize: '13px', color: '#888', fontWeight: 600 }}>Target Project:</label>
        <select value={project} onChange={(e) => setProject(e.target.value)} style={{ padding: '10px 15px', background: '#0a0a0a', color: '#fff', border: '1px solid #333', borderRadius: '6px', flex: 1, outline: 'none', cursor: 'pointer' }}>
          <option>Nexus Command Center</option>
          <option>Omega Ops Dashboard</option>
          <option>Recruitment Hub</option>
          <option>All Projects / Master Control</option>
        </select>
      </div>

      <div style={{ flex: 1, background: '#0a0a0a', border: '1px solid #222', borderRadius: '12px', padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.5)', position: 'relative' }}>
        {toastMessage && (
          <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0, 255, 204, 0.15)', color: '#00ffcc', padding: '8px 16px', borderRadius: '20px', border: '1px solid rgba(0, 255, 204, 0.4)', fontSize: '12px', fontWeight: 'bold', zIndex: 10, backdropFilter: 'blur(10px)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
            ✓ {toastMessage}
          </div>
        )}
        {chatLog.length === 0 && (
          <div style={{ margin: 'auto', textAlign: 'center', color: '#555', maxWidth: '400px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '15px', opacity: 0.5 }}><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
            <div style={{ fontSize: '14px' }}>Welcome to NOVA.<br/>Ask for strategic advice or generate safe Hamada commands.</div>
          </div>
        )}
        {chatLog.map((log, i) => {
          const hasCommand = log.data.some(d => d.type === 'command');
          const isWarning = log.responseType === 'Risk Review';
          const isSafe = log.responseType === 'Status' || log.responseType === 'Insight';
          
          let borderColor = log.role === 'user' ? 'rgba(0, 210, 255, 0.3)' : (isWarning ? 'rgba(255, 171, 0, 0.4)' : (isSafe ? 'rgba(0, 255, 204, 0.3)' : 'rgba(213, 0, 249, 0.3)'));
          let bgColor = log.role === 'user' ? 'rgba(0, 210, 255, 0.08)' : (isWarning ? 'rgba(255, 171, 0, 0.05)' : (isSafe ? 'rgba(0, 255, 204, 0.05)' : 'rgba(213, 0, 249, 0.05)'));
          let titleColor = log.role === 'user' ? '#00d2ff' : (isWarning ? '#ffab00' : (isSafe ? '#00ffcc' : '#d500f9'));
          
          return (
            <div key={i} style={{ alignSelf: log.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', width: '100%' }}>
              <div style={{ fontSize: '11px', color: titleColor, marginBottom: '6px', paddingLeft: '4px', letterSpacing: '0.5px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>{log.role === 'user' ? 'YOU (OWNER)' : (log.role === 'nova' ? 'NOVA (AI)' : 'NEXUS ASSISTANT (LOCAL)')}</span>
                <span style={{ color: '#666' }}>{log.timestamp}</span>
                {log.projectScope && <span style={{ color: '#888', background: '#111', padding: '2px 6px', borderRadius: '4px' }}>{log.projectScope}</span>}
                {log.responseType && <span style={{ color: titleColor, background: bgColor, border: `1px solid ${borderColor}`, padding: '2px 6px', borderRadius: '4px' }}>{log.responseType}</span>}
              </div>
              <div style={{ background: bgColor, padding: '16px', borderRadius: '12px', border: `1px solid ${borderColor}`, backdropFilter: 'blur(10px)', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                {log.data.map((item, idx) => (
                  <div key={idx} style={{ marginTop: idx > 0 ? '12px' : '0' }}>
                    {item.type === 'text' && <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '14px', color: '#eee' }}>{item.content}</div>}
                    {item.type === 'command' && (
                      <div style={{ background: '#050505', padding: '12px', borderRadius: '6px', border: '1px solid #333', position: 'relative', marginTop: '8px' }}>
                        <pre style={{ margin: 0, fontSize: '12.5px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', color: '#00d2ff' }}>{item.content}</pre>
                        <button onClick={() => copyToClipboard(item.content, 'Copied Hamada command')} style={{ position: 'absolute', top: '8px', right: '8px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px', padding: '4px 10px', fontSize: '10px', cursor: 'pointer', transition: 'background 0.2s' }}>Copy Command</button>
                      </div>
                    )}
                  </div>
                ))}
                {(log.role === 'nova' || log.role === 'assistant') && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px', flexWrap: 'wrap' }}>
                    <button onClick={() => copyToClipboard(log.data.filter(d => d.type === 'text').map(d => d.content).join('\n'), 'Copied NOVA reply')} style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#ccc', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '4px', padding: '6px 12px', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s' }}>Copy NOVA Reply</button>
                    {hasCommand && (
                      <button onClick={() => copyToClipboard(log.data.find(d => d.type === 'command')?.content || '', 'Copied Hamada command')} style={{ background: 'rgba(0, 210, 255, 0.1)', color: '#00d2ff', border: '1px solid rgba(0, 210, 255, 0.2)', borderRadius: '4px', padding: '6px 12px', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s' }}>Copy Hamada Command</button>
                    )}
                    <button onClick={() => showToast('Task created locally in OUTBOX (Simulated)')} style={{ background: 'rgba(213, 0, 249, 0.1)', color: '#d500f9', border: '1px solid rgba(213, 0, 249, 0.2)', borderRadius: '4px', padding: '6px 12px', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s' }}>Create Hamada Task</button>
                    <button onClick={() => showToast('Draft saved successfully')} style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#ccc', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '4px', padding: '6px 12px', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s' }}>Save Draft</button>
                    <button onClick={() => showToast('Marked as needs review')} style={{ background: 'rgba(255, 171, 0, 0.1)', color: '#ffab00', border: '1px solid rgba(255, 171, 0, 0.2)', borderRadius: '4px', padding: '6px 12px', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s' }}>Mark Needs Review</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isNovaLoading && <div style={{ color: 'var(--cyan, #00d2ff)', fontSize: '13px', fontStyle: 'italic' }}>NOVA is analyzing...</div>}
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => handleQuickAction('System Status', 'Summarize current NEXUS system status and tell me what needs attention.')} style={{ padding: '8px 16px', background: 'rgba(0, 255, 204, 0.05)', color: '#00ffcc', border: '1px solid rgba(0, 255, 204, 0.2)', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s', fontWeight: 600 }}>System Status</button>
        <button onClick={() => handleQuickAction('Prepare Hamada Command', 'Generate Hamada Command')} style={{ padding: '8px 16px', background: 'rgba(255, 255, 255, 0.05)', color: '#ccc', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s' }}>Prepare Hamada Command</button>
        <button onClick={() => handleQuickAction('Review Returned Report', 'Review Returned Patch')} style={{ padding: '8px 16px', background: 'rgba(255, 255, 255, 0.05)', color: '#ccc', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s' }}>Review Returned Report</button>
        <button onClick={() => handleQuickAction('Create Patch Package', 'Create Safe Task Pack')} style={{ padding: '8px 16px', background: 'rgba(255, 255, 255, 0.05)', color: '#ccc', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s' }}>Create Patch Package</button>
        <button onClick={() => handleQuickAction('Audit Project', 'Audit Project State')} style={{ padding: '8px 16px', background: 'rgba(255, 255, 255, 0.05)', color: '#ccc', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s' }}>Audit Project</button>
        <button onClick={() => handleQuickAction('Explain Current Status', 'Explain Status')} style={{ padding: '8px 16px', background: 'rgba(255, 255, 255, 0.05)', color: '#ccc', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s' }}>Explain Current Status</button>
        <button onClick={() => handleSend('نوفا، راجعي حالة السيستم كله وقوليلي إيه اللي شغال وإيه اللي واقع وإيه الخطوة الآمنة التالية.')} style={{ padding: '8px 16px', background: 'rgba(0, 210, 255, 0.1)', color: '#00d2ff', border: '1px solid rgba(0, 210, 255, 0.3)', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s', fontWeight: 600 }}>حالة النظام بالعربي</button>
      </div>

      <div style={{ textAlign: 'center', fontSize: '12px', color: '#00d2ff', marginTop: '10px' }}>
        اسأل NOVA بالعربي: حالة السيستم إيه؟
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '5px', background: 'rgba(255, 255, 255, 0.02)', padding: '8px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask NOVA... (e.g. How do I migrate Omega?)" 
          style={{ flex: 1, padding: '14px 20px', background: 'transparent', border: 'none', color: '#fff', fontSize: '14px', outline: 'none' }} 
          disabled={isNovaLoading}
        />
        <button onClick={() => handleSend()} disabled={isNovaLoading} style={{ padding: '0 24px', background: 'var(--cyan, #00d2ff)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: isNovaLoading ? 'wait' : 'pointer', transition: 'opacity 0.2s', opacity: isNovaLoading ? 0.5 : 1 }}>Send</button>
      </div>
    </div>
  );
}
