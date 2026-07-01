import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Activity, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { globalMemoryStore } from '../brain/nova-memory/memoryStore';
import { buildMemoryContext } from '../brain/nova-memory/memoryContextBuilder';
import { loadPersonality, buildPersonalityInstruction } from '../lib/novaPersonality';
import type { NovaPersonality } from '../lib/novaPersonality';

interface QuickAction {
  label: string;
  icon: string;
  message: string;
}

interface ChatEntry {
  role: 'user' | 'nova' | 'system' | 'warning';
  content: string;
  timestamp: string;
  actions?: QuickAction[];
  provider?: string;
  duration?: number;
  confidence?: number;
  indicators?: {
    router?: boolean;
    memoryUsed?: boolean;
    search?: boolean;
    execution?: boolean;
  };
}

// ─── Intent Detection ────────────────────────────────────────────────────────────

function detectActions(userMessage: string): QuickAction[] {
  const msg = userMessage.toLowerCase();
  const actions: QuickAction[] = [];

  // Status / Audit intent
  if (msg.match(/(حالة|حاله|نكسس|status|audit|راجع|تفقد|افحص)/)) {
    actions.push({ label: 'Audit', icon: '🔍', message: 'اعرض تقرير كامل عن حالة نكسس' });
    actions.push({ label: 'Status', icon: '🟢', message: 'اعرض حالة الخدمات' });
  }
  // Open Omega intent
  if (msg.match(/(افتح|شغل|اوميجا|omega)/)) {
    actions.push({ label: 'Open Omega', icon: '🚀', message: 'افتح أوميجا' });
  }
  // Open Recruitment intent
  if (msg.match(/(التوظيف|recruitment|حامدة)/)) {
    actions.push({ label: 'Open Recruitment', icon: '👥', message: 'افتح التوظيف' });
  }
  // Graph intent
  if (msg.match(/(غراف|خريطة|نظام|graph)/)) {
    actions.push({ label: 'Show Graph', icon: '📊', message: 'اشرح بنية نكسس والعلاقات بين الخدمات' });
  }

  return actions.slice(0, 4); // max 4 buttons
}

// ─── Quick Command Suggestions ────────────────────────────────────────────────

const SUGGESTIONS = [
  'اعرض حالة نكسس',
  'افتح أوميجا',
  'افتح التوظيف',
  'ايه المشاريع عندنا؟',
  'ايه القرارات الأخيرة؟',
  'اعرض حالة الخدمات',
];

// ─── Nova Page ────────────────────────────────────────────────────────────────

