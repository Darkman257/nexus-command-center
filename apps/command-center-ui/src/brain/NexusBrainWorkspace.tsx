import { useState } from 'react';
import { AskNexusMemoryPanel } from './AskNexusMemoryPanel';
import { CapabilityRegistryPanel } from './CapabilityRegistryPanel';
import { BusinessIntakeAdvisorPanel } from './BusinessIntakeAdvisorPanel';
import { AnalyzeFilesPanel } from './AnalyzeFilesPanel';
import { ProjectLearningPanel } from './ProjectLearningPanel';
import { PendingPatchesPanel } from './PendingPatchesPanel';
import { DeveloperGuardrailsPanel } from './DeveloperGuardrailsPanel';
import { ProductLauncherPanel } from './ProductLauncherPanel';
import { AntigravityBridgePanel } from './AntigravityBridgePanel';

export function NexusBrainWorkspace({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('memory');

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
            { id: 'memory', label: 'Ask NEXUS Memory' },
            { id: 'capability', label: 'Capability Registry' },
            { id: 'intake', label: 'Business Intake Advisor' },
            { id: 'analyze', label: 'Analyze Uploaded Files' },
            { id: 'learning', label: 'Project Learning Intake' },
            { id: 'patches', label: 'Pending Patches' },
            { id: 'guardrails', label: 'Developer Guardrails' },
            { id: 'launcher', label: 'Product Launcher' },
            { id: 'bridge', label: 'Antigravity Bridge' }
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
          {activeTab === 'memory' && <AskNexusMemoryPanel />}
          {activeTab === 'capability' && <CapabilityRegistryPanel />}
          {activeTab === 'intake' && <BusinessIntakeAdvisorPanel />}
          {activeTab === 'analyze' && <AnalyzeFilesPanel />}
          {activeTab === 'learning' && <ProjectLearningPanel />}
          {activeTab === 'patches' && <PendingPatchesPanel />}
          {activeTab === 'guardrails' && <DeveloperGuardrailsPanel />}
          {activeTab === 'launcher' && <ProductLauncherPanel />}
          {activeTab === 'bridge' && <AntigravityBridgePanel />}
        </main>
      </div>
    </div>
  );
}

