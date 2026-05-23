import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  omegaOnline: boolean;
  novaOnline: boolean;
  bridgeOnline: boolean;
  novaProvider: string;
}

export function NovaNarrative({ omegaOnline, novaOnline, bridgeOnline, novaProvider }: Props) {
  const lines: string[] = [];

  if (omegaOnline) lines.push('Omega · strong.');
  else lines.push('Omega · unreachable.');

  if (bridgeOnline) lines.push('Bridge · active.');
  else lines.push('Bridge · offline.');

  if (novaOnline) lines.push(`Engine · ${novaProvider || 'online'}.`);
  else lines.push('NOVA engine · standby.');

  lines.push('No risks detected.');

  if (!omegaOnline || !bridgeOnline) lines.push('Awaiting system recovery.');
  else lines.push('Keep building.');

  return (
    <div className="nova-narrative-panel">
      <div className="nn-title">NOVA MEMORY</div>
      <div className="nn-lines">
        <AnimatePresence mode="popLayout">
          {lines.map((line, i) => (
            <motion.div
              key={line}
              className="nn-line"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              {line}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
