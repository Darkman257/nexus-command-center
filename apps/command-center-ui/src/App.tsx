import { useState, useEffect } from 'react';
import './App.css';
import { checkOmegaStatus } from '../../../packages/connectors/src/omegaConnector';
import type { SystemStatus } from '../../../packages/shared-types/src/systemStatus';
import { KernelLibrary } from './kernel/KernelLibrary';
import { NexusBrainWorkspace } from './brain/NexusBrainWorkspace';
import { getLocalResponse } from './brain/nexusLocalResponder';
import { generateHamadaCommand } from './brain/nexusCommandTemplates';

interface LogMessage {
  time: string;
  msg: string;
  type: 'info' | 'system' | 'alert';
}

function App() {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  const [omegaStatus, setOmegaStatus] = useState<SystemStatus>({
    systemId: 'omega-ops',
    label: 'Omega Ops',
    status: 'offline',
    checkedAt: new Date().toISOString(),
    message: 'Initializing health telemetry...'
  });

  const [novaStatus, setNovaStatus] = useState<any>({
    online: false,
    selectedProvider: 'offline'
  });

  const [bridgeOnline, setBridgeOnline] = useState<boolean>(false);
  const [telegramError, setTelegramError] = useState<string | null>(null);
  
  const [cpuUsage, setCpuUsage] = useState(28.7);
  const [ramLoad, setRamLoad] = useState(42.9);

  const [kernelOpen, setKernelOpen] = useState<boolean>(false);
  const [brainOpen, setBrainOpen] = useState<boolean>(false);

  // States for system overview list matching original functionality
  const [recruitStatStr, setRecruitStatStr] = useState('STANDBY');
  const [apiStatStr, setApiStatStr] = useState('OFFLINE');
  const [telStatStr, setTelStatStr] = useState('STANDBY');

  // Unified Chat & Rear Log states
  const [rearLogs, setRearLogs] = useState<LogMessage[]>([]);
  const [chatLog, setChatLog] = useState<{ role: 'user' | 'assistant' | 'nova', data: { type: 'text' | 'command', content: string }[], timestamp: string, projectScope?: string, responseType?: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isNovaLoading, setIsNovaLoading] = useState(false);

  const appendRearLog = (msg: string, type: 'info' | 'system' | 'alert' = 'info') => {
    const timeStr = new Date().toLocaleTimeString([], { hour12: false });
    setRearLogs(prev => [{ time: timeStr, msg, type }, ...prev].slice(0, 50));
  };

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

  const fetchOmegaHealth = async () => {
    const result = await checkOmegaStatus();
    setOmegaStatus(result);

    try {
      const novaRes = await fetch('/api/nova/local-status');
      if (novaRes.ok) {
        const data = await novaRes.json();
        setNovaStatus({
          online: data.ollamaOnline || data.selectedProvider === 'openai',
          selectedProvider: data.selectedProvider,
          availableModels: data.availableModels
        });
      }
    } catch (err) {
      console.warn('NOVA status fetch failed', err);
    }

    const pingRes = await callBridgeAPI('ping');
    const isBridgeUp = pingRes === 'SYSTEM ONLINE';
    setBridgeOnline(isBridgeUp);

    if (isBridgeUp) {
      appendRearLog(`Telemetry Poll: Bridge OK`, 'system');

      const ramRes = await callBridgeAPI('sys');
      if (ramRes && !isNaN(parseFloat(ramRes))) setRamLoad(parseFloat(parseFloat(ramRes).toFixed(1)));

      const recruitStatus = await callBridgeAPI('recruit-status');
      setRecruitStatStr(recruitStatus?.isRunning ? 'ACTIVE' : 'OFFLINE');

      const apiStatus = await callBridgeAPI('api-server-status');
      setApiStatStr(apiStatus?.isRunning ? 'ACTIVE' : 'OFFLINE');

      const telStatus = await callBridgeAPI('telegram-status');
      if (telStatus) {
        setTelStatStr(telStatus.running ? 'ACTIVE' : 'STOPPED');
        if (telStatus.last_log_lines) {
          const errors = telStatus.last_log_lines.filter((l: string) => l.toLowerCase().includes('error'));
          setTelegramError(errors.length > 0 ? errors[errors.length - 1].replace(/\d{8,10}:[A-Za-z0-9_-]{35,45}/g, '<REDACTED>') : null);
        }
      }

    } else {
      appendRearLog(`Telemetry Poll: Bridge OFFLINE`, 'alert');
      setRecruitStatStr('UNAVAILABLE');
      setApiStatStr('UNAVAILABLE');
      setTelStatStr('UNAVAILABLE');
      setTelegramError('NEXUS Bridge Daemon is offline.');
    }
  };

  const handleExecuteAction = async (action: string) => {
    appendRearLog(`Dispatching action: ${action}`, 'system');
    const res = await callBridgeAPI(action);
    if (res !== null) {
      appendRearLog(`Action [${action}] Success`, 'info');
      fetchOmegaHealth();
    } else {
      appendRearLog(`Action [${action}] Failed`, 'alert');
    }
  };

  const handleNovaSend = async (text: string) => {
    if (!text.trim()) return;
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    setChatLog(prev => [...prev, { role: 'user', data: [{ type: 'text', content: text }], timestamp: ts, projectScope: 'Nexus Command Center' }]);
    setChatInput('');
    setIsNovaLoading(true);

    try {
      const doRequest = window['fetch'];
      const res = await doRequest('/api/nova/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, projectScope: 'Nexus Command Center', mode: 'advisor' })
      });
      const data = await res.json();
      setChatLog(prev => [...prev, { role: 'nova', data: [{ type: 'text', content: data.reply || 'No response.' }], timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), responseType: 'Insight' }]);
    } catch (err) {
      const response = getLocalResponse(text, 'Nexus Command Center');
      setChatLog(prev => [...prev, { role: 'assistant', data: response, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), responseType: 'Insight' }]);
    } finally {
      setIsNovaLoading(false);
    }
  };

  const handleQuickNovaAction = (actionLabel: string, actionGoal: string) => {
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const cmd = generateHamadaCommand('Nexus Command Center', actionGoal, `Triggered via ${actionLabel}`);
    let resType = actionLabel.includes('Status') ? 'Status' : 'Hamada Command';
    
    setChatLog(prev => [
      ...prev,
      { role: 'user', data: [{ type: 'text', content: `Requesting: ${actionLabel}` }], timestamp: ts },
      { role: 'assistant', data: [{ type: 'text', content: `Drafted command for ${actionLabel}:` }, { type: 'command', content: cmd }], timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), responseType: resType }
    ]);
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour12: true, hour: '2-digit', minute:'2-digit', second:'2-digit' }));
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    fetchOmegaHealth();
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const poll = setInterval(() => fetchOmegaHealth(), 15000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(prev => Math.max(10, Math.min(90, parseFloat((prev + (Math.random() - 0.5) * 4).toFixed(1)))));
      setRamLoad(prev => Math.max(30, Math.min(80, parseFloat((prev + (Math.random() - 0.5) * 1.5).toFixed(1)))));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Background Canvases
  useEffect(() => {
    const sCvs = document.getElementById('stars-canvas') as HTMLCanvasElement;
    if (sCvs) {
      const sCtx = sCvs.getContext('2d');
      if (sCtx) {
        sCvs.width = window.innerWidth;
        sCvs.height = window.innerHeight;
        const stars = Array.from({length: 150}, () => ({x: Math.random()*sCvs.width, y: Math.random()*sCvs.height, r: Math.random()*1.2, a: Math.random(), s: 0.005 + Math.random()*0.01}));
        let afId: number;
        const draw = () => {
          sCtx.clearRect(0,0, sCvs.width, sCvs.height);
          sCtx.fillStyle = '#fff';
          stars.forEach(s => {
            s.a += s.s;
            if (s.a > 1 || s.a < 0) s.s = -s.s;
            sCtx.globalAlpha = Math.abs(s.a);
            sCtx.beginPath(); sCtx.arc(s.x, s.y, s.r, 0, Math.PI*2); sCtx.fill();
          });
          sCtx.globalAlpha = 1.0;
          afId = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(afId);
      }
    }
  }, []);

  return (
    <div className="os-deck-container">
      <canvas id="stars-canvas" />

      {/* TOP BAR */}
      <header className="os-header">
        <div className="header-brand">
          <span className="brand-title">NEXUS</span>
          <span className="brand-sub">COMMAND CENTER v1.0.0</span>
        </div>
        <div className="header-metrics">
          <div className="h-metric">
            <span>SYSTEM HEALTH</span>
            <b className={omegaStatus.status === 'online' ? 'text-optimal' : 'text-offline'}>
              {omegaStatus.status === 'online' ? 'OPTIMAL' : 'DEGRADED'}
            </b>
          </div>
          <div className="h-metric">
            <span>NOVA STATUS</span>
            <b className={novaStatus.online ? 'text-online' : 'text-offline'}>
              {novaStatus.online ? 'ONLINE' : 'OFFLINE'}
            </b>
          </div>
          <div className="h-metric">
            <span>LOCAL ENGINE</span>
            <b className={novaStatus.online ? 'text-online' : 'text-amber'}>
              {novaStatus.selectedProvider === 'ollama' ? 'OLLAMA' : 'STANDBY'}
            </b>
          </div>
          <div className="h-metric">
            <span>RESPONSE</span>
            <b className="text-online">{omegaStatus.responseMs ? `${omegaStatus.responseMs}ms` : '—'}</b>
          </div>
        </div>
        <div className="header-clock">
          <div className="clock-time">{currentTime}</div>
          <div className="clock-date">{currentDate}</div>
        </div>
      </header>

      {/* LEFT COLUMN */}
      <aside className="os-left-col">
        <div className="glass-panel" style={{ flex: 1, overflow: 'hidden' }}>
          <div className="panel-header">SYSTEM OVERVIEW</div>
          <ul className="overview-list">
            <li className="overview-item" onClick={() => window.open('http://127.0.0.1:5177', '_blank')}>
              <div className="item-icon" style={{color: 'var(--cyan)'}}><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 4.24 2 7v10c0 2.76 4.48 5 10 5s10-2.24 10-5V7c0-2.76-4.48-5-10-5zm0 2c4.28 0 8 1.61 8 3s-3.72 3-8 3-8-1.61-8-3 3.72-3 8-3z"/></svg></div>
              <div className="item-info"><span className="item-title">OPERATIONS CORE</span><span className="item-sub">Command & Control</span></div>
              <span className="item-status status-online">ONLINE</span>
            </li>
            <li className="overview-item" onClick={() => window.open('http://127.0.0.1:3000', '_blank')}>
              <div className="item-icon" style={{color: omegaStatus.status === 'online' ? 'var(--green)' : 'var(--red)'}}><svg viewBox="0 0 24 24"><path d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16z"/></svg></div>
              <div className="item-info"><span className="item-title">OMEGA OPERATIONS</span><span className="item-sub">Core Business Engine</span></div>
              <span className={`item-status ${omegaStatus.status === 'online' ? 'status-online' : 'status-offline'}`}>{omegaStatus.status.toUpperCase()}</span>
            </li>
            <li className="overview-item" onClick={() => handleExecuteAction('run-recruitment')}>
              <div className="item-icon" style={{color: recruitStatStr === 'ACTIVE' ? 'var(--green)' : 'var(--amber)'}}><svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div>
              <div className="item-info"><span className="item-title">RECRUITMENT HUB</span><span className="item-sub">Talent Pipeline</span></div>
              <span className={`item-status ${recruitStatStr === 'ACTIVE' ? 'status-online' : 'status-standby'}`}>{recruitStatStr}</span>
            </li>
            <li className="overview-item" onClick={() => handleExecuteAction('run-telegram')}>
              <div className="item-icon" style={{color: telStatStr === 'ACTIVE' ? 'var(--purple)' : 'var(--amber)'}}><svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg></div>
              <div className="item-info"><span className="item-title">AUTOMATION LAYER</span><span className="item-sub">Workflows & Bots</span></div>
              <span className={`item-status ${telStatStr === 'ACTIVE' ? 'status-active' : 'status-standby'}`}>{telStatStr}</span>
            </li>
            <li className="overview-item">
              <div className="item-icon" style={{color: 'var(--amber)'}}><svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg></div>
              <div className="item-info"><span className="item-title">API GATEWAY</span><span className="item-sub">Bridge & Routing</span></div>
              <span className={`item-status ${apiStatStr === 'ACTIVE' ? 'status-online' : 'status-offline'}`}>{apiStatStr}</span>
            </li>
          </ul>
        </div>
        <div className="glass-panel">
          <div className="panel-header">SYSTEM METRICS</div>
          <div className="metrics-grid">
            <div className="metric-box">
              <span>CPU</span><b>{cpuUsage}%</b>
              <div className="metric-chart"><div className="metric-chart-fill" style={{width: `${cpuUsage}%`}}></div></div>
            </div>
            <div className="metric-box">
              <span>RAM</span><b>{ramLoad}%</b>
              <div className="metric-chart"><div className="metric-chart-fill" style={{width: `${ramLoad}%`}}></div></div>
            </div>
          </div>
        </div>
        <div className="glass-panel" style={{ height: '140px' }}>
          <div className="panel-header">ACTIVE ALERTS</div>
          <div className="alerts-list">
            {!bridgeOnline ? <div className="alert-item"><span>Bridge Daemon Offline</span></div> : null}
            {telegramError ? <div className="alert-item"><span>{telegramError}</span></div> : null}
            {bridgeOnline && !telegramError && <div className="alert-item alert-safe"><span>No Critical Issues</span></div>}
          </div>
        </div>
      </aside>

      {/* CENTER CORE */}
      <section className="os-center-core">
        <div className="nova-title-block">
          <h1>NOVA</h1>
          <h3>STRATEGIC AI COMMAND ENGINE</h3>
        </div>
        
        <div className="nova-orb-container">
          <div className="nova-orb"></div>
        </div>

        {/* System Layers (Cards orbiting center) */}
        <div className="layer-card pos-top-left" onClick={() => window.open('http://127.0.0.1:3000', '_blank')}>
          <div className="layer-header"><div className="layer-icon"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 4.24 2 7v10c0 2.76 4.48 5 10 5s10-2.24 10-5V7c0-2.76-4.48-5-10-5zm0 2c4.28 0 8 1.61 8 3s-3.72 3-8 3-8-1.61-8-3 3.72-3 8-3z"/></svg></div><span className="layer-title">OPERATIONS</span></div>
          <div className="layer-health">Health {omegaStatus.status === 'online' ? '98%' : 'OFFLINE'}<div className="layer-spark"><svg viewBox="0 0 100 12" preserveAspectRatio="none"><polyline points="0,6 20,4 40,8 60,2 80,10 100,6" fill="none" stroke="currentColor" strokeWidth="2"/></svg></div></div>
          <div className="layer-stats"><div className="layer-stat-row"><span>Active Tasks</span><span>12</span></div></div>
        </div>

        <div className="layer-card pos-bot-left" onClick={() => handleExecuteAction('run-recruitment')}>
          <div className="layer-header"><div className="layer-icon"><svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div><span className="layer-title">RECRUITMENT</span></div>
          <div className="layer-health">Health {recruitStatStr === 'ACTIVE' ? '93%' : 'IDLE'}<div className="layer-spark"><svg viewBox="0 0 100 12" preserveAspectRatio="none"><polyline points="0,10 20,2 40,8 60,6 80,10 100,4" fill="none" stroke="currentColor" strokeWidth="2"/></svg></div></div>
          <div className="layer-stats"><div className="layer-stat-row"><span>Candidates</span><span>128</span></div></div>
        </div>

        <div className="layer-card pos-mid-left" onClick={() => handleExecuteAction('run-telegram')}>
          <div className="layer-header"><div className="layer-icon"><svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg></div><span className="layer-title">AUTOMATION</span></div>
          <div className="layer-health">Health {telStatStr === 'ACTIVE' ? '97%' : 'IDLE'}<div className="layer-spark"><svg viewBox="0 0 100 12" preserveAspectRatio="none"><polyline points="0,5 20,5 40,5 60,5 80,5 100,5" fill="none" stroke="currentColor" strokeWidth="2"/></svg></div></div>
          <div className="layer-stats"><div className="layer-stat-row"><span>Active Bots</span><span>9</span></div></div>
        </div>

        <div className="layer-card pos-top-right">
          <div className="layer-header"><div className="layer-icon"><svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg></div><span className="layer-title">SECURITY</span></div>
          <div className="layer-health">Health 99%<div className="layer-spark"><svg viewBox="0 0 100 12" preserveAspectRatio="none"><polyline points="0,11 20,11 40,11 60,11 80,11 100,11" fill="none" stroke="currentColor" strokeWidth="2"/></svg></div></div>
          <div className="layer-stats"><div className="layer-stat-row"><span>Threats</span><span>0</span></div></div>
        </div>

        <div className="layer-card pos-mid-right">
          <div className="layer-header"><div className="layer-icon"><svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/></svg></div><span className="layer-title">INTELLIGENCE</span></div>
          <div className="layer-health">Health 96%<div className="layer-spark"><svg viewBox="0 0 100 12" preserveAspectRatio="none"><polyline points="0,6 20,4 40,8 60,2 80,10 100,6" fill="none" stroke="currentColor" strokeWidth="2"/></svg></div></div>
          <div className="layer-stats"><div className="layer-stat-row"><span>Insights</span><span>42</span></div></div>
        </div>

        <div className="layer-card pos-bot-right">
          <div className="layer-header"><div className="layer-icon"><svg viewBox="0 0 24 24"><path d="M19 8c0-2.21-1.79-4-4-4s-4 1.79-4 4c0 1.86 1.28 3.41 3 3.86V15c0 1.65-1.35 3-3 3s-3-1.35-3-3V9.14c1.72-.45 3-2 3-3.86a6 6 0 1 0-7 5.86V15c0 2.76 2.24 5 5 5s5-2.24 5-5v-3.14c1.72-.45 3-2 3-3.86z"/></svg></div><span className="layer-title">DEPLOYMENT</span></div>
          <div className="layer-health">Health 94%<div className="layer-spark"><svg viewBox="0 0 100 12" preserveAspectRatio="none"><polyline points="0,10 20,10 40,10 60,10 80,10 100,10" fill="none" stroke="currentColor" strokeWidth="2"/></svg></div></div>
          <div className="layer-stats"><div className="layer-stat-row"><span>Deploys</span><span>27</span></div></div>
        </div>

        <div className="system-pulse">
          <div className="system-pulse-line"><div className="system-pulse-dot"></div></div>
          <span className="system-pulse-text">SYSTEM PULSE</span>
        </div>
      </section>

      {/* RIGHT COLUMN */}
      <aside className="os-right-col">
        <div className="glass-panel" style={{ flex: 1, overflow: 'hidden' }}>
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>NOVA ASSISTANT</span>
            <span style={{ color: novaStatus.online ? 'var(--green)' : 'var(--red)', fontSize: '0.45rem', border: '1px solid currentColor', padding: '2px 4px', borderRadius: '4px' }}>
              {novaStatus.online ? '● ONLINE' : '○ OFFLINE'}
            </span>
          </div>
          <div className="assistant-body">
            <div className="assistant-intro">
              <div className="mini-avatar"></div>
              <div className="intro-text">How can I assist you today, Commander?</div>
            </div>

            <div className="insight-box">
              <div className="insight-title">LATEST INSIGHT</div>
              <div className="insight-content">
                Omega response time stable at {omegaStatus.responseMs || 0}ms.
                <br/>
                {bridgeOnline ? 'Bridge daemon is active.' : 'Bridge daemon is currently offline.'}
                <br/>
                No pending owner approvals.
              </div>
            </div>

            <div className="quick-actions-lbl">QUICK ACTIONS</div>
            <div className="quick-actions">
              <button className="q-btn" onClick={() => handleQuickNovaAction('System Status', 'status')}>System Status</button>
              <button className="q-btn" onClick={() => setBrainOpen(true)}>Open NOVA Workspace</button>
              <button className="q-btn" onClick={() => handleQuickNovaAction('Prepare Hamada Command', 'cmd')}>Prepare Hamada Command</button>
              <button className="q-btn" onClick={() => handleQuickNovaAction('Audit Project', 'audit')}>Audit Project</button>
              <button className="q-btn" onClick={() => handleQuickNovaAction('Explain Current Status', 'explain')}>Explain Current Status</button>
            </div>
          </div>
          <div className="ask-input-box">
            <input 
              type="text" 
              className="ask-input" 
              placeholder="Ask NOVA anything..." 
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if(e.key === 'Enter') handleNovaSend(chatInput); }}
              disabled={isNovaLoading}
            />
            <button className="ask-btn" onClick={() => handleNovaSend(chatInput)} disabled={isNovaLoading}>
              <svg width="14" height="14" viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
            </button>
          </div>
        </div>
      </aside>

      {/* BOTTOM ROW */}
      <footer className="os-bottom-row">
        <div className="glass-panel" style={{ flex: 1, flexDirection: 'row', overflow: 'hidden' }}>
          <div className="timeline-container">
            {chatLog.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', alignSelf: 'center', margin: '0 auto', fontFamily: 'var(--font-mono)' }}>
                NO COMMAND HISTORY IN CURRENT SESSION.
              </div>
            )}
            {chatLog.map((log, idx) => (
              <div key={idx} className={`timeline-card ${log.role === 'user' ? 't-card-user' : 't-card-nova'}`}>
                <div className="t-card-header">
                  <div className="role-badge">
                    <div className="t-dot" style={{ background: log.role === 'user' ? 'var(--cyan)' : 'var(--purple)' }} />
                    <span>{log.role === 'user' ? 'YOU (OWNER)' : 'NOVA (AI)'}</span>
                  </div>
                  <span>{log.timestamp}</span>
                </div>
                <div className="t-card-title">{log.role === 'user' ? (log.projectScope || 'System Command') : (log.responseType || 'System Response')}</div>
                
                {log.data.map((item, i) => (
                  item.type === 'text' ? (
                    <div key={i} className="t-card-content">{item.content}</div>
                  ) : (
                    <div key={i} className="t-card-cmd">{item.content}</div>
                  )
                ))}

                {log.role !== 'user' && (
                  <div className="t-card-actions">
                    <button className="t-btn t-btn-primary" onClick={() => navigator.clipboard.writeText(log.data.find(d => d.type==='command')?.content || log.data[0].content)}>Copy</button>
                    {log.data.some(d => d.type === 'command') && <button className="t-btn">Create Task</button>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rear-log-panel">
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>REAR-CHANNEL INTELLIGENCE</span>
            <span style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setRearLogs([])}>[ CLEAR ]</span>
          </div>
          <div className="rear-log-content">
            {rearLogs.map((log, idx) => (
              <div key={idx} className="r-log">
                <span className="r-time">[{log.time}]</span>
                <span className={`r-msg r-${log.type}`}>{log.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </footer>

      {brainOpen && <NexusBrainWorkspace onClose={() => setBrainOpen(false)} />}
      {kernelOpen && <KernelLibrary onClose={() => setKernelOpen(false)} />}
    </div>
  );
}

export default App;