export function NovaPage() {
  const [chatLog, setChatLog] = useState<ChatEntry[]>([
    {
      role: 'nova',
      content: 'أهلاً. أنا NOVA — واجهة القيادة الموحدة لـ NEXUS.\n\nيمكنك:\n● افتح أوميجا / افتح التوظيف\n● اعرض حالة نكسس\n● راجع مشروع [الاسم]\n● اسأل عن أي قرار أو مشروع أو خدمة',
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [novaStatus, setNovaStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [personality, setPersonality] = useState<NovaPersonality>(() => loadPersonality());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
      .then(() => triggerToast('📋 Copied to Clipboard'))
      .catch(() => triggerToast('❌ Failed to copy'));
  };

  const handleRetry = (index: number) => {
    // Find the last user message before this entry index
    for (let idx = index - 1; idx >= 0; idx--) {
      if (chatLog[idx].role === 'user') {
        sendMessage(chatLog[idx].content);
        break;
      }
    }
  };

  const handleSaveMemory = (content: string) => {
    globalMemoryStore.pinItem(content);
    triggerToast('📌 Saved to Live Memory');
  };

  // Check NOVA status on mount + consume pending prompt from SystemGraph3D "Ask NOVA"
  useEffect(() => {
    fetch('/api/nova/local-status')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const isOnline = d && (
          d.ollamaOnline ||
          ['ollama', 'nexus-router', 'fast-router', 'nexus-memory'].includes(d.selectedProvider)
        );
        setNovaStatus(isOnline ? 'online' : 'offline');
      })
      .catch(() => setNovaStatus('offline'));
    // Reload personality in case user changed it in Settings tab
    setPersonality(loadPersonality());
    // Consume pending prompt from SystemGraph3D "Ask NOVA" button
    try {
      const pending = sessionStorage.getItem('nexus_nova_pending_prompt');
      if (pending) {
        sessionStorage.removeItem('nexus_nova_pending_prompt');
        // Small delay to let the component fully mount before sending
        setTimeout(() => sendMessage(pending), 400);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatLog, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatEntry = {
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };
    setChatLog(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const memCtx = buildMemoryContext(globalMemoryStore.getState());
      const personalityInstructions = buildPersonalityInstruction(personality);
      const requestBody = { message: text, memoryContext: memCtx, personalityInstructions };

      console.log('>>> [NOVA UI REQUEST]');
      console.log('REQUEST URL: /api/nova/chat');
      console.log('REQUEST BODY:', requestBody);

      const res = await fetch('/api/nova/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      console.log('<<< [NOVA UI RESPONSE]');
      console.log('RESPONSE JSON:', data);

      const reply = data.reply ?? data.message ?? 'لم أفهم الطلب.';
      
      const remoteActions = (data.actions || []).map((a: any) => ({
        label: a.label,
        icon: a.label.includes('افتح') ? '🚀' : a.label.includes('حالة') ? '🔍' : '⚡',
        message: a.message
      }));
      
      const localActions = detectActions(text);
      const combinedActions = [
        ...remoteActions,
        ...localActions.filter(la => !remoteActions.some((ra: any) => ra.label === la.label))
      ].slice(0, 4);

      setChatLog(prev => [...prev, {
        role: 'nova',
        content: reply,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        actions: combinedActions,
        provider: data.provider,
        duration: data.duration,
        confidence: data.confidence,
        indicators: data.indicators
      }]);

      // Memory persistence handled by NOVA backend

    } catch (err) {
      setChatLog(prev => [...prev, {
        role: 'warning',
        content: `فشل الاتصال بـ NOVA: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const statusColor = novaStatus === 'online' ? '#00e676' : novaStatus === 'offline' ? '#ff1744' : '#ffab00';
  const statusLabel = novaStatus === 'online' ? 'متصل' : novaStatus === 'offline' ? 'غير متصل' : 'جاري الفحص';

  return (
    <section style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px 24px', gap: 16, overflow: 'hidden', position: 'relative' }}>
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(10, 10, 10, 0.85)',
          border: '1px solid rgba(0, 210, 255, 0.4)',
          color: '#00d2ff',
          padding: '8px 18px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: 600,
          boxShadow: '0 0 16px rgba(0, 210, 255, 0.3)',
          zIndex: 9999,
          backdropFilter: 'blur(8px)',
          pointerEvents: 'none',
          fontFamily: 'monospace'
        }}>
          {toastMsg}
        </div>
      )}
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <Sparkles size={20} style={{ color: '#00d2ff' }} />
          <span style={{
            position: 'absolute', top: -2, right: -2,
            width: 7, height: 7, borderRadius: '50%',
            background: statusColor, border: '1px solid #0a0a0a',
            boxShadow: `0 0 6px ${statusColor}`,
          }} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e0e6ef', letterSpacing: 2 }}>NOVA</div>
          <div style={{ fontSize: 10, color: '#546e7a', letterSpacing: 1 }}>
            واجهة الأوامر الذكية ·
            <span style={{ color: statusColor, marginLeft: 4 }}>{statusLabel}</span>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            onClick={() => setChatLog([{
              role: 'nova',
              content: 'تم مسح المحادثة. كيف يمكنني مساعدتك؟',
              timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
            }])}
            style={{ background: 'none', border: '1px solid #1a2433', color: '#546e7a', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RotateCcw size={11} /> مسح
          </button>
        </div>
      </div>

      {/* Quick suggestions */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            onClick={() => sendMessage(s)}
            disabled={loading}
            style={{
              background: 'rgba(0,210,255,0.06)', border: '1px solid #00d2ff22',
              color: '#00d2ff99', fontFamily: 'monospace', fontSize: 11,
              padding: '4px 10px', borderRadius: 4, cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.4 : 1, transition: 'all 0.15s',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Chat log */}
      <div
        ref={scrollRef}
        style={{
          flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12,
          padding: '4px 0', scrollbarWidth: 'thin',
        }}
      >
        <AnimatePresence initial={false}>
          {chatLog.map((entry, i) => {
            const isUser    = entry.role === 'user';
            const isWarning = entry.role === 'warning';
            const isSystem  = entry.role === 'system';
            const bgColor   = isUser ? 'rgba(0,210,255,0.10)' : isWarning ? 'rgba(255,23,68,0.10)' : isSystem ? 'rgba(255,255,255,0.04)' : 'rgba(213,0,249,0.08)';
            const borderColor = isUser ? '#00d2ff33' : isWarning ? '#ff174433' : isSystem ? '#1a2433' : '#d500f922';
            const textColor   = isWarning ? '#ff7043' : '#d0d8e4';

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
              >
                {/* Role badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {!isUser && <Sparkles size={11} style={{ color: isWarning ? '#ff1744' : '#d500f9' }} />}
                  <span style={{ fontSize: 9, color: '#37474f', fontFamily: 'monospace', letterSpacing: 1 }}>
                    {isUser ? 'أنت' : isWarning ? 'تحذير' : isSystem ? 'النظام' : 'NOVA'} · {entry.timestamp}
                  </span>
                </div>

                {/* Compact Metadata Header */}
                {!isUser && !isSystem && !isWarning && (entry.provider || entry.duration !== undefined) && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 10,
                    color: '#78909c',
                    fontFamily: 'monospace',
                    marginBottom: 2,
                    paddingLeft: 4,
                    flexWrap: 'wrap'
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
                      <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', alignItems: 'center' }}>
                        {entry.indicators.memoryUsed && <span style={{ background: 'rgba(213,0,249,0.06)', border: '1px solid rgba(213,0,249,0.2)', padding: '1px 5px', borderRadius: 4, fontSize: 8, color: '#d500f9' }}>🧠 Memory</span>}
                        {entry.indicators.router && <span style={{ background: 'rgba(0,210,255,0.06)', border: '1px solid rgba(0,210,255,0.2)', padding: '1px 5px', borderRadius: 4, fontSize: 8, color: '#00d2ff' }}>⚡ Router</span>}
                        {entry.indicators.search && <span style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.2)', padding: '1px 5px', borderRadius: 4, fontSize: 8, color: '#00e676' }}>🔍 Search</span>}
                        {entry.indicators.execution && <span style={{ background: 'rgba(255,23,68,0.06)', border: '1px solid rgba(255,23,68,0.2)', padding: '1px 5px', borderRadius: 4, fontSize: 8, color: '#ff1744' }}>🛠 Execution</span>}
                      </div>
                    )}
                  </div>
                )}

                {/* Message bubble */}
                <div style={{
                  background: bgColor, border: `1px solid ${borderColor}`,
                  borderRadius: isUser ? '10px 10px 4px 10px' : '4px 10px 10px 10px',
                  padding: '10px 14px',
                  fontSize: 13, color: textColor, lineHeight: 1.7,
                  whiteSpace: 'pre-wrap', textAlign: 'start' as const,
                  marginRight: isUser ? 0 : '10%',
                  marginLeft: isUser ? '10%' : 0,
                }}>
                  {entry.content}
                </div>

                {/* Message Action Bar */}
                {!isUser && !isWarning && !isSystem && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 2, paddingLeft: 4 }}>
                    <button
                      onClick={() => handleCopy(entry.content)}
                      style={{ background: 'none', border: '1px solid #1a2433', color: '#546e7a', padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontFamily: 'monospace', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={() => handleRetry(i)}
                      style={{ background: 'none', border: '1px solid #1a2433', color: '#546e7a', padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontFamily: 'monospace', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      ↻ Retry
                    </button>
                    <button
                      onClick={() => handleSaveMemory(entry.content)}
                      style={{ background: 'none', border: '1px solid #1a2433', color: '#546e7a', padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontFamily: 'monospace', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      📌 Save Memory
                    </button>
                  </div>
                )}

                {/* Quick Action Buttons */}
                {!isUser && !isWarning && entry.actions && entry.actions.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {entry.actions.map((action, ai) => (
                      <button
                        key={ai}
                        onClick={() => sendMessage(action.message)}
                        disabled={loading}
                        style={{
                          background: 'rgba(0,210,255,0.08)', border: '1px solid #00d2ff33',
                          color: '#00d2ff', fontFamily: 'monospace', fontSize: 10,
                          padding: '4px 10px', borderRadius: 4, cursor: loading ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', gap: 4, opacity: loading ? 0.5 : 1,
                          transition: 'all 0.15s',
                        }}
                      >
                        {action.icon} {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
            <Activity size={13} style={{ color: '#d500f9' }} />
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 1, 2].map(d => (
                <motion.span
                  key={d}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: d * 0.2 }}
                  style={{ width: 5, height: 5, borderRadius: '50%', background: '#d500f9', display: 'inline-block' }}
                />
              ))}
            </div>
            <span style={{ fontSize: 10, color: '#546e7a', fontFamily: 'monospace' }}>NOVA يفكر...</span>
          </motion.div>
        )}
      </div>

      {/* Input row */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0, paddingBottom: 4 }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
          placeholder="اكتب أمرك لـ NOVA..."
          style={{
            flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid #1a2433',
            borderRadius: 8, color: '#e0e6ef', fontFamily: 'monospace', fontSize: 13,
            padding: '10px 14px', outline: 'none', textAlign: 'right',
          }}
          autoFocus
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          style={{
            background: input.trim() && !loading ? 'rgba(0,210,255,0.15)' : 'transparent',
            border: '1px solid #00d2ff33', borderRadius: 8, padding: '10px 16px',
            color: '#00d2ff', cursor: loading || !input.trim() ? 'default' : 'pointer',
            opacity: loading || !input.trim() ? 0.4 : 1,
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: 'monospace',
            transition: 'all 0.15s',
          }}
        >
          <Send size={14} />
        </button>
      </div>
    </section>
  );
}

export default NovaPage;
