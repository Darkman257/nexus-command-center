import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, CheckSquare, Bookmark } from 'lucide-react';
import type { ChatEntry } from './NovaAssistantPanel';

interface Props {
  entries: ChatEntry[];
  isLoading?: boolean;
}

const ROLE_STYLE: Record<string, { label: string; color: string; borderTop: string }> = {
  user: { label: 'YOU (OWNER)', color: '#00d2ff', borderTop: '2px solid #00d2ff' },
  nova: { label: 'NOVA (AI)', color: '#d500f9', borderTop: '2px solid #d500f9' },
  assistant: { label: 'NEXUS LOCAL', color: '#7b61ff', borderTop: '2px solid #7b61ff' },
};

function TimelineCard({ entry }: { entry: ChatEntry }) {
  const style = ROLE_STYLE[entry.role] ?? ROLE_STYLE.assistant;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <motion.div
      className="tl-card"
      style={{ borderTop: style.borderTop }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="tl-card-header">
        <div className="tl-role-badge">
          <span className="tl-role-dot" style={{ background: style.color }} />
          <span className="tl-role-name" style={{ color: style.color }}>{style.label}</span>
        </div>
        <span className="tl-ts">{entry.timestamp}</span>
        {entry.responseType && (
          <span className="tl-type-badge">{entry.responseType}</span>
        )}
      </div>

      <div className="tl-content">{entry.content}</div>

      {entry.command && (
        <div className="tl-command-block">
          <pre className="tl-command-pre">{entry.command}</pre>
        </div>
      )}

      {entry.role !== 'user' && (
        <div className="tl-actions">
          <motion.button
            className="tl-btn"
            whileHover={{ backgroundColor: 'rgba(0,210,255,0.15)' }}
            onClick={() => copyToClipboard(entry.command || entry.content)}
          >
            <Copy size={10} />
            Copy {entry.command ? 'Command' : 'Reply'}
          </motion.button>
          {entry.command && (
            <motion.button
              className="tl-btn"
              whileHover={{ backgroundColor: 'rgba(0,230,118,0.15)' }}
              onClick={() => copyToClipboard(entry.command!)}
            >
              <CheckSquare size={10} />
              Create Task
            </motion.button>
          )}
          <motion.button
            className="tl-btn"
            whileHover={{ backgroundColor: 'rgba(255,171,0,0.15)' }}
            onClick={() => copyToClipboard(JSON.stringify(entry))}
          >
            <Bookmark size={10} />
            Save Draft
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

export function NovaTimeline({ entries, isLoading }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, [entries]);

  return (
    <div className="nova-timeline-area">
      <div className="tl-header-bar">
        <span className="tl-title">TIMELINE</span>
        <span className="tl-count">{entries.length} entries</span>
      </div>
      <div ref={containerRef} className="tl-scroll-container">
        <AnimatePresence>
          {entries.length === 0 && (
            <motion.div
              className="tl-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              NO COMMAND HISTORY IN CURRENT SESSION.
            </motion.div>
          )}
          {entries.map((entry, i) => (
            <TimelineCard key={i} entry={entry} />
          ))}
          {isLoading && (
            <motion.div
              className="tl-card tl-card-loading"
              style={{ borderTop: '2px solid #d500f9' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <div className="tl-role-badge">
                <span className="tl-role-dot" style={{ background: '#d500f9' }} />
                <span className="tl-role-name" style={{ color: '#d500f9' }}>NOVA (AI)</span>
              </div>
              <div className="tl-content tl-typing">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
