import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { checkOmegaStatus } from '../../../packages/connectors/src/omegaConnector';
import type { SystemStatus } from '../../../packages/shared-types/src/systemStatus';

interface LogMessage {
  time: string;
  msg: string;
  type: 'info' | 'system' | 'alert';
}

interface NodeConfig {
  id: string;
  lbl: string;
  sub: string;
  stat: string;
  x: number;
  y: number;
  c: string;
  icon: string;
  acts: { lbl: string; end: string }[];
}

const INITIAL_NODES: NodeConfig[] = [
  { id: 'recruit', lbl: 'RECRUIT HQ', sub: 'Port 3820', stat: 'STANDBY', x: 26, y: 31, c: 'var(--green)', icon: 'user', acts: [{lbl: 'Run Recruit Hub', end: 'run-recruit'}, {lbl: 'Open UI', end: 'open-recruit'}, {lbl: 'Build Hub', end: 'build-recruit'}, {lbl: 'Status Query', end: 'recruit-status'}] },
  { id: 'outreach', lbl: 'OUTREACH HUB', sub: 'Port 3021', stat: 'ACTIVE', x: 36, y: 44, c: 'var(--pink)', icon: 'mega', acts: [] },
  { id: 'bridge', lbl: 'BRIDGE', sub: 'Port 9999', stat: 'ACTIVE', x: 34, y: 18, c: 'var(--cyan)', icon: 'chain', acts: [{lbl: 'Ping Gateway', end: 'ping'}, {lbl: 'Status Check', end: 'status'}] },
  { id: 'api_server', lbl: 'OMEGA API GATE', sub: 'Port 5001', stat: 'OFFLINE', x: 44, y: 31, c: 'var(--amber)', icon: 'shield', acts: [{lbl: 'Run API Server', end: 'run-api-server'}, {lbl: 'Build API', end: 'build-api-server'}, {lbl: 'Status Check', end: 'api-server-status'}] },
  { id: 'omega', lbl: 'OMEGA', sub: 'Port 3000', stat: 'OFFLINE', x: 54, y: 16, c: 'var(--cyan)', icon: 'fractal', acts: [{lbl: 'Run Omega', end: 'run-omega'}, {lbl: 'Open UI', end: 'open-omega'}, {lbl: 'Build Ops', end: 'build-omega'}, {lbl: 'Status Query', end: 'status'}] },
  { id: 'sally', lbl: 'SALLY', sub: 'Port 3005', stat: 'ACTIVE', x: 73, y: 22, c: 'var(--amber)', icon: 'crown', acts: [{lbl: 'Run Sally', end: 'run-sally'}, {lbl: 'Open UI', end: 'open-sally'}, {lbl: 'Build Rec', end: 'build-sally'}, {lbl: 'Status Query', end: 'sally-status'}] },
  { id: 'sally_git', lbl: 'SALLY GIT', sub: 'Repository: Sally', stat: 'UNINITIALIZED', x: 29, y: 62, c: 'var(--amber)', icon: 'branch', acts: [] },
  { id: 'git_stat', lbl: 'GIT STATUS', sub: 'Repository: Omega', stat: 'DIRTY', x: 49, y: 63, c: 'var(--green)', icon: 'branch', acts: [{lbl: 'Check Git', end: 'git-check'}] },
  { id: 'telegram_agent', lbl: 'TELEGRAM AGENT', sub: 'Daemon Engine', stat: 'STANDBY', x: 64, y: 28, c: 'var(--purple)', icon: 'gear', acts: [{lbl: 'Start Agent', end: 'telegram-start'}, {lbl: 'Stop Agent', end: 'telegram-stop'}, {lbl: 'Health Check', end: 'telegram-health'}, {lbl: 'View Logs', end: 'telegram-logs'}] },
  { id: 'analytics', lbl: 'ANALYTICS', sub: 'Port 3822', stat: 'ACTIVE', x: 64, y: 43, c: 'var(--amber)', icon: 'graph', acts: [] },
  { id: 'data_core', lbl: 'DATA CORE', sub: 'Port 3823', stat: 'ACTIVE', x: 80, y: 50, c: 'var(--white)', icon: 'db', acts: [] },
  { id: 'anti', lbl: 'ANTIGRAVITY', sub: 'Port 3010', stat: 'ACTIVE', x: 86, y: 33, c: 'var(--purple)', icon: 'tri', acts: [] },
  { id: 'security', lbl: 'SECURITY GRID', sub: 'Port 3025', stat: 'ACTIVE', x: 71, y: 65, c: 'var(--red)', icon: 'shield', acts: [] },
  { id: 'automation', lbl: 'AUTOMATION', sub: 'Port 3024', stat: 'ACTIVE', x: 88, y: 65, c: 'var(--blue)', icon: 'gear', acts: [] },
  { id: 'runtime', lbl: 'NEXUS RUNTIME', sub: 'Telemetry Core', stat: 'ACTIVE', x: 50, y: 44, c: 'var(--cyan)', icon: 'db', acts: [{lbl: 'Open Timeline', end: 'runtime-open'}] }
];

const DATA_LANES = [
  { from: 'bridge', to: 'api_server', cx1: -10, cy1: 8 },
  { from: 'api_server', to: 'omega', cx1: 15, cy1: -10 },
  { from: 'bridge', to: 'recruit', cx1: -25, cy1: -12 },
  { from: 'omega', to: 'sally', cx1: 15, cy1: -10 },
  { from: 'sally', to: 'anti', cx1: 15, cy1: 15 },
  { from: 'anti', to: 'data_core', cx1: -8, cy1: -15 },
  { from: 'data_core', to: 'automation', cx1: 10, cy1: 20 },
  { from: 'automation', to: 'security', cx1: -10, cy1: 18 },
  { from: 'omega', to: 'analytics', cx1: 12, cy1: -5 },
  { from: 'analytics', to: 'data_core', cx1: 15, cy1: 8 },
  { from: 'outreach', to: 'sally_git', cx1: -20, cy1: 20 },
  { from: 'sally_git', to: 'git_stat', cx1: 8, cy1: -12 },
  { from: 'recruit', to: 'outreach', cx1: -12, cy1: 18 },
  { from: 'git_stat', to: 'analytics', cx1: 10, cy1: -12 },
  { from: 'bridge', to: 'telegram_agent', cx1: 10, cy1: 8 },
  { from: 'telegram_agent', to: 'omega', cx1: -5, cy1: -10 },
  { from: 'telegram_agent', to: 'runtime', cx1: 5, cy1: 8 },
  { from: 'runtime', to: 'omega', cx1: -5, cy1: -12 },
  { from: 'api_server', to: 'runtime', cx1: -10, cy1: 12 }
];

