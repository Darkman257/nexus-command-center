import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Copy } from 'lucide-react';
import { globalMemoryStore } from '../../brain/nova-memory/memoryStore';
import { buildMemoryContext } from '../../brain/nova-memory/memoryContextBuilder';
import type { ChatEntry } from './NovaAssistantPanel';
import { globalRuntimeBus } from '../../runtime/bus/runtimeBus';

interface Props {
  activeLauncherItem: string | null;
  chatLog: ChatEntry[];
  setChatLog: React.Dispatch<React.SetStateAction<ChatEntry[]>>;
}

export function NovaFloatingAssistant({ activeLauncherItem, chatLog, setChatLog }: Props) {
  // Remember minimized/open state across sessions/navigation using localStorage
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('nexus_nova_assistant_open');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync open state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nexus_nova_assistant_open', JSON.stringify(isOpen));
    } catch (e) {
      console.warn('Failed to save assistant open state', e);
    }

    // Auto-focus input when the assistant panel is opened
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
    }
  }, [isOpen]);

  const [isAlertPulsing, setIsAlertPulsing] = useState(false);
  const [pulseColor, setPulseColor] = useState('var(--purple)');

  useEffect(() => {
    const unsubscribe = globalRuntimeBus.subscribe('*', (evt) => {
      const isWarn = evt.event_type.includes('anomaly') || (evt.confidence ?? 1.0) < 0.9;
      setPulseColor(isWarn ? 'var(--amber)' : 'var(--cyan)');
      setIsAlertPulsing(true);
      const timer = setTimeout(() => setIsAlertPulsing(false), 2200);
      return () => clearTimeout(timer);
    });
    return () => unsubscribe();
  }, []);

  // Scroll to bottom of chat list on new entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatLog, isOpen, loading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    setInput('');
    
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const getContext = (page: string | null) => {
      if (!page || page === 'cc' || page === 'nexus-command-center') return 'NEXUS';
      if (page.includes('omega') || page === 'dashboard') return 'OMEGA';
      if (page.includes('recruit')) return 'RECRUITMENT';
      return 'NEXUS';
    };
    const currentContext = getContext(activeLauncherItem);

    // 1. Sync User Message
    const userMsg: ChatEntry = { role: 'user', content: userText, timestamp: ts };
    setChatLog(prev => [...prev, userMsg]);
    globalMemoryStore.addChat('user', userText);

    // 2. Set Typing Indicator
    setLoading(true);

    // Prepare clean context payload for future brain/API sync
    const cognitiveContext = {
      currentPage: activeLauncherItem || 'cc',
      currentWorkspace: currentContext,
      runtimeMemoryContext: buildMemoryContext(globalMemoryStore.getState()),
      uploadedFileContext: null
    };
    console.log('[NOVA COGNITIVE CONTEXT SYNC]', cognitiveContext);

    try {
      const doFetch = window['fetch'];
      const res = await doFetch('/api/nova/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userText, 
          projectScope: cognitiveContext.currentWorkspace,
          mode: 'advisor',
          memoryContext: cognitiveContext.runtimeMemoryContext
        }),
      });
      const data = await res.json();
      
      const replyMsg: ChatEntry = {
        role: 'nova',
        content: data.reply || 'No response.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        responseType: 'Operational Insight'
      };

      setChatLog(prev => [...prev, replyMsg]);
      globalMemoryStore.addChat('nova', data.reply || 'No response.');
    } catch (err) {
      console.error("[NOVA UI Error]", err);
      setChatLog(prev => [...prev, {
        role: 'system',
        content: `NOVA backend error: ${(err as Error).message || 'Connection failed'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        responseType: 'Error'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button (Subtle, Elegant, Monospace Tactical Indicator) */}
      <motion.button
        className="nova-floating-trigger"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        animate={{
          y: [0, -5, 0],
          boxShadow: isOpen 
            ? '0 0 18px rgba(0, 210, 255, 0.45)' 
            : isAlertPulsing
              ? `0 0 25px ${pulseColor}`
              : ['0 0 8px rgba(213, 0, 249, 0.25)', '0 0 18px rgba(213, 0, 249, 0.45)', '0 0 8px rgba(213, 0, 249, 0.25)']
        }}
        transition={{ 
          y: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
          boxShadow: { duration: isAlertPulsing ? 0.3 : 3, repeat: isAlertPulsing ? 0 : Infinity, ease: 'easeInOut' }
        }}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          background: 'rgba(7, 10, 18, 0.9)',
          border: isOpen ? '1px solid var(--cyan)' : '1px solid var(--purple)',
          color: isOpen ? 'var(--cyan)' : 'var(--purple)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          transition: 'border-color 0.3s ease, color 0.3s ease'
        }}
      >
        <Sparkles size={16} />
      </motion.button>

      {/* Floating Conversation Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="glass"
            style={{
              position: 'fixed',
              bottom: '84px',
              right: '24px',
              width: '350px',
              height: '480px',
              zIndex: 9998,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              background: 'rgba(3, 8, 16, 0.75)',
              border: '1px solid rgba(0, 210, 255, 0.15)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.03)'
            }}
          >
            {/* Tactical Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 12px',
              borderBottom: '1px solid var(--border)',
              background: 'rgba(0,0,0,0.25)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={12} style={{ color: 'var(--cyan)', opacity: 0.9 }} />
                <div>
                  <div style={{ fontSize: '0.52rem', fontWeight: 800, color: 'var(--text-bright)', letterSpacing: '1.2px', fontFamily: 'var(--mono)' }}>NOVA</div>
                  <div style={{ fontSize: '0.38rem', color: 'var(--text-muted)', fontFamily: 'var(--font)' }}>Operational Intelligence Assistant</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(213, 0, 249, 0.1)', padding: '2px 5px', borderRadius: '3px', border: '1px solid rgba(213,0,249,0.2)' }}>
                  <span style={{ fontSize: '0.36rem', color: 'var(--purple)', fontWeight: 700, fontFamily: 'var(--mono)' }}>🧠 {(() => {
                    const page = activeLauncherItem;
                    if (!page || page === 'cc' || page === 'nexus-command-center') return 'NEXUS';
                    if (page.includes('omega') || page === 'dashboard') return 'OMEGA';
                    if (page.includes('recruit')) return 'RECRUITMENT';
                    return 'NEXUS';
                  })()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0, 230, 118, 0.1)', padding: '2px 5px', borderRadius: '3px', border: '1px solid rgba(0,230,118,0.2)' }}>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
                  <span style={{ fontSize: '0.36rem', color: 'var(--green)', fontWeight: 700, fontFamily: 'var(--mono)' }}>ONLINE</span>
                </div>
                <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', color: 'var(--text-muted)', padding: '2px', display: 'flex', cursor: 'pointer' }}>
                  <X size={12} />
                </button>
              </div>
            </div>

            {/* Scrolling Feed (Monospace Tactical Style) */}
            <div ref={scrollRef} style={{
              flex: 1,
              padding: '12px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {chatLog.length === 0 && (
                <div style={{
                  background: 'rgba(0,0,0,0.15)',
                  border: '1px solid rgba(255,255,255,0.02)',
                  padding: '10px',
                  borderRadius: '4px',
                  fontSize: '0.45rem',
                  color: 'var(--text-main)',
                  lineHeight: '1.4',
                  fontFamily: 'var(--mono)'
                }}>
                  NOVA Operating interface stable. Ask a question or request a localized operational command.
                </div>
              )}

              {chatLog.map((msg, i) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={i} style={{
                    background: isUser ? 'rgba(0, 210, 255, 0.03)' : 'rgba(213, 0, 249, 0.02)',
                    borderLeft: isUser ? '2px solid var(--cyan)' : '2px solid var(--purple)',
                    padding: '8px 10px',
                    borderRadius: '0 4px 4px 0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.38rem', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                      <span>{isUser ? '[YOU - OWNER]' : '[NOVA - AI]'}</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <div dir="auto" style={{ fontSize: '16px', color: 'var(--text-bright)', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontFamily: 'var(--mono)' }}>
                      {msg.content}
                    </div>

                    {msg.command && (
                      <div style={{
                        marginTop: '8px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.03)',
                        padding: '6px',
                        borderRadius: '4px',
                        fontFamily: 'var(--mono)',
                        fontSize: '0.42rem',
                        color: 'var(--cyan)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <pre style={{ margin: 0, overflowX: 'auto', flex: 1 }}>{msg.command}</pre>
                        <button 
                          onClick={() => navigator.clipboard.writeText(msg.command!)}
                          style={{ background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex' }}
                          title="Copy Command"
                        >
                          <Copy size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px' }}>
                  <span style={{ fontSize: '0.4rem', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>NOVA is analyzing context...</span>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--purple)', display: 'inline-block' }} />
                    <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--purple)', display: 'inline-block' }} />
                    <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--purple)', display: 'inline-block' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input Form Area */}
            <div style={{
              padding: '10px',
              borderTop: '1px solid var(--border)',
              background: 'rgba(0,0,0,0.2)'
            }}>
              <div style={{
                display: 'flex',
                background: 'rgba(5, 10, 20, 0.6)',
                border: '1px solid rgba(0, 210, 255, 0.1)',
                borderRadius: '4px',
                padding: '4px',
                alignItems: 'center'
              }}>
                <input
                  ref={inputRef}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text-bright)',
                    fontSize: '16px',
                    padding: '6px 8px',
                    fontFamily: 'var(--font)'
                  }}
                  placeholder="Ask NOVA about operations..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                />
                <button
                  onClick={handleSend}
                  style={{
                    background: 'rgba(0, 210, 255, 0.1)',
                    border: 'none',
                    color: 'var(--cyan)',
                    width: '28px',
                    height: '28px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Send size={12} />
                </button>
              </div>
              <div style={{ marginTop: '6px', fontSize: '0.36rem', color: 'var(--text-muted)', fontFamily: 'var(--mono)', textAlign: 'right' }}>
                Press Enter to audit
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
