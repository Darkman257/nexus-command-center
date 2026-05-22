import { motion } from 'framer-motion';

interface LogMessage {
  time: string;
  msg: string;
  type: 'info' | 'system' | 'alert';
}

interface Props {
  logs: LogMessage[];
  onClear: () => void;
}

const TYPE_COLOR: Record<string, string> = {
  info: '#00d2ff',
  system: '#d500f9',
  alert: '#ffab00',
};

export function NovaRearChannel({ logs, onClear }: Props) {
  return (
    <div className="rear-channel-panel">
      <div className="rc-header">
        <span className="rc-title">REAR-CHANNEL INTELLIGENCE</span>
        <button className="rc-clear-btn" onClick={onClear}>[ CLEAR ]</button>
      </div>
      <div className="rc-log-area">
        {logs.map((log, i) => (
          <motion.div
            key={i}
            className="rc-log-row"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <span className="rc-time">[{log.time}]</span>
            <span className="rc-msg" style={{ color: TYPE_COLOR[log.type] ?? '#8a99ad' }}>
              {log.msg}
            </span>
          </motion.div>
        ))}
        {logs.length === 0 && (
          <span style={{ color: '#445467', fontSize: '0.5rem', fontFamily: 'var(--font-mono)' }}>
            MONITORING ACTIVE — NO EVENTS YET.
          </span>
        )}
      </div>
    </div>
  );
}