const SVG_ICONS: Record<string, React.ReactElement> = {
  chain: (
    <svg viewBox="0 0 24 24"><path d="M17 7h-4v2h4c1.65 0 3 1.35 3 3s-1.35 3-3 3h-4v2h4c2.76 0 5-2.24 5-5s-2.24-5-5-5zm-6 8H7c-1.65 0-3-1.35-3-3s1.35-3 3-3h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-2zm-3-4h8v2H8z"/></svg>
  ),
  user: (
    <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
  ),
  mega: (
    <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6L4.83 15.17 4 16V4h14v10z"/></svg>
  ),
  branch: (
    <svg viewBox="0 0 24 24"><path d="M19 8c0-2.21-1.79-4-4-4s-4 1.79-4 4c0 1.86 1.28 3.41 3 3.86V15c0 1.65-1.35 3-3 3s-3-1.35-3-3V9.14c1.72-.45 3-2 3-3.86a6 6 0 1 0-7 5.86V15c0 2.76 2.24 5 5 5s5-2.24 5-5v-3.14c1.72-.45 3-2 3-3.86z"/></svg>
  ),
  graph: (
    <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/></svg>
  ),
  tri: (
    <svg viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 4l7.53 14H4.47L12 6z"/></svg>
  ),
  db: (
    <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 4.24 2 7v10c0 2.76 4.48 5 10 5s10-2.24 10-5V7c0-2.76-4.48-5-10-5zm0 2c4.28 0 8 1.61 8 3s-3.72 3-8 3-8-1.61-8-3 3.72-3 8-3z"/></svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.43-3 8.6-7 9.72-4-1.12-7-5.29-7-9.72v-4.7l7-3.12z"/></svg>
  ),
  gear: (
    <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
  ),
  crown: (
    <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
  ),
  fractal: (
    <svg viewBox="0 0 24 24"><path d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10z"/></svg>
  )
};

