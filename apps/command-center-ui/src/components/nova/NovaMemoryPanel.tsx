import { useState, useEffect } from 'react';
import { globalMemoryStore } from '../../brain/nova-memory/memoryStore';
import { Pin, Trash2, CheckCircle, AlertCircle, Play } from 'lucide-react';

export function NovaMemoryPanel() {
  const [state, setState] = useState(globalMemoryStore.getState());
  const [activeProjectTab, setActiveProjectTab] = useState<'cc' | 'omega' | 'recruit'>('cc');

  useEffect(() => {
    const unsubscribe = globalMemoryStore.subscribe(() => {
      setState({ ...globalMemoryStore.getState() });
    });
    return unsubscribe;
  }, []);

  const handleResolveIssue = (projectId: string, issue: string) => {
    globalMemoryStore.resolveIssue(projectId, issue);
  };

  const handlePinObjective = (obj: string) => {
    if (state.pinnedItems.includes(obj)) {
      globalMemoryStore.unpinItem(obj);
    } else {
      globalMemoryStore.pinItem(obj);
    }
  };

  const handleClearSession = () => {
    globalMemoryStore.clearSession();
  };

  const handleResetAll = () => {
    if (confirm('Are you sure you want to reset the memory kernel to default baseline context?')) {
      globalMemoryStore.resetAll();
    }
  };

  const currentProject = state.projects[activeProjectTab];

  return (
    <div className="nova-memory-panel" style={{ padding: '15px', color: '#fff', display: 'flex', flexDirection: 'column', height: '100%', gap: '15px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Play size={12} className="text-cyan animate-pulse" />
          <h3 style={{ margin: 0, color: 'var(--cyan, #00d2ff)', fontSize: '14px', letterSpacing: '1px', fontWeight: 600 }}>NOVA RUNTIME MEMORY KERNEL</h3>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={handleClearSession}
            style={{ background: 'rgba(255, 23, 68, 0.05)', color: '#ff1744', border: '1px solid rgba(255, 23, 68, 0.2)', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Trash2 size={10} /> Clear Session
          </button>
          <button 
            onClick={handleResetAll}
            style={{ background: 'rgba(255, 255, 255, 0.02)', color: '#aaa', border: '1px solid #333', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}
          >
            Reset Memory
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '15px', flex: 1, minHeight: '300px' }}>
        
        {/* Left Column: Focus & Mission */}
        <div className="memory-col glass" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid #222', borderRadius: '6px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '11px', color: 'var(--purple, #d500f9)', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 700 }}>OWNER CONTEXT</h4>
          
          <div style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '9px', color: '#666', display: 'block', letterSpacing: '0.5px' }}>CURRENT PHASE</span>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{state.owner.currentPhase}</span>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '9px', color: '#666', display: 'block', letterSpacing: '0.5px' }}>OPERATIONAL FOCUS</span>
            <span style={{ fontSize: '12px', color: '#eee', lineHeight: '1.4' }}>{state.owner.currentOperationalFocus}</span>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '9px', color: '#666', display: 'block', letterSpacing: '0.5px' }}>LAST GOAL</span>
            <span style={{ fontSize: '11px', color: '#ccc', fontStyle: 'italic', wordBreak: 'break-word' }}>{state.owner.lastRequestedGoal}</span>
          </div>

          <div style={{ borderTop: '1px solid #222', paddingTop: '10px' }}>
            <span style={{ fontSize: '9px', color: '#666', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>PINNED GOALS</span>
            {state.pinnedItems.length === 0 ? (
              <span style={{ fontSize: '10px', color: '#444', fontStyle: 'italic' }}>No pinned goals. Click the Pin icon in active project tab.</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {state.pinnedItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', background: 'rgba(0, 210, 255, 0.04)', padding: '5px 8px', border: '1px solid rgba(0, 210, 255, 0.15)', borderRadius: '4px' }}>
                    <Pin size={9} style={{ color: 'var(--cyan, #00d2ff)', transform: 'rotate(45deg)' }} />
                    <span style={{ color: '#eee', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center Column: Project Context */}
        <div className="memory-col glass" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid #222', borderRadius: '6px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '11px', color: '#00ffcc', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 700 }}>ACTIVE PROJECT FOCUS</h4>
          
          <div style={{ display: 'flex', gap: '3px', marginBottom: '10px' }}>
            {(['cc', 'omega', 'recruit'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveProjectTab(tab)}
                style={{
                  flex: 1,
                  padding: '5px 2px',
                  background: activeProjectTab === tab ? 'rgba(0, 255, 204, 0.08)' : 'rgba(255,255,255,0.01)',
                  border: `1px solid ${activeProjectTab === tab ? 'rgba(0, 255, 204, 0.25)' : '#222'}`,
                  color: activeProjectTab === tab ? '#00ffcc' : '#666',
                  fontSize: '10px',
                  cursor: 'pointer',
                  borderRadius: '3px',
                  fontWeight: activeProjectTab === tab ? 600 : 400
                }}
              >
                {tab === 'cc' ? 'Command' : tab === 'omega' ? 'Omega' : 'Recruit'}
              </button>
            ))}
          </div>

          {currentProject && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11.5px' }}>
              <div>
                <span style={{ fontSize: '9px', color: '#666', display: 'block' }}>CURRENT OBJECTIVE</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px', marginTop: '2px' }}>
                  <span style={{ color: '#eee', fontWeight: 600, lineHeight: '1.3' }}>{currentProject.currentObjective}</span>
                  <button 
                    onClick={() => handlePinObjective(currentProject.currentObjective)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px', color: state.pinnedItems.includes(currentProject.currentObjective) ? 'var(--cyan, #00d2ff)' : '#444' }}
                    title="Pin Objective"
                  >
                    <Pin size={11} style={{ transform: state.pinnedItems.includes(currentProject.currentObjective) ? 'rotate(45deg)' : 'none' }} />
                  </button>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '9px', color: '#666', display: 'block' }}>STATUS</span>
                <span style={{ color: '#a0e6ff', fontSize: '11px' }}>{currentProject.currentStatus}</span>
              </div>

              <div>
                <span style={{ fontSize: '9px', color: '#666', display: 'block' }}>LAST AUDIT</span>
                <span style={{ color: '#888', fontStyle: 'italic', fontSize: '10.5px' }}>{currentProject.lastAudit}</span>
              </div>

              <div style={{ flex: 1, borderTop: '1px solid #222', paddingTop: '8px', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '9px', color: '#666', display: 'block', marginBottom: '4px' }}>KNOWN ISSUES / RISKS</span>
                {currentProject.activeIssues.length === 0 ? (
                  <span style={{ color: '#00ffcc', fontSize: '10.5px', fontStyle: 'italic' }}>✓ No active issues. Context clean.</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', maxHeight: '100px' }}>
                    {currentProject.activeIssues.map((issue, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,23,68,0.03)', border: '1px solid rgba(255,23,68,0.15)', padding: '4px 6px', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
                          <AlertCircle size={9} style={{ color: '#ff1744', flexShrink: 0 }} />
                          <span style={{ color: '#eee', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue}</span>
                        </div>
                        <button 
                          onClick={() => handleResolveIssue(activeProjectTab, issue)}
                          style={{ background: 'none', border: 'none', color: '#00ffcc', cursor: 'pointer', fontSize: '9px', padding: '1px', display: 'flex', alignItems: 'center' }}
                          title="Mark Resolved"
                        >
                          <CheckCircle size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Commands & Audits */}
        <div className="memory-col glass" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid #222', borderRadius: '6px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '11px', color: 'var(--amber, #ffab00)', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 700 }}>LOG & AUDITS</h4>

          <div style={{ marginBottom: '10px' }}>
            <span style={{ fontSize: '9px', color: '#666', display: 'block', marginBottom: '4px' }}>RECENT AUDITS</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {state.operational.recentAudits.map((a, idx) => (
                <div key={idx} style={{ color: '#bbb', background: 'rgba(255,255,255,0.01)', padding: '3px 6px', border: '1px solid #222', fontSize: '10px', borderRadius: '3px' }}>
                  {a}
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <span style={{ fontSize: '9px', color: '#666', display: 'block', marginBottom: '4px' }}>RECENT GENERATED COMMANDS</span>
            {state.session.generatedCommands.length === 0 ? (
              <span style={{ fontSize: '10px', color: '#444', fontStyle: 'italic' }}>No commands generated in this session.</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', flex: 1 }}>
                {state.session.generatedCommands.map((cmd, idx) => {
                  const title = cmd.split('\n')[0] || 'HAMADA COMMAND';
                  return (
                    <div key={idx} style={{ background: '#050505', border: '1px solid #222', padding: '5px', borderRadius: '3px' }}>
                      <span style={{ color: 'var(--cyan, #00d2ff)', fontSize: '10px', fontWeight: 'bold', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
                      <pre style={{ margin: '2px 0 0 0', fontSize: '8.5px', color: '#888', overflowX: 'hidden', whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: '1.2' }}>
                        {cmd.split('\n').slice(1, 4).join('\n')}...
                      </pre>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
