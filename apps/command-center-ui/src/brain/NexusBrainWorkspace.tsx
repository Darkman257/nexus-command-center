import { useState } from 'react';
import { AskNexusAssistantPanel } from './AskNexusAssistantPanel';
import { AskNexusMemoryPanel } from './AskNexusMemoryPanel';
import { ProjectLearningPanel } from './ProjectLearningPanel';
import { AntigravityBridgePanel } from './AntigravityBridgePanel';
import { OwnerPatchExchangePanel } from './OwnerPatchExchangePanel';

export function NexusBrainWorkspace({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('assistant');

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#0a0a0a', color: '#fff', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '20px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(10px)' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--cyan, #00d2ff)', fontWeight: 300, letterSpacing: '1px' }}>NOVA <span style={{ fontWeight: 800, color: '#fff' }}>Command Workspace</span></h1>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', fontSize: '11px', letterSpacing: '0.5px' }}>
            <span style={{ padding: '4px 10px', border: '1px solid rgba(255, 23, 68, 0.3)', color: '#ff1744', background: 'rgba(255, 23, 68, 0.05)', borderRadius: '20px' }}>Mock Mode</span>
            <span style={{ padding: '4px 10px', border: '1px solid rgba(255, 23, 68, 0.3)', color: '#ff1744', background: 'rgba(255, 23, 68, 0.05)', borderRadius: '20px' }}>No Real Execution</span>
            <span style={{ padding: '4px 10px', border: '1px solid rgba(255, 23, 68, 0.3)', color: '#ff1744', background: 'rgba(255, 23, 68, 0.05)', borderRadius: '20px' }}>No Push</span>
            <span style={{ padding: '4px 10px', border: '1px solid rgba(255, 23, 68, 0.3)', color: '#ff1744', background: 'rgba(255, 23, 68, 0.05)', borderRadius: '20px' }}>No Production Writes</span>
            <span style={{ padding: '4px 10px', border: '1px solid rgba(170, 170, 170, 0.3)', color: '#aaa', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '20px' }}>Bridge Not Connected Yet</span>
          </div>
        </div>
        <button onClick={onClose} style={{ padding: '10px 24px', background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.2)', cursor: 'pointer', borderRadius: '4px', transition: 'background 0.2s' }}>Close Workspace</button>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <aside style={{ width: '260px', borderRight: '1px solid #222', overflowY: 'auto', background: '#0d0d0d' }}>
          {[
            { id: 'assistant', label: 'NOVA Assistant' },
            { id: 'bridge', label: 'Execution Bridge (Hamada)' },
            { id: 'exchange', label: 'Patch Exchange' },
            { id: 'memory', label: 'Intelligence Kernel' },
            { id: 'learning', label: 'Project Status' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ display: 'block', width: '100%', padding: '16px 20px', textAlign: 'left', background: activeTab === tab.id ? 'rgba(0, 210, 255, 0.08)' : 'transparent', border: 'none', color: activeTab === tab.id ? 'var(--cyan, #00d2ff)' : '#888', cursor: 'pointer', borderBottom: '1px solid #1a1a1a', fontWeight: activeTab === tab.id ? 600 : 400, transition: 'all 0.2s' }}
            >
              {tab.label}
            </button>
          ))}
        </aside>

        <main style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          {activeTab === 'assistant' && <AskNexusAssistantPanel />}
          {activeTab === 'bridge' && <AntigravityBridgePanel />}
          {activeTab === 'exchange' && <OwnerPatchExchangePanel />}
          {activeTab === 'memory' && <AskNexusMemoryPanel />}
          {activeTab === 'learning' && <ProjectLearningPanel />}
        </main>
      </div>
    </div>
  );
}



