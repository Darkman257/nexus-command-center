import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Activity, Terminal, Eye, HelpCircle, FileText, Layers, Sparkles } from 'lucide-react';
import { getLocalResponse } from '../../brain/nexusLocalResponder';
import { generateHamadaCommand } from '../../brain/nexusCommandTemplates';

export interface ChatEntry {
  role: 'user' | 'nova' | 'assistant';
  content: string;
  command?: string;
  timestamp: string;
  responseType?: string;
  projectScope?: string;
}

interface Props {
  novaOnline: boolean;
  novaProvider: string;
  omegaStatus: { status: string; responseMs?: number };
  bridgeOnline: boolean;
  onOpenWorkspace: () => void;
  chatLog: ChatEntry[];
  setChatLog: React.Dispatch<React.SetStateAction<ChatEntry[]>>;
}

const QUICK_ACTIONS = [
  { label: 'System Status', goal: 'status', Icon: Activity },
  { label: 'Open Workspace', goal: 'workspace', Icon: Layers },
  { label: 'Prepare Command', goal: 'cmd', Icon: Terminal },
  { label: 'Review Report', goal: 'review', Icon: FileText },
  { label: 'Audit Project', goal: 'audit', Icon: Eye },
  { label: 'Explain Status', goal: 'explain', Icon: HelpCircle },
];

export function NovaAssistantPanel({
  novaOnline,
  novaProvider,
  omegaStatus,
  bridgeOnline,
  onOpenWorkspace,
  chatLog: _chatLog,
  setChatLog,
}: Props) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addEntry = (entry: ChatEntry) => setChatLog(prev => [...prev, entry]);

  const ts = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    addEntry({ role: 'user', content: text, timestamp: ts() });
    setInput('');
    setLoading(true);

    try {
      const doFetch = window['fetch'];
      const res = await doFetch('/api/nova/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, projectScope: 'Nexus Command Center', mode: 'advisor' }),
      });
      const data = await res.json();
      addEntry({ role: 'nova', content: data.reply || 'No response.', timestamp: ts(), responseType: 'Insight' });
    } catch {
      const local = getLocalResponse(text, 'Nexus Command Center');
      const textContent = local.find(d => d.type === 'text')?.content ?? 'Local response.';
      const cmdContent = local.find(d => d.type === 'command')?.content;
      addEntry({ role: 'assistant', content: textContent, command: cmdContent, timestamp: ts(), responseType: 'Insight' });
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = (label: string, goal: string) => {
    if (goal === 'workspace') { onOpenWorkspace(); return; }
    const cmd = generateHamadaCommand('Nexus Command Center', goal, `Quick action: ${label}`);
    const resType = label.includes('Status') ? 'Status' : 'Hamada Command';
    addEntry({ role: 'user', content: `Requesting: ${label}`, timestamp: ts() });
    addEntry({ role: 'assistant', content: `Drafted for ${label}:`, command: cmd, timestamp: ts(), responseType: resType });
  };

  return (
    <aside className="nova-assistant-panel">
      {/* Header */}
      <div className="nap-header">
        <Sparkles size={13} style={{ color: novaOnline ? '#00d2ff' : '#ff1744' }} />
        <span className="nap-title">NOVA COMMAND BRIDGE</span>
        <span className={`nap-badge ${novaOnline ? 'badge-online' : 'badge-offline'}`}>
          {novaOnline ? novaProvider.toUpperCase() : 'OFFLINE'}
        </span>
      </div>

      {/* Avatar + Intro */}
      <div className="nap-body">
        <div className="nap-intro">
          <motion.div
            className="nap-avatar"
            animate={{
              boxShadow: novaOnline
                ? ['0 0 8px rgba(0,210,255,0.2)', '0 0 16px rgba(123,97,255,0.4)', '0 0 8px rgba(0,210,255,0.2)']
                : ['0 0 4px rgba(255,23,68,0.2)', '0 0 4px rgba(255,23,68,0.2)']
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="nap-greeting-block">
            <span className="nap-role-tag">SYSTEM ADVISOR</span>
            <p className="nap-greeting">
              {novaOnline
                ? 'Tactical bridge active. Awaiting your query, Commander.'
                : 'NOVA primary local node is offline. Connect Ollama client.'}
            </p>
          </div>
        </div>

        {/* Latest Insight */}
        <div className="nap-insight">
          <span className="nap-insight-lbl">BRIDGE STATE SUMMARY</span>
          <p className="nap-insight-txt">
            Omega link:{' '}
            <span style={{ color: omegaStatus.status === 'online' ? '#00e676' : '#ff1744' }}>
              {omegaStatus.status === 'online' ? 'NOMINAL' : 'UNREACHABLE'}
            </span>
            {omegaStatus.responseMs ? ` (${omegaStatus.responseMs}ms)` : ''}
            <br />
            Nexus Bridge:{' '}
            <span style={{ color: bridgeOnline ? '#00e676' : '#ff1744' }}>
              {bridgeOnline ? 'ACTIVE' : 'OFFLINE'}
            </span>
            <br />
            Model Provider:{' '}
            <span style={{ color: '#00d2ff' }}>
              {novaProvider === 'ollama' ? 'OLLAMA LOCAL' : novaProvider.toUpperCase() || 'OFFLINE'}
            </span>
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="nap-section-lbl">BRIDGE DIRECT ACTIONS</div>
        <div className="nap-quick-actions">
          {QUICK_ACTIONS.map(qa => (
            <motion.button
              key={qa.label}
              className="nap-qa-btn"
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(0,210,255,0.08)', borderColor: 'rgba(0,210,255,0.3)' }}
              onClick={() => handleQuick(qa.label, qa.goal)}
            >
              <qa.Icon size={12} style={{ color: '#00d2ff', flexShrink: 0 }} />
              <span>{qa.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="nap-input-area">
        <div className="nap-input-wrapper">
          <input
            ref={inputRef}
            className="nap-input"
            placeholder={loading ? 'NOVA thinking...' : 'Ask NOVA anything...'}
            value={input}
            disabled={loading}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(input); }}
          />
          <motion.button
            className="nap-send-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSend(input)}
            disabled={loading}
          >
            <Send size={12} />
          </motion.button>
        </div>
        <div className="nap-input-commands-hint">
          <span className="hint-dot" />
          <span>Press / for commands</span>
        </div>
      </div>
    </aside>
  );
}
