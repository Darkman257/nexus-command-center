import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Activity, Terminal, Eye, HelpCircle, FileText, Layers, Sparkles, Paperclip, X, CheckSquare, Bookmark, Shield } from 'lucide-react';
import { generateHamadaCommand } from '../../brain/nexusCommandTemplates';
import { globalMemoryStore } from '../../brain/nova-memory/memoryStore';
import { buildMemoryContext } from '../../brain/nova-memory/memoryContextBuilder';

export interface ChatEntry {
  role: 'user' | 'nova' | 'assistant' | 'system' | 'warning' | 'command';
  content: string;
  command?: string;
  timestamp: string;
  responseType?: string;
  projectScope?: string;
  provider?: string;
  duration?: number;
  confidence?: number;
  indicators?: {
    router?: boolean;
    memoryUsed?: boolean;
    search?: boolean;
    execution?: boolean;
  };
  actions?: { label: string; icon?: string; message: string; }[];
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
  chatLog,
  setChatLog,
}: Props) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: number; type: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const timelineEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addEntry = (entry: ChatEntry) => setChatLog(prev => [...prev, entry]);
  const ts = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Scroll to bottom on new chat entries
  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, loading]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const handleSend = async (text: string) => {
    if (!text.trim() && !attachedFile) return;

    let userMsg = text.trim();
    if (attachedFile) {
      // Append file review log
      addEntry({
        role: 'system',
        content: `File attached for NOVA review: ${attachedFile.name} (${(attachedFile.size / 1024).toFixed(1)} KB)`,
        timestamp: ts(),
        responseType: 'System'
      });
      if (!userMsg) {
        userMsg = `Analyze file: ${attachedFile.name}`;
      }
    }

    if (userMsg) {
      addEntry({ role: 'user', content: userMsg, timestamp: ts() });
    }

    setInput('');
    const fileNameAttached = attachedFile?.name;
    setAttachedFile(null);
    setLoading(true);

    try {
      if (fileNameAttached) {
        // Fallback message for file analysis
        await new Promise(resolve => setTimeout(resolve, 1500));
        addEntry({
          role: 'nova',
          content: `File "${fileNameAttached}" received in UI. Full parsing pipeline pending. Prepare Hamada task if analysis is required.`,
          timestamp: ts(),
          responseType: 'Insight'
        });
      } else {
        const memoryContext = buildMemoryContext(globalMemoryStore.getState());
        globalMemoryStore.addChat('user', userMsg);

        const doFetch = window['fetch'];
        const requestBody = { 
          message: userMsg, 
          projectScope: 'Nexus Command Center', 
          mode: 'advisor',
          memoryContext: memoryContext
        };

        console.log('>>> [NOVA UI REQUEST]');
        console.log('REQUEST URL: /api/nova/chat');
        console.log('REQUEST BODY:', requestBody);

        const res = await doFetch('/api/nova/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        const data = await res.json();

        console.log('<<< [NOVA UI RESPONSE]');
        console.log('RESPONSE JSON:', data);

        globalMemoryStore.addChat('nova', data.reply || 'No response.');

        addEntry({ 
          role: 'nova', 
          content: data.reply || 'No response.', 
          timestamp: ts(), 
          responseType: 'Local Memory Insight',
          provider: data.provider,
          duration: data.duration,
          confidence: data.confidence,
          indicators: data.indicators,
          actions: data.actions
        });
      }
    } catch (err) {
      console.error("[NOVA UI Error]", err);
      addEntry({
        role: 'system',
        content: `NOVA backend error: ${(err as Error).message || 'Connection failed'}`,
        timestamp: ts(),
        responseType: 'Error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = (label: string, goal: string) => {
    if (goal === 'workspace') {
      addEntry({ role: 'user', content: `Requesting: ${label}`, timestamp: ts() });
      addEntry({
        role: 'system',
        content: 'Opening Brain Workspace workspace node...',
        timestamp: ts(),
        responseType: 'System'
      });
      onOpenWorkspace();
      return;
    }
    const cmd = generateHamadaCommand('Nexus Command Center', goal, `Quick action: ${label}`);
    globalMemoryStore.addCommand(cmd);
    const resType = label.includes('Status') ? 'Status' : 'Hamada Command';
    addEntry({ role: 'user', content: `Requesting: ${label}`, timestamp: ts() });
    addEntry({
      role: 'assistant',
      content: `Drafted command for ${label}:`,
      command: cmd,
      timestamp: ts(),
      responseType: resType
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile({ name: file.name, size: file.size, type: file.type });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setAttachedFile({ name: file.name, size: file.size, type: file.type });
    }
  };

  // Get last action label dynamically
  const getLastAction = () => {
    const userMessages = chatLog.filter(e => e.role === 'user');
    if (userMessages.length > 0) {
      return userMessages[userMessages.length - 1].content;
    }
    return 'Telemetry Sync Complete';
  };

  return (
    <aside
      className="nova-assistant-panel"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            className="nap-drag-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="drag-content">
              <Paperclip size={24} className="drag-icon text-cyan" />
              <span>Drop file to attach for NOVA review</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="nap-header">
        <Sparkles size={13} style={{ color: novaOnline ? '#00d2ff' : '#ff1744' }} />
        <span className="nap-title">NOVA COMMAND BRIDGE</span>
        <span className={`nap-badge ${novaOnline ? 'badge-online' : 'badge-offline'}`}>
          {novaOnline ? novaProvider.toUpperCase() : 'OFFLINE'}
        </span>
      </div>

      {/* Context Strip */}
      <div className="nap-context-strip">
        <div className="context-item">
          <span className="context-lbl">PROJECT:</span>
          <span className="context-val text-cyan">nexus-cc</span>
        </div>
        <div className="context-item">
          <span className="context-lbl">ENGINE:</span>
          <span className="context-val">{novaOnline ? 'Ollama' : 'Offline'}</span>
        </div>
        <div className="context-item">
          <span className="context-lbl">BRIDGE:</span>
          <span className={`context-val ${bridgeOnline ? 'text-green' : 'text-red'}`}>
            {bridgeOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
        <div className="context-item">
          <span className="context-lbl">OMEGA:</span>
          <span className={`context-val ${omegaStatus.status === 'online' ? 'text-green' : 'text-red'}`}>
            {omegaStatus.status.toUpperCase()}
          </span>
        </div>
        <div className="context-item truncate">
          <span className="context-lbl">LAST ACTION:</span>
          <span className="context-val truncate-text">{getLastAction()}</span>
        </div>
        <div className="context-item">
          <span className="context-lbl">APPROVALS:</span>
          <span className="context-val text-amber">1</span>
        </div>
      </div>

      {/* Chat Timeline Area */}
      <div className="nap-timeline-wrapper">
        <div className="nap-chat-timeline">
          {/* Default Welcome card if empty */}
          {chatLog.length === 0 && (
            <div className="nap-msg-card system">
              <div className="msg-card-header">
                <span className="msg-sender">SYSTEM</span>
                <span className="msg-ts">{ts()}</span>
              </div>
              <p className="msg-text">
                NOVA Operating Deck initialized. Tactical bridge active. Select an action or type a query.
              </p>
            </div>
          )}

          {chatLog.map((entry, idx) => {
            const isUser = entry.role === 'user';
            const isSystem = entry.role === 'system';
            const cardClass = isUser
              ? 'user'
              : isSystem
                ? 'system'
                : entry.command
                  ? 'command'
                  : 'nova';

            return (
              <div key={idx} className={`nap-msg-card ${cardClass}`}>
                 <div className="msg-card-header">
                  <span className="msg-sender">
                    {isUser ? 'YOU (OWNER)' : isSystem ? 'SYSTEM' : 'NOVA (AI)'}
                  </span>
                  <span className="msg-ts">{entry.timestamp}</span>
                  {entry.responseType && (
                    <span className="msg-type-badge">{entry.responseType}</span>
                  )}
                </div>

                {/* Compact Metadata Header */}
                {!isUser && !isSystem && (entry.provider || entry.duration !== undefined) && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.45rem',
                    color: '#78909c',
                    fontFamily: 'monospace',
                    marginBottom: 4,
                    flexWrap: 'wrap',
                    borderBottom: '1px dashed rgba(255,255,255,0.05)',
                    paddingBottom: 4
                  }}>
                    <span style={{ color: '#00d2ff', fontWeight: 600 }}>
                      {entry.provider === 'nexus-router' ? '⚡ NOVA Router' :
                       entry.provider === 'nexus-memory' ? '🧠 NOVA Memory' :
                       entry.provider === 'ollama' ? '🤖 Ollama Engine' :
                       entry.provider === 'openai' ? '🤖 OpenAI Bridge' : 'NOVA Engine'}
                    </span>
                    <span>•</span>
                    <span>{entry.duration !== undefined ? `${entry.duration.toFixed(2)}s` : '0.0s'}</span>
                    <span>•</span>
                    <span>Confidence {entry.confidence ? `${(entry.confidence * 100).toFixed(0)}%` : '98%'}</span>
                    
                    {entry.indicators && (
                      <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', alignItems: 'center' }}>
                        {entry.indicators.memoryUsed && <span style={{ background: 'rgba(213,0,249,0.04)', border: '1px solid rgba(213,0,249,0.15)', padding: '1px 3px', borderRadius: 3, fontSize: '0.38rem', color: '#d500f9' }}>🧠 Mem</span>}
                        {entry.indicators.router && <span style={{ background: 'rgba(0,210,255,0.04)', border: '1px solid rgba(0,210,255,0.15)', padding: '1px 3px', borderRadius: 3, fontSize: '0.38rem', color: '#00d2ff' }}>⚡ Rot</span>}
                        {entry.indicators.search && <span style={{ background: 'rgba(0,230,118,0.04)', border: '1px solid rgba(0,230,118,0.15)', padding: '1px 3px', borderRadius: 3, fontSize: '0.38rem', color: '#00e676' }}>🔍 Src</span>}
                        {entry.indicators.execution && <span style={{ background: 'rgba(255,23,68,0.04)', border: '1px solid rgba(255,23,68,0.15)', padding: '1px 3px', borderRadius: 3, fontSize: '0.38rem', color: '#ff1744' }}>🛠 Exec</span>}
                      </div>
                    )}
                  </div>
                )}

                <p className="msg-text" dir="auto">{entry.content}</p>

                {entry.command && (
                  <div className="msg-command-box">
                    <pre>{entry.command}</pre>
                  </div>
                )}

                {/* Remote Smart Action Buttons */}
                {!isUser && !isSystem && entry.actions && entry.actions.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8, borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: 6 }}>
                    {entry.actions.map((act, ai) => (
                      <button
                        key={ai}
                        onClick={() => handleSend(act.message)}
                        disabled={loading}
                        style={{
                          background: 'rgba(0,210,255,0.06)',
                          border: '1px solid rgba(0,210,255,0.2)',
                          color: '#00d2ff',
                          fontFamily: 'monospace',
                          fontSize: '0.45rem',
                          padding: '3px 8px',
                          borderRadius: 4,
                          cursor: loading ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          opacity: loading ? 0.5 : 1,
                          transition: 'all 0.15s',
                        }}
                      >
                        🚀 {act.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Inline Action Buttons */}
                {!isUser && !isSystem && (
                  <div className="msg-inline-actions">
                    <button className="msg-act-btn" onClick={() => copyToClipboard(entry.content)}>
                      📋 Copy Reply
                    </button>
                    <button className="msg-act-btn" onClick={() => {
                      for (let i = idx - 1; i >= 0; i--) {
                        if (chatLog[i].role === 'user') {
                          handleSend(chatLog[i].content);
                          break;
                        }
                      }
                    }}>
                      ↻ Retry
                    </button>
                    <button className="msg-act-btn" onClick={() => {
                      globalMemoryStore.pinItem(entry.content);
                      addEntry({ role: 'system', content: '📌 Saved to Live Memory', timestamp: ts(), responseType: 'System' });
                    }}>
                      📌 Save Memory
                    </button>
                    {entry.command && (
                      <button className="msg-act-btn text-cyan" onClick={() => copyToClipboard(entry.command!)}>
                        <Terminal size={9} /> Copy Command
                      </button>
                    )}
                    {entry.command && (
                      <button className="msg-act-btn" onClick={() => copyToClipboard(entry.command!)}>
                        <CheckSquare size={9} /> Create Task
                      </button>
                    )}
                    <button className="msg-act-btn" onClick={() => copyToClipboard(JSON.stringify(entry))}>
                      <Bookmark size={9} /> Save Draft
                    </button>
                    <button className="msg-act-btn" onClick={() => addEntry({ role: 'system', content: `Marked index ${idx} as needs review.`, timestamp: ts() })}>
                      <Shield size={9} /> Flag Review
                    </button>
                    <button className="msg-act-btn" onClick={onOpenWorkspace}>
                      <Layers size={9} /> Workspace
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing/Loading State */}
          {loading && (
            <div className="nap-msg-card nova typing">
              <div className="msg-card-header">
                <span className="msg-sender">NOVA (AI)</span>
                <span className="msg-ts">{ts()}</span>
              </div>
              <div className="msg-typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
                <span className="typing-text">NOVA is analyzing system context...</span>
              </div>
            </div>
          )}
          <div ref={timelineEndRef} />
        </div>
      </div>

      {/* Avatar & System advisor intro (Calm & minimized) */}
      <div className="nap-advisor-bar">
        <motion.div
          className="nap-avatar"
          animate={{
            boxShadow: loading
              ? ['0 0 8px rgba(0,210,255,0.4)', '0 0 24px rgba(123,97,255,0.8)', '0 0 8px rgba(0,210,255,0.4)']
              : ['0 0 8px rgba(0,210,255,0.2)', '0 0 12px rgba(0,210,255,0.3)', '0 0 8px rgba(0,210,255,0.2)']
          }}
          transition={{ duration: loading ? 1.5 : 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="nap-advisor-txt">
          {loading ? 'NOVA is thinking...' : 'Awaiting your command, Commander.'}
        </span>
      </div>

      {/* Quick Actions Panel */}
      <div className="nap-quick-actions-bar">
        <span className="nap-section-lbl">QUICK ACTIONS</span>
        <div className="nap-quick-actions">
          {QUICK_ACTIONS.map(qa => (
            <button
              key={qa.label}
              className="nap-qa-btn"
              onClick={() => handleQuick(qa.label, qa.goal)}
            >
              <qa.Icon size={11} className="qa-icon" />
              <span>{qa.label}</span>
            </button>
          )) }
        </div>
      </div>

      {/* Input area */}
      <div className="nap-input-area">
        {/* Attached File Preview Chip */}
        {attachedFile && (
          <div className="nap-file-chip">
            <Paperclip size={10} className="file-chip-icon" />
            <span className="file-chip-name">{attachedFile.name}</span>
            <span className="file-chip-size">({(attachedFile.size / 1024).toFixed(1)} KB)</span>
            <button className="file-chip-remove" onClick={() => setAttachedFile(null)}>
              <X size={10} />
            </button>
          </div>
        )}

        <div className="nap-input-wrapper">
          <button
            className="nap-attach-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Attach Local File"
          >
            <Paperclip size={13} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <input
            className="nap-input"
            placeholder={loading ? 'NOVA is analyzing context...' : 'Ask NOVA anything...'}
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
        <div className="nap-input-commands-hint" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="hint-dot" />
            <span>Press / for commands</span>
          </div>
          <span style={{ color: '#8a99ad', fontSize: '0.42rem' }}>|</span>
          <span style={{ color: '#00d2ff', fontSize: '0.45rem' }}>اسأل NOVA بالعربي: حالة السيستم إيه؟</span>
          <button 
            onClick={() => handleSend('نوفا، راجعي حالة السيستم كله وقوليلي إيه اللي شغال وإيه اللي واقع وإيه الخطوة الآمنة التالية.')}
            style={{
              background: 'rgba(0, 210, 255, 0.1)',
              border: '1px solid rgba(0, 210, 255, 0.3)',
              color: '#00d2ff',
              padding: '2px 8px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '0.42rem',
              fontWeight: 600
            }}
          >
            حالة النظام بالعربي
          </button>
        </div>
      </div>
    </aside>
  );
}
