// Live Health Engine — polls real ports every 10 seconds
// Used by SystemGraph3D and any component needing live node status

import { useState, useEffect, useRef } from 'react';

export type LiveStatus = 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'UNKNOWN';

export interface PortHealth {
  port: number;
  status: LiveStatus;
  latencyMs?: number;
  checkedAt: string;
}

// Ports to probe
const PROBE_TARGETS: { port: number; path?: string }[] = [
  { port: 3000 },
  { port: 5001, path: '/api/healthz' },
  { port: 5057 },
  { port: 5173 },
  { port: 5174 },
  { port: 11434, path: '/api/tags' },
];

async function probePort(port: number, path = '/'): Promise<PortHealth> {
  const url = `http://localhost:${port}${path}`;
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, { signal: controller.signal, mode: 'no-cors' });
    clearTimeout(timer);
    const latencyMs = Date.now() - start;
    // no-cors: res.type === 'opaque' still means port responded
    const ok = res.ok || res.type === 'opaque';
    return {
      port,
      status: ok ? (latencyMs > 2000 ? 'DEGRADED' : 'ONLINE') : 'OFFLINE',
      latencyMs,
      checkedAt: new Date().toISOString(),
    };
  } catch {
    return { port, status: 'OFFLINE', checkedAt: new Date().toISOString() };
  }
}

export function useLiveHealth(intervalMs = 10000): Record<number, PortHealth> {
  const [health, setHealth] = useState<Record<number, PortHealth>>(() => {
    const init: Record<number, PortHealth> = {};
    for (const t of PROBE_TARGETS) {
      init[t.port] = { port: t.port, status: 'UNKNOWN', checkedAt: new Date().toISOString() };
    }
    return init;
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runProbes = async () => {
    const results = await Promise.all(
      PROBE_TARGETS.map(t => probePort(t.port, t.path))
    );
    setHealth(prev => {
      const next = { ...prev };
      for (const r of results) next[r.port] = r;
      return next;
    });
  };

  useEffect(() => {
    runProbes();
    timerRef.current = setInterval(runProbes, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs]);

  return health;
}

// Map port to graph node id for status overlay
export const PORT_TO_NODE_ID: Record<number, string> = {
  3000:  'omega-dashboard',
  5001:  'omega-gateway',
  5057:  'omega-gateway',
  5173:  'command-center',
  5174:  'recruitment-hub',
  11434: 'ollama',
};

export const STATUS_COLORS: Record<LiveStatus, string> = {
  ONLINE:  '#00e676',
  OFFLINE: '#ff1744',
  DEGRADED:'#ffab00',
  UNKNOWN: '#546e7a',
};