function App() {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  const [omegaStatus, setOmegaStatus] = useState<SystemStatus>({
    systemId: 'omega-ops',
    label: 'Omega Ops',
    status: 'offline',
    checkedAt: new Date().toISOString(),
    message: 'Initializing health telemetry...'
  });

  const [nodes, setNodes] = useState<NodeConfig[]>(INITIAL_NODES);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  const [cpuUsage, setCpuUsage] = useState(28.7);
  const [ramLoad, setRamLoad] = useState(42.9);

  // Dynamic status states for bridge connection
  const [bridgeOnline, setBridgeOnline] = useState<boolean>(false);
  const [telegramError, setTelegramError] = useState<string | null>(null);

  // Floating Launcher States
  const [isLauncherCollapsed, setIsLauncherCollapsed] = useState(false);
  const [launcherOffset, setLauncherOffset] = useState<{ x: number; y: number } | null>(null);
  const [launcherCoords, setLauncherCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Sync refs to avoid stale closures in canvas loops
  const nodesRef = useRef(nodes);
  const focusedNodeIdRef = useRef(focusedNodeId);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    focusedNodeIdRef.current = focusedNodeId;
  }, [focusedNodeId]);

  const [logs, setLogs] = useState<LogMessage[]>([
    { time: '12:04:30 PM', msg: 'System verification initialized: D:\\NEXUS\\PROJECTS\\omega-ops-dashboard', type: 'system' },
    { time: '12:06:40 PM', msg: 'Merge completed: origin/work/omega-policies integrated cleanly into main', type: 'info' },
    { time: '12:07:06 PM', msg: 'Vite build completed: omega-dashboard UI compiled (dist/index.html 0.76 kB)', type: 'info' },
    { time: '12:09:39 PM', msg: 'Merge completed: origin/work/omega-telegram-tasks-runtime integrated cleanly', type: 'info' },
    { time: '12:10:07 PM', msg: 'Vite build completed: omega-dashboard compiled successfully (1.59 MB bundle)', type: 'info' },
    { time: '12:10:36 PM', msg: 'Merge completed: origin/work/omega-utility-scripts integrated cleanly', type: 'info' },
    { time: '12:12:34 PM', msg: 'Push succeeded: Local main branch pushed to origin (0bb1c93..e9f972e)', type: 'info' },
    { time: '12:31:21 PM', msg: 'Project initialized: D:\\NEXUS\\PROJECTS\\nexus-command-center Galaxy Command Center', type: 'alert' },
    { time: '12:33:49 PM', msg: 'Package setup completed: react/react-dom dependencies configured', type: 'system' },
  ]);

  // Safe Bridge API Fetch Helper
  const callBridgeAPI = async (endpoint: string, method: string = 'GET', body?: any) => {
    try {
      const res = await fetch(`http://localhost:9999/api/${endpoint}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        mode: 'cors'
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await res.json();
        }
        return await res.text();
      }
    } catch (err) {
      console.warn(`Bridge call failed for ${endpoint}:`, err);
    }
    return null;
  };

  const getNodeUrl = (id: string): string | null => {
    switch (id) {
      case 'omega':
        return 'http://127.0.0.1:3000';
      case 'recruit':
        return 'http://127.0.0.1:3820';
      case 'api_server':
        return 'http://127.0.0.1:5001/api/healthz';
      case 'telegram_agent':
        return 'http://localhost:9999/api/telegram-status';
      case 'bridge':
        return 'http://localhost:9999/api/ping';
      default:
        return null;
    }
  };

  const fetchOmegaHealth = async () => {
    setIsRefreshing(true);
    
    // Direct Omega health check
    const result = await checkOmegaStatus();
    setOmegaStatus(result);

    // Call Bridge Telemetry
    const pingRes = await callBridgeAPI('ping');
    const isBridgeUp = pingRes === 'SYSTEM ONLINE';
    setBridgeOnline(isBridgeUp);
    
    let sysLogMsg = `Telemetry Poll - Bridge Daemon: ${isBridgeUp ? 'ONLINE' : 'OFFLINE'}`;

    if (isBridgeUp) {
      // 1. RAM load from /sys
      const ramRes = await callBridgeAPI('sys');
      if (ramRes && !isNaN(parseFloat(ramRes))) {
        setRamLoad(parseFloat(parseFloat(ramRes).toFixed(1)));
      }

      // 2. Recruit Status
      const recruitStatus = await callBridgeAPI('recruit-status');
      let recruitStatStr = 'STANDBY';
      if (recruitStatus && typeof recruitStatus === 'object') {
        recruitStatStr = recruitStatus.isRunning ? 'ACTIVE' : 'OFFLINE';
      }

      // 3. API Server Status
      const apiStatus = await callBridgeAPI('api-server-status');
      let apiStatStr = 'OFFLINE';
      if (apiStatus && typeof apiStatus === 'object') {
        apiStatStr = apiStatus.isRunning ? 'ACTIVE' : 'OFFLINE';
      }

      // 4. Telegram status
      const telStatus = await callBridgeAPI('telegram-status');
      let telStatStr = 'STANDBY';
      if (telStatus && typeof telStatus === 'object') {
        telStatStr = telStatus.running ? 'ACTIVE' : 'STOPPED';
        if (telStatus.last_log_lines) {
          const errors = telStatus.last_log_lines.filter((l: string) => l.toLowerCase().includes('error') || l.toLowerCase().includes('exception'));
          if (errors.length > 0) {
            const cleanErr = errors[errors.length - 1].replace(/\d{8,10}:[A-Za-z0-9_-]{35,45}/g, '<REDACTED_TOKEN>');
            setTelegramError(cleanErr);
          } else {
            setTelegramError(null);
          }
        }
      }

      // 5. Git Status check
      const gitRes = await callBridgeAPI('git-check');
      let gitStatStr = 'UNKNOWN';
      if (gitRes && typeof gitRes === 'string') {
        if (gitRes.toLowerCase().includes('working tree clean')) {
          gitStatStr = 'CLEAN';
        } else if (gitRes.toLowerCase().includes('changes to be committed') || gitRes.toLowerCase().includes('changes not staged for commit') || gitRes.toLowerCase().includes('untracked files')) {
          gitStatStr = 'DIRTY';
        }
      }

      // Update nodes dynamically
      setNodes(prev => prev.map(n => {
        switch (n.id) {
          case 'bridge':
            return { ...n, stat: 'ACTIVE' };
          case 'recruit':
            return { ...n, stat: recruitStatStr };
          case 'api_server':
            return { ...n, stat: apiStatStr };
          case 'telegram_agent':
            return { ...n, stat: telStatStr };
          case 'git_stat':
            return { ...n, stat: gitStatStr };
          case 'omega':
            return { ...n, stat: result.status.toUpperCase() };
          default:
            return n;
        }
      }));
    } else {
      // Bridge daemon offline
      setNodes(prev => prev.map(n => {
        if (['bridge', 'recruit', 'api_server', 'telegram_agent', 'git_stat'].includes(n.id)) {
          return { ...n, stat: n.id === 'bridge' ? 'OFFLINE' : 'UNAVAILABLE' };
        }
        if (n.id === 'omega') {
          return { ...n, stat: result.status.toUpperCase() };
        }
        return n;
      }));
      setTelegramError('NEXUS Bridge Daemon is offline.');
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    const statusLabel = result.status.toUpperCase();
    const logMsg = `Telemetry Poll - Omega Ops: ${statusLabel} (${result.responseMs !== undefined ? `${result.responseMs}ms` : 'unreachable'}) - ${result.message}`;
    
    setLogs(prev => [
      ...prev,
      { time: timeStr, msg: logMsg, type: result.status === 'online' ? 'info' : 'alert' },
      { time: timeStr, msg: sysLogMsg, type: isBridgeUp ? 'system' : 'alert' }
    ]);
    
    setIsRefreshing(false);
  };

  const handleExecute = async (action: string, componentLabel: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    let message = '';
    let type: 'info' | 'system' | 'alert' = 'info';

    let endpoint = '';
    switch (action) {
      case 'telegram-start':
      case 'run-telegram':
        endpoint = 'run-telegram';
        break;
      case 'telegram-stop':
      case 'stop-telegram':
        endpoint = 'stop-telegram';
        break;
      case 'restart-telegram':
        endpoint = 'restart-telegram';
        break;
      case 'telegram-logs':
        endpoint = 'telegram-logs';
        break;
      case 'telegram-health':
        endpoint = 'telegram-status';
        break;

      case 'run-recruit':
      case 'run-recruitment':
        endpoint = 'run-recruitment';
        break;
      case 'open-recruit':
      case 'open-recruitment':
        endpoint = 'open-recruitment';
        break;
      case 'build-recruit':
      case 'build-recruitment':
        endpoint = 'build-recruitment';
        break;
      case 'recruit-status':
      case 'recruitment-status':
        endpoint = 'recruit-status';
        break;

      case 'run-api-server':
        endpoint = 'run-api-server';
        break;
      case 'build-api-server':
        endpoint = 'build-api-server';
        break;
      case 'api-server-status':
        endpoint = 'api-server-status';
        break;

      case 'run-omega':
        endpoint = 'run-omega';
        break;
      case 'open-omega':
        endpoint = 'open-omega';
        break;
      case 'build-omega':
        endpoint = 'build-omega';
        break;
      case 'omega-status':
      case 'status':
        endpoint = 'status';
        break;
      case 'launch-omega':
        endpoint = 'launch-omega';
        break;

      case 'git-check':
        endpoint = 'git-check';
        break;

      default:
        break;
    }

    if (endpoint) {
      message = `DISPATCHING COMMAND: [${action}] to ${componentLabel}...`;
      setLogs(prev => [
        { time: timeStr, msg: message, type: 'system' },
        ...prev.slice(0, 19)
      ]);

      const res = await callBridgeAPI(endpoint);
      const doneTime = new Date().toLocaleTimeString();
      if (res !== null) {
        let displayRes = typeof res === 'object' ? JSON.stringify(res) : String(res);
        displayRes = displayRes.replace(/\d{8,10}:[A-Za-z0-9_-]{35,45}/g, '<REDACTED_TOKEN>');
        
        if (displayRes.length > 120) {
          displayRes = displayRes.substring(0, 120) + '...';
        }
        
        setLogs(prev => [
          { time: doneTime, msg: `COMMAND RESPONSE: ${displayRes}`, type: 'info' },
          ...prev.slice(0, 19)
        ]);

        await fetchOmegaHealth();
      } else {
        setLogs(prev => [
          { time: doneTime, msg: `COMMAND FAILED: Bridge daemon did not respond or returned error.`, type: 'alert' },
          ...prev.slice(0, 19)
        ]);
      }
    } else {
      message = `Payload dispatched (Simulation): [${action}] to target [${componentLabel}].`;
      setLogs(prev => [
        { time: timeStr, msg: message, type },
        ...prev.slice(0, 19)
      ]);
    }
  };

  // Clock Update Effect
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString());
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    // Initial health check
    fetchOmegaHealth();

    return () => clearInterval(interval);
  }, []);

  // CPU/RAM Live Flutter simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(prev => {
        const change = (Math.random() - 0.5) * 4;
        const next = Math.max(10, Math.min(90, prev + change));
        return parseFloat(next.toFixed(1));
      });
      setRamLoad(prev => {
        const change = (Math.random() - 0.5) * 1.5;
        const next = Math.max(30, Math.min(80, prev + change));
        return parseFloat(next.toFixed(1));
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // 15 seconds polling for Omega health check
  useEffect(() => {
    const poll = setInterval(() => {
      fetchOmegaHealth();
    }, 15000);
    return () => clearInterval(poll);
  }, []);

  // Drag handlers for Launch Controller
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Left click only
    setIsDragging(true);
    setLauncherOffset({
      x: e.clientX - launcherCoords.x,
      y: e.clientY - launcherCoords.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !launcherOffset) return;
      setLauncherCoords({
        x: e.clientX - launcherOffset.x,
        y: e.clientY - launcherOffset.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setLauncherOffset(null);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, launcherOffset]);

  // Starfield & Data matrix Drawing Canvas Effect
  useEffect(() => {
    const sCvs = document.getElementById('stars-canvas') as HTMLCanvasElement | null;
    const dCvs = document.getElementById('data-canvas') as HTMLCanvasElement | null;
    if (!sCvs || !dCvs) return;

    const sCtx = sCvs.getContext('2d');
    const dCtx = dCvs.getContext('2d');
    if (!sCtx || !dCtx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      sCvs.width = w;
      sCvs.height = h;
      dCvs.width = w;
      dCvs.height = h;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize stars
    const stars: { x: number; y: number; r: number; a: number; s: number }[] = [];
    for (let i = 0; i < 130; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.05,
        a: Math.random(),
        s: 0.0007 + Math.random() * 0.0008
      });
    }

    let spaceFrameId: number;
    const renderSpace = () => {
      sCtx.fillStyle = '#010204';
      sCtx.fillRect(0, 0, w, h);

      // Nebula 1 (Cyan)
      const grad1 = sCtx.createRadialGradient(w * 0.35, h * 0.35, 0, w * 0.35, h * 0.35, w * 0.6);
      grad1.addColorStop(0, 'rgba(0, 80, 160, 0.065)');
      grad1.addColorStop(0.6, 'rgba(0, 40, 80, 0.02)');
      grad1.addColorStop(1, 'rgba(0,0,0,0)');
      sCtx.fillStyle = grad1;
      sCtx.fillRect(0, 0, w, h);

      // Nebula 2 (Purple)
      const grad2 = sCtx.createRadialGradient(w * 0.75, h * 0.6, 0, w * 0.75, h * 0.6, w * 0.55);
      grad2.addColorStop(0, 'rgba(120, 0, 180, 0.045)');
      grad2.addColorStop(0.65, 'rgba(60, 0, 90, 0.01)');
      grad2.addColorStop(1, 'rgba(0,0,0,0)');
      sCtx.fillStyle = grad2;
      sCtx.fillRect(0, 0, w, h);

      // Stars
      sCtx.fillStyle = '#fff';
      stars.forEach(s => {
        s.a += s.s;
        if (s.a > 1 || s.a < 0) s.s = -s.s;
        sCtx.globalAlpha = Math.abs(s.a);
        sCtx.beginPath();
        sCtx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        sCtx.fill();
      });
      sCtx.globalAlpha = 1.0;
      spaceFrameId = requestAnimationFrame(renderSpace);
    };

    let matrixFrameId: number;
    let pulses: { p: number; s: number; p1: { x: number; y: number }; p2: { x: number; y: number }; midX: number; midY: number; color: string }[] = [];
    let pipeDashOffset = 0;

    const drawMatrix = () => {
      dCtx.clearRect(0, 0, w, h);

      DATA_LANES.forEach(lane => {
        const n1 = nodesRef.current.find(o => o.id === lane.from);
        const n2 = nodesRef.current.find(o => o.id === lane.to);
        if (!n1 || !n2) return;

        const p1 = { x: (n1.x / 100) * w, y: (n1.y / 100) * h };
        const p2 = { x: (n2.x / 100) * w, y: (n2.y / 100) * h };

        const midX = (p1.x + p2.x) / 2 + (lane.cx1 * (w / 1366));
        const midY = (p1.y + p2.y) / 2 + (lane.cy1 * (h / 768));

        const isActive = (focusedNodeIdRef.current && (lane.from === focusedNodeIdRef.current || lane.to === focusedNodeIdRef.current));
        
        // Extract color hex code
        const coreColorProp = n1.c.replace('var(', '').replace(')', '');
        let baseColor = '#00d2ff';
        if (coreColorProp === '--green') baseColor = '#00e676';
        else if (coreColorProp === '--amber') baseColor = '#ffab00';
        else if (coreColorProp === '--purple') baseColor = '#d500f9';
        else if (coreColorProp === '--red') baseColor = '#ff1744';
        else if (coreColorProp === '--blue') baseColor = '#2979ff';
        else if (coreColorProp === '--white') baseColor = '#e0f7fa';
        else if (coreColorProp === '--pink') baseColor = '#ff4081';

        // Hose conduit layer
        dCtx.strokeStyle = baseColor;
        dCtx.lineWidth = isActive ? 2.2 : 1.2;
        dCtx.globalAlpha = isActive ? 0.4 : 0.08;
        dCtx.beginPath();
        dCtx.moveTo(p1.x, p1.y);
        dCtx.quadraticCurveTo(midX, midY, p2.x, p2.y);
        dCtx.stroke();

        // Moving fluid dashed current
        dCtx.strokeStyle = baseColor;
        dCtx.lineWidth = isActive ? 1.5 : 1.0;
        dCtx.globalAlpha = isActive ? 0.75 : 0.35;
        dCtx.setLineDash([4, 10]);
        dCtx.lineDashOffset = -pipeDashOffset;
        dCtx.beginPath();
        dCtx.moveTo(p1.x, p1.y);
        dCtx.quadraticCurveTo(midX, midY, p2.x, p2.y);
        dCtx.stroke();
        dCtx.setLineDash([]);
        dCtx.globalAlpha = 1.0;

        if (Math.random() < 0.005) {
          pulses.push({
            p: 0,
            s: 0.004 + Math.random() * 0.005,
            p1,
            p2,
            midX,
            midY,
            color: baseColor
          });
        }
      });

      pipeDashOffset = (pipeDashOffset + 0.25) % 14;

      // Photon Render
      pulses = pulses.filter(pkt => {
        pkt.p += pkt.s;
        if (pkt.p >= 1) return false;

        const t = pkt.p;
        const cx = (1 - t) * (1 - t) * pkt.p1.x + 2 * (1 - t) * t * pkt.midX + t * t * pkt.p2.x;
        const cy = (1 - t) * (1 - t) * pkt.p1.y + 2 * (1 - t) * t * pkt.midY + t * t * pkt.p2.y;

        // Flare core
        dCtx.fillStyle = '#fff';
        dCtx.shadowColor = pkt.color;
        dCtx.shadowBlur = 12;
        dCtx.beginPath();
        dCtx.arc(cx, cy, 2.4, 0, Math.PI * 2);
        dCtx.fill();

        // Tail Glow Flare
        dCtx.fillStyle = pkt.color;
        dCtx.globalAlpha = 0.5;
        dCtx.beginPath();
        dCtx.arc(cx, cy, 4.5, 0, Math.PI * 2);
        dCtx.fill();
        dCtx.globalAlpha = 1.0;
        dCtx.shadowBlur = 0;

        return true;
      });

      matrixFrameId = requestAnimationFrame(drawMatrix);
    };

    renderSpace();
    drawMatrix();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(spaceFrameId);
      cancelAnimationFrame(matrixFrameId);
    };
  }, []);

  // Sine Wave Canvas drawing Effect
  useEffect(() => {
    let waveCount = 0;
    let waveTimeout: number;

    const drawWaves = () => {
      const w1 = document.getElementById('header-wave') as HTMLCanvasElement | null;
      if (w1) {
        const c1 = w1.getContext('2d');
        if (c1) {
          w1.width = 60;
          w1.height = 10;
          c1.strokeStyle = '#00d2ff';
          c1.lineWidth = 1;
          c1.clearRect(0, 0, 60, 10);
          c1.beginPath();
          for (let i = 0; i < 60; i++) {
            c1.lineTo(i, 5 + Math.sin(i * 0.2 + waveCount) * 3.5);
          }
          c1.stroke();
        }
      }

      const w2 = document.getElementById('footer-wave') as HTMLCanvasElement | null;
      if (w2) {
        const c2 = w2.getContext('2d');
        if (c2) {
          w2.width = 50;
          w2.height = 8;
          c2.strokeStyle = '#00d2ff';
          c2.lineWidth = 1;
          c2.clearRect(0, 0, 50, 8);
          c2.beginPath();
          for (let i = 0; i < 50; i++) {
            c2.lineTo(i, 4 + Math.sin(i * 0.3 + waveCount) * 2.5);
          }
          c2.stroke();
        }
      }

      const w3 = document.getElementById('metrics-wave') as HTMLCanvasElement | null;
      if (w3) {
        const c3 = w3.getContext('2d');
        if (c3) {
          w3.width = 200;
          w3.height = 8;
          c3.strokeStyle = '#00d2ff';
          c3.lineWidth = 1;
          c3.clearRect(0, 0, 200, 8);
          c3.beginPath();
          for (let i = 0; i < 200; i++) {
            c3.lineTo(i, 4 + Math.sin(i * 0.1 + waveCount) * 2);
          }
          c3.stroke();
        }
      }

      waveCount += 0.15;
      waveTimeout = window.setTimeout(drawWaves, 50);
    };

    drawWaves();

    return () => {
      clearTimeout(waveTimeout);
    };
  }, []);

  const focusedNode = nodes.find(n => n.id === focusedNodeId);

  return (
    <div className="app-container" onClick={() => setFocusedNodeId(null)}>
      {/* Background Starfield and Data Pipelines Canvas */}
      <canvas id="stars-canvas" />
      <canvas id="data-canvas" />

      {/* HEADER HUD */}
      <header className="app-header">
        <div 
          className="brand-group" 
          style={{ cursor: 'pointer' }}
          onClick={() => window.open('http://127.0.0.1:5177', '_blank')}
        >
          <span className="brand-title">NEXUS</span>
          <span className="brand-subtitle">HUB COMMANDER // CONTROL CENTER</span>
        </div>

        <div className="top-metrics">
          <div className="t-met">
            <span>SYSTEM MODE</span>
            <b style={{ color: 'var(--cyan)' }}>ONLINE</b>
          </div>
          <div className="t-met">
            <span>OMEGA STATUS</span>
            <b style={{ color: omegaStatus.status === 'online' ? 'var(--green)' : 'var(--red)' }}>
              {omegaStatus.status.toUpperCase()}
            </b>
          </div>
          <div className="t-met" style={{ minWidth: '70px' }}>
            <span>OMEGA MS</span>
            <b style={{ color: omegaStatus.status === 'online' ? 'var(--green)' : 'var(--text-muted)' }}>
              {omegaStatus.responseMs !== undefined ? `${omegaStatus.responseMs}ms` : '—'}
            </b>
          </div>
          <canvas id="header-wave" className="wave-canvas" style={{ marginLeft: '10px' }} />
        </div>

        <div className="clock-sec">
          <div className="clock-meta">
            <div className="clock-time">{currentTime || '06:30:45 PM'}</div>
            <div className="clock-date">{currentDate || 'MONDAY, MAY 12, 2026'}</div>
          </div>
          <div 
            className="settings-ico" 
            onClick={() => { if (!isRefreshing) fetchOmegaHealth(); }} 
            title={isRefreshing ? "Polling Telemetry..." : "Force Telemetry Poll"}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </div>
        </div>
      </header>

      {/* LEFT STATUS RAIL */}
      <div className="left-dashboard">
        {/* Bridge Status */}
        <div 
          className="glass-panel left-hud-card" 
          tabIndex={0} 
          role="button" 
          onClick={(e) => { e.stopPropagation(); setFocusedNodeId('bridge'); }}
        >
          <div className="panel-header-row">
            <span className="p-lbl">BRIDGE STATUS</span>
            <div className="p-dot" style={{ 
              background: bridgeOnline ? 'var(--cyan)' : 'var(--red)', 
              boxShadow: bridgeOnline ? '0 0 6px var(--cyan)' : '0 0 6px var(--red)' 
            }} />
          </div>
          <div className="metric-val">{bridgeOnline ? 'CONNECTED' : 'OFFLINE'}</div>
          <div className="metric-sub">{bridgeOnline ? 'Bridge Core Online & Stable' : 'Bridge Core Daemon Unreachable'}</div>
          <button className="card-open-btn" onClick={(e) => { e.stopPropagation(); window.open('http://localhost:9999/api/ping', '_blank'); }}>OPEN</button>
          <div className="hud-strip" style={{ background: 'var(--cyan)' }} />
        </div>

        {/* System Metrics */}
        <div 
          className="glass-panel left-hud-card" 
          tabIndex={0} 
          role="button"
          onClick={(e) => { e.stopPropagation(); setFocusedNodeId('analytics'); }}
        >
          <div className="panel-header-row">
            <span className="p-lbl">SYSTEM METRICS</span>
            <div className="p-dot" style={{ background: 'var(--cyan)', boxShadow: '0 0 6px var(--cyan)' }} />
          </div>
          <div style={{ marginBottom: '6px' }}>
            <div className="panel-header-row" style={{ marginBottom: '2px' }}>
              <span className="p-lbl" style={{ fontSize: '0.45rem', color: '#8a99ad' }}>RAM LOAD</span>
              <span style={{ fontSize: '0.55rem', fontWeight: 'bold', color: '#fff' }}>{ramLoad} %</span>
            </div>
            <div className="prog-bar"><div className="prog-inner" style={{ width: `${ramLoad}%` }} /></div>
          </div>
          <div style={{ marginBottom: '6px' }}>
            <div className="panel-header-row" style={{ marginBottom: '2px' }}>
              <span className="p-lbl" style={{ fontSize: '0.45rem', color: '#8a99ad' }}>CPU USAGE</span>
              <span style={{ fontSize: '0.55rem', fontWeight: 'bold', color: '#fff' }}>{cpuUsage} %</span>
            </div>
            <div className="prog-bar"><div className="prog-inner" style={{ width: `${cpuUsage}%` }} /></div>
          </div>
          <canvas id="metrics-wave" style={{ width: '100%', height: '8px', marginTop: '4px', opacity: 0.45 }} />
          <button className="card-open-btn" onClick={(e) => { e.stopPropagation(); setFocusedNodeId('analytics'); }}>OPEN</button>
          <div className="hud-strip" style={{ background: 'var(--cyan)' }} />
        </div>

        {/* Omega Live Feed */}
        <div 
          className="glass-panel left-hud-card" 
          tabIndex={0} 
          role="button"
          onClick={(e) => { e.stopPropagation(); setFocusedNodeId('omega'); }}
        >
          <div className="panel-header-row">
            <span className="p-lbl">OMEGA LIVE FEED</span>
            <div className={`p-dot ${omegaStatus.status}`} />
          </div>
          <div style={{ fontSize: '0.45rem', lineHeight: 1.4 }}>
            <div>PORT: <span style={{ color: omegaStatus.status === 'online' ? 'var(--green)' : 'var(--red)', fontWeight: 'bold' }}>{omegaStatus.status.toUpperCase()}</span></div>
            <div>GIT: <span style={{ color: 'var(--amber)', fontWeight: 'bold' }}>DIRTY</span></div>
            <div style={{ color: '#5b7089', fontSize: '0.42rem', margin: '2px 0' }}>fe368d9 chore: remove invalid</div>
            <div style={{ fontSize: '0.42rem', color: '#445467' }}>
              LAST SYNC: {omegaStatus.checkedAt.substring(11, 19)} UTC
            </div>
          </div>
          <button className="card-open-btn" onClick={(e) => { e.stopPropagation(); window.open('http://127.0.0.1:3000', '_blank'); }}>OPEN</button>
          <div className="hud-strip" style={{ background: omegaStatus.status === 'online' ? 'var(--green)' : 'var(--red)' }} />
        </div>

        {/* Omega API Gate */}
        <div 
          className="glass-panel left-hud-card" 
          tabIndex={0} 
          role="button"
          onClick={(e) => { e.stopPropagation(); setFocusedNodeId('api_server'); }}
        >
          <div className="panel-header-row">
            <span className="p-lbl">OMEGA API GATE</span>
            <div className={`p-dot ${omegaStatus.status === 'online' ? 'online' : 'offline'}`} />
          </div>
          <div style={{ fontSize: '0.45rem', lineHeight: 1.4 }}>
            <div>PORT: <span style={{ color: omegaStatus.status === 'online' ? 'var(--green)' : 'var(--red)', fontWeight: 'bold' }}>{omegaStatus.status === 'online' ? 'ACTIVE' : 'OFFLINE'}</span></div>
            <div>SECURE: <span style={{ color: 'var(--cyan)', fontWeight: 'bold' }}>ACTIVE</span></div>
            <div style={{ color: '#5b7089', fontSize: '0.42rem', margin: '2px 0' }}>ROUTE: /api/healthz</div>
            <div style={{ fontSize: '0.42rem', color: '#445467' }}>LAST CHECK: {omegaStatus.checkedAt.substring(11, 19)} UTC</div>
          </div>
          <button className="card-open-btn" onClick={(e) => { e.stopPropagation(); window.open('http://127.0.0.1:5001/api/healthz', '_blank'); }}>OPEN</button>
          <div className="hud-strip" style={{ background: omegaStatus.status === 'online' ? 'var(--amber)' : 'var(--red)' }} />
        </div>

        {/* Recruit Hub Feed */}
        <div 
          className="glass-panel left-hud-card" 
          tabIndex={0} 
          role="button"
          onClick={(e) => { e.stopPropagation(); setFocusedNodeId('recruit'); }}
        >
          <div className="panel-header-row">
            <span className="p-lbl">RECRUIT HUB FEED</span>
            <div className="p-dot" style={{ 
              background: nodes.find(n => n.id === 'recruit')?.stat === 'ACTIVE' ? 'var(--green)' : 'var(--red)', 
              boxShadow: nodes.find(n => n.id === 'recruit')?.stat === 'ACTIVE' ? '0 0 6px var(--green)' : '0 0 6px var(--red)' 
            }} />
          </div>
          <div style={{ fontSize: '0.45rem', lineHeight: 1.4 }}>
            <div>PORT: <span style={{ 
              color: nodes.find(n => n.id === 'recruit')?.stat === 'ACTIVE' ? 'var(--green)' : 'var(--red)', 
              fontWeight: 'bold' 
            }}>{nodes.find(n => n.id === 'recruit')?.stat || 'STANDBY'}</span></div>
            <div>GIT: <span style={{ color: 'var(--green)', fontWeight: 'bold' }}>CLEAN</span></div>
            <div style={{ color: '#5b7089', fontSize: '0.42rem', margin: '2px 0' }}>PATH: <span style={{ color: 'var(--green)', fontWeight: 'bold' }}>READY</span></div>
            <div style={{ fontSize: '0.42rem', color: '#445467' }}>LAST CHECK: TELEMETRY</div>
          </div>
          <button className="card-open-btn" onClick={(e) => { e.stopPropagation(); window.open('http://127.0.0.1:3820', '_blank'); }}>OPEN</button>
          <div className="hud-strip" style={{ background: nodes.find(n => n.id === 'recruit')?.stat === 'ACTIVE' ? 'var(--green)' : 'var(--red)' }} />
        </div>

        {/* Nexus Runtime */}
        <div 
          className="glass-panel left-hud-card" 
          style={{ borderColor: 'rgba(0, 210, 255, 0.25)' }} 
          tabIndex={0} 
          role="button"
          onClick={(e) => { e.stopPropagation(); setFocusedNodeId('runtime'); }}
        >
          <div className="panel-header-row">
            <span className="p-lbl">NEXUS RUNTIME</span>
            <div className="p-dot" style={{ background: 'var(--cyan)', boxShadow: '0 0 6px var(--cyan)' }} />
          </div>
          <div style={{ fontSize: '0.45rem', lineHeight: 1.4 }}>
            <div>STATUS: <span style={{ color: 'var(--green)', fontWeight: 'bold' }}>ACTIVE</span></div>
            <div>TIMELINE: <span style={{ color: 'var(--cyan)', fontWeight: 'bold' }}>MONITORED</span></div>
            <div className="card-actions-wrapper" style={{ marginTop: '5px' }}>
              <button 
                className="drawer-btn" 
                style={{ padding: '4px', fontSize: '0.42rem', background: 'rgba(0, 210, 255, 0.08)' }} 
                onClick={(e) => { e.stopPropagation(); handleExecute('runtime-open-timeline', 'NEXUS RUNTIME'); }}
              >
                OPEN RUNTIME TIMELINE
              </button>
            </div>
          </div>
          <button className="card-open-btn" onClick={(e) => { e.stopPropagation(); window.open('http://localhost:3000/runtime-timeline', '_blank'); }}>OPEN</button>
          <div className="hud-strip" style={{ background: 'var(--cyan)' }} />
        </div>

        {/* Knowledge Core */}
        <div 
          className="glass-panel left-hud-card purple-theme" 
          style={{ borderColor: 'rgba(213, 0, 249, 0.25)' }} 
          tabIndex={0} 
          role="button"
          onClick={(e) => { e.stopPropagation(); setFocusedNodeId('anti'); }}
        >
          <div className="panel-header-row">
            <span className="p-lbl" style={{ color: '#d500f9' }}>KNOWLEDGE CORE</span>
            <div className="p-dot" style={{ background: 'var(--purple)', boxShadow: '0 0 6px var(--purple)' }} />
          </div>
          <div style={{ fontSize: '0.45rem', lineHeight: 1.4 }}>
            <div>CATALOG: <span style={{ color: '#fff', fontWeight: 'bold' }}>15 REPOS</span></div>
            <div>STATE: <span style={{ color: 'var(--cyan)', fontWeight: 'bold' }}>ONLINE</span></div>
            <div className="card-actions-wrapper" style={{ marginTop: '5px' }}>
              <button 
                className="drawer-btn" 
                style={{ padding: '4px', fontSize: '0.42rem', borderColor: 'rgba(213, 0, 249, 0.4)', color: '#d500f9', background: 'rgba(213, 0, 249, 0.05)' }} 
                onClick={(e) => { e.stopPropagation(); handleExecute('open-wiki', 'KNOWLEDGE CORE'); }}
              >
                LAUNCH WIKI HUD
              </button>
            </div>
          </div>
          <button className="card-open-btn" onClick={(e) => { e.stopPropagation(); window.open('http://localhost:9999/api/repo-library', '_blank'); }}>OPEN</button>
          <div className="hud-strip" style={{ background: 'var(--purple)' }} />
        </div>
      </div>

      {/* FLOATING LAUNCH CONTROLLER */}
      <div 
        className={`floating-launcher ${isLauncherCollapsed ? 'collapsed' : ''} ${isDragging ? 'dragging' : ''}`}
        style={{
          transform: `translate(${launcherCoords.x}px, ${launcherCoords.y}px)`
        }}
      >
        <div className="launcher-header" onMouseDown={handleDragStart}>
          <div className="launcher-title-group">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--cyan)"><path d="M12 2L2 22h20L12 2zm0 3.6l6.8 13.4H5.2L12 5.6z"/></svg>
            <span style={{ fontSize: '0.52rem', color: '#00d2ff', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase' }}>LAUNCH CONTROLLER</span>
          </div>
          <button 
            className="btn-toggle-launcher" 
            onClick={(e) => { e.stopPropagation(); setIsLauncherCollapsed(!isLauncherCollapsed); }} 
            title="Minimize/Maximize"
          >
            <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{isLauncherCollapsed ? '+' : '−'}</span>
          </button>
        </div>

        <div className="launcher-body">
          {/* OMEGA DEPLOYER */}
          <div className="launcher-section">
            <div className="launcher-sec-lbl">
              <span>OMEGA OPERATIONS</span>
              <span style={{ color: 'var(--cyan)' }}>PORT 3000</span>
            </div>
            <button className="btn-launch-primary" onClick={() => handleExecute('launch-omega', 'OMEGA OPERATIONS')}>LAUNCH OMEGA</button>
            <div className="sub-controls-grid">
              <button className="btn-sub-control" onClick={() => handleExecute('run-omega', 'OMEGA OPERATIONS')}>Run</button>
              <button className="btn-sub-control" onClick={() => handleExecute('open-omega', 'OMEGA OPERATIONS')}>Open</button>
              <button className="btn-sub-control" onClick={() => handleExecute('build-omega', 'OMEGA OPERATIONS')}>Build</button>
              <button className="btn-sub-control" onClick={() => handleExecute('omega-status', 'OMEGA OPERATIONS')}>Status</button>
            </div>
          </div>

          {/* OMEGA API GATEWAY DEPLOYER */}
          <div className="launcher-section" style={{ marginTop: '1.2rem' }}>
            <div className="launcher-sec-lbl">
              <span>OMEGA API GATEWAY</span>
              <span style={{ color: 'var(--amber)' }}>PORT 5001</span>
            </div>
            <button 
              className="btn-launch-primary" 
              style={{
                background: 'rgba(255, 171, 0, 0.05)',
                borderColor: 'rgba(255, 171, 0, 0.4)',
                color: '#FFAA00',
                textShadow: '0 0 6px rgba(255, 171, 0, 0.7)',
                boxShadow: '0 0 12px rgba(255, 171, 0, 0.2)'
              }}
              onClick={() => handleExecute('run-api-server', 'OMEGA API GATEWAY')}
            >
              RUN API SERVER
            </button>
            <div className="sub-controls-grid">
              <button className="btn-sub-control" onClick={() => handleExecute('run-api-server', 'OMEGA API GATEWAY')}>Run</button>
              <button className="btn-sub-control" onClick={() => handleExecute('api-server-status', 'OMEGA API GATEWAY')}>Status</button>
              <button className="btn-sub-control" onClick={() => handleExecute('build-api-server', 'OMEGA API GATEWAY')}>Build</button>
              <button className="btn-sub-control" onClick={() => handleExecute('api-server-status', 'OMEGA API GATEWAY')}>Query</button>
            </div>
          </div>

          {/* RECRUITMENT DEPLOYER */}
          <div className="launcher-section" style={{ marginTop: '1.2rem' }}>
            <div className="launcher-sec-lbl">
              <span>RECRUIT HQ</span>
              <span style={{ color: 'var(--green)' }}>PORT 3820</span>
            </div>
            <button className="btn-launch-primary recruit-theme" onClick={() => handleExecute('launch-recruitment', 'RECRUIT HQ')}>LAUNCH RECRUITMENT</button>
            <div className="sub-controls-grid">
              <button className="btn-sub-control" onClick={() => handleExecute('run-recruitment', 'RECRUIT HQ')}>Run</button>
              <button className="btn-sub-control" onClick={() => handleExecute('open-recruitment', 'RECRUIT HQ')}>Open</button>
              <button className="btn-sub-control" onClick={() => handleExecute('build-recruitment', 'RECRUIT HQ')}>Build</button>
              <button className="btn-sub-control" onClick={() => handleExecute('recruitment-status', 'RECRUIT HQ')}>Status</button>
            </div>
          </div>

          {/* TELEGRAM AGENT DEPLOYER */}
          <div className="launcher-section" style={{ marginTop: '1.2rem' }}>
            <div className="launcher-sec-lbl">
              <span>TELEGRAM AGENT</span>
              <span style={{ 
                color: nodes.find(n => n.id === 'telegram_agent')?.stat === 'ACTIVE' ? 'var(--green)' : 'var(--red)'
              }}>
                {nodes.find(n => n.id === 'telegram_agent')?.stat || 'STANDBY'}
              </span>
            </div>
            <button 
              className="btn-launch-primary" 
              style={{
                background: 'rgba(213, 0, 249, 0.05)',
                borderColor: 'rgba(213, 0, 249, 0.4)',
                color: '#D500F9',
                textShadow: '0 0 6px rgba(213, 0, 249, 0.7)',
                boxShadow: '0 0 12px rgba(213, 0, 249, 0.2)'
              }}
              onClick={() => handleExecute('run-telegram', 'TELEGRAM AGENT')}
            >
              START TELEGRAM
            </button>
            <div className="sub-controls-grid">
              <button className="btn-sub-control" onClick={() => handleExecute('run-telegram', 'TELEGRAM AGENT')}>Start</button>
              <button className="btn-sub-control" onClick={() => handleExecute('restart-telegram', 'TELEGRAM AGENT')}>Restart</button>
              <button className="btn-sub-control" onClick={() => handleExecute('stop-telegram', 'TELEGRAM AGENT')}>Stop</button>
              <button className="btn-sub-control" onClick={() => handleExecute('telegram-logs', 'TELEGRAM AGENT')}>Logs</button>
            </div>
            {telegramError && (
              <div className="telegram-error-hud" style={{ 
                marginTop: '6px', 
                fontSize: '0.42rem', 
                color: 'var(--red)', 
                background: 'rgba(255, 23, 68, 0.05)', 
                padding: '4px', 
                border: '1px solid rgba(255, 23, 68, 0.2)',
                borderRadius: '2px',
                wordBreak: 'break-all'
              }}>
                <strong>ERROR:</strong> {telegramError}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SPACE NODE ARENA MAP */}
      <div id="orbital-arena">
        {nodes.map(n => {
          const rawC = n.c.replace('var(', '').replace(')', '');
          const isSelected = focusedNodeId === n.id;
          const isDirty = n.stat === 'DIRTY';

          return (
            <div
              key={n.id}
              className={`space-core core-${n.stat.toLowerCase()} ${isSelected ? 'core-selected' : ''} ${isDirty ? 'core-dirty' : ''}`}
              id={`mod-${n.id}`}
              style={{
                left: `${n.x}%`,
                top: `${n.y}%`,
                cursor: getNodeUrl(n.id) ? 'pointer' : 'default',
                // Explicit properties passed as React CSS custom variables
                ...{
                  '--c': n.c,
                  '--c-glow': `var(${rawC}-glow)`
                } as React.CSSProperties
              }}
              onClick={(e) => {
                e.stopPropagation();
                setFocusedNodeId(n.id);
                // Add event log on click focus
                const now = new Date();
                setLogs(prev => [
                  { time: now.toLocaleTimeString(), msg: `RADAR LOCK ACQUIRED: ${n.lbl} (${n.sub})`, type: 'info' },
                  ...prev.slice(0, 19) // Cap size of logs list
                ]);
              }}
              onDoubleClick={(e) => {
                const url = getNodeUrl(n.id);
                if (url) {
                  e.stopPropagation();
                  window.open(url, '_blank');
                }
              }}
            >
              {/* Luminous background halo */}
              <div className="core-halo" />

              {/* Ring Wrapper 1: Back Half */}
              <div className="ring-wrapper wrapper-1 back">
                <div className="core-ring-main">
                  <div className="core-packet-main" />
                </div>
                <div className="core-ring-dust" />
              </div>

              {/* Ring Wrapper 2: Back Half */}
              <div className="ring-wrapper wrapper-2 back">
                <div className="core-ring-crossed">
                  <div className="core-packet-sub" />
                </div>
              </div>

              {/* Inner Luminous Body */}
              <div className="core-body">
                {SVG_ICONS[n.icon] || null}
              </div>

              {/* Ring Wrapper 1: Front Half */}
              <div className="ring-wrapper wrapper-1 front">
                <div className="core-ring-main">
                  <div className="core-packet-main" />
                </div>
                <div className="core-ring-dust" />
              </div>

              {/* Ring Wrapper 2: Front Half */}
              <div className="ring-wrapper wrapper-2 front">
                <div className="core-ring-crossed">
                  <div className="core-packet-sub" />
                </div>
              </div>

              {/* Metadata Label */}
              <div className="core-label">
                <span className="core-lbl-name">{n.lbl}</span>
                <span className="core-lbl-port">{n.sub}</span>
                <span className="core-lbl-status" style={{ color: `var(${rawC})` }}>{n.stat}</span>
              </div>
            </div>
          );
        })}

        {/* Selected compact action drawer overlay inside the arena relative to node position */}
        {focusedNode && focusedNode.acts && focusedNode.acts.length > 0 && (
          <div
            id="compact-drawer"
            style={{
              left: `${focusedNode.x}%`,
              top: `${focusedNode.y}%`,
              display: 'block'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-header">{focusedNode.lbl} CONTROL</div>
            {focusedNode.acts.map(act => (
              <button
                key={act.lbl}
                className="drawer-btn"
                onClick={() => handleExecute(act.end, focusedNode.lbl)}
              >
                {act.lbl}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* REAR LOG PANEL */}
      <div className="bottom-log-panel">
        <div className="log-header">
          <span className="log-title">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--cyan)" style={{ marginRight: '5px' }}>
              <path d="M2 20h20v2H2v-2zm2-8h3v6H4v-6zm5-4h3v10H9V8zm5 6h3v4h-3v-4zm5-10h3v14h-3V4z"/>
            </svg>
            REAR-CHANNEL LOG
          </span>
          <span 
            style={{ fontSize: '0.48rem', color: '#445467', cursor: 'pointer', fontWeight: 'bold' }} 
            onClick={(e) => { e.stopPropagation(); setLogs([]); }}
          >
            [ CLEAR LOG ]
          </span>
        </div>
        <div className="log-content-grid">
          <div className="log-col">
            {logs.filter((_, i) => i % 2 === 0).map((log, idx) => (
              <div key={idx}>
                <span className="l-time">[{log.time}]</span>
                <span className={`log-msg ${log.type}`}>{log.msg}</span>
              </div>
            ))}
          </div>
          <div className="log-col">
            {logs.filter((_, i) => i % 2 !== 0).map((log, idx) => (
              <div key={idx}>
                <span className="l-time">[{log.time}]</span>
                <span className={`log-msg ${log.type}`}>{log.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER BAR */}
      <footer className="footer-bar">
        <div className="foot-sect">
          <span>NEXUS OS v1.0.0</span>
          <div className="foot-block">
            <span>RADAR PULSE</span>
            <div className="dot-gauge">
              <span>[</span>
              <span style={{ color: 'var(--green)' }}>■■■■■■■■■■■■■■■■■■■■■■</span>
              <span>]</span>
            </div>
            <canvas id="footer-wave" className="wave-canvas" />
          </div>
        </div>
        <div style={{ color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--green)">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z"/>
          </svg>
          <span style={{ letterSpacing: '0.5px' }}>SECURE CHANNEL ENCRYPTED</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
