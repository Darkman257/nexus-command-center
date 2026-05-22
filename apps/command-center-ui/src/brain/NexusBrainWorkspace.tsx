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
      <header style={{ padding: '20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--cyan, #00d2ff)' }}>NEXUS BRAIN WORKSPACE</h1>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', fontSize: '12px' }}>
            <span style={{ padding: '4px 8px', background: '#ff1744', borderRadius: '4px' }}>Mock Mode</span>
            <span style={{ padding: '4px 8px', background: '#ff1744', borderRadius: '4px' }}>No Real Execution</span>
            <span style={{ padding: '4px 8px', background: '#ff1744', borderRadius: '4px' }}>No Push</span>
            <span style={{ padding: '4px 8px', background: '#ff1744', borderRadius: '4px' }}>No Production Writes</span>
            <span style={{ padding: '4px 8px', background: '#ff1744', borderRadius: '4px' }}>Bridge Not Connected Yet</span>
          </div>
        </div>
        <button onClick={onClose} style={{ padding: '10px 20px', background: '#333', color: '#fff', border: 'none', cursor: 'pointer' }}>Close Workspace</button>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <aside style={{ width: '250px', borderRight: '1px solid #333', overflowY: 'auto' }}>
          {[
            { id: 'assistant', label: 'NOVA Assistant' },
            { id: 'bridge', label: 'Hamada Command Composer' },
            { id: 'exchange', label: 'Owner Patch Exchange' },
            { id: 'memory', label: 'Intelligence Kernel' },
            { id: 'learning', label: 'Project Status' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ display: 'block', width: '100%', padding: '15px', textAlign: 'left', background: activeTab === tab.id ? '#1a1a1a' : 'transparent', border: 'none', color: activeTab === tab.id ? 'var(--cyan, #00d2ff)' : '#aaa', cursor: 'pointer', borderBottom: '1px solid #222' }}
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



