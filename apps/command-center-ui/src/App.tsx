import { useState, useEffect, Suspense, lazy } from 'react';
import './App.css';
import { checkOmegaStatus } from '../../../packages/connectors/src/omegaConnector';
import type { SystemStatus } from '../../../packages/shared-types/src/systemStatus';
import { KernelLibrary } from './kernel/KernelLibrary';
import { NexusBrainWorkspace } from './brain/NexusBrainWorkspace';

import { StarfieldBackground } from './components/nova/StarfieldBackground';
import { NovaTopBar } from './components/nova/NovaTopBar';
import { NovaLauncherRail } from './components/nova/NovaLauncherRail';
import { NovaLauncherPreview } from './components/nova/NovaLauncherPreview';
import { NovaSystemLayers } from './components/nova/NovaSystemLayers';
import { NovaAssistantPanel } from './components/nova/NovaAssistantPanel';
import type { ChatEntry } from './components/nova/NovaAssistantPanel';
import { NovaTimeline } from './components/nova/NovaTimeline';
import { NovaRearChannel } from './components/nova/NovaRearChannel';
import { NovaNarrative } from './components/nova/NovaNarrative';

import { Terminal, ShieldCheck, Activity, Bell, FileText, Settings, LayoutGrid } from 'lucide-react';

// Lazy-load the heavy 3D core for performance
const NovaCore3D = lazy(() =>
  import('./components/nova/NovaCore3D').then(m => ({ default: m.NovaCore3D }))
);

interface LogMessage {
  time: string;
  msg: string;
  type: 'info' | 'system' | 'alert';
}

export function App() {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [omegaStatus, setOmegaStatus] = useState<SystemStatus>({
    systemId: 'omega-ops',
    label: 'Omega Ops',
    status: 'offline',
    checkedAt: new Date().toISOString(),
    message: 'Initializing...',
  });

  const [novaStatus, setNovaStatus] = useState({ online: false, selectedProvider: 'offline' });
  const [bridgeOnline, setBridgeOnline] = useState(false);
  const [telegramError, setTelegramError] = useState<string | null>(null);

  const [cpuUsage, setCpuUsage] = useState(28.7);
  const [ramLoad, setRamLoad] = useState(42.9);
  const [diskUsage] = useState(62.4);
  const [netUsage, setNetUsage] = useState(18.2);

  const [recruitStat, setRecruitStat] = useState('STANDBY');
  const [apiStat, setApiStat] = useState('OFFLINE');
  const [telStat, setTelStat] = useState('STANDBY');

  const [rearLogs, setRearLogs] = useState<LogMessage[]>([]);
  const [chatLog, setChatLog] = useState<ChatEntry[]>([
    {
      role: 'user',
      content: 'System Status',
      timestamp: '12:08 AM',
    },
    {
      role: 'assistant',
      content: 'System Status Overview:\n- All core systems are operational.\n- Omega: Online and responsive.\n- Recruitment: Pipeline stable.\n- Automation: 9 bots active.\n- Security: No threats detected.\n- Bridge: Connected.\n- No pending approvals.',
      timestamp: '12:08 AM',
      responseType: 'Status Report',
    }
  ]);
  const [isNovaLoading] = useState(false);

  const [kernelOpen, setKernelOpen] = useState(false);
  const [brainOpen, setBrainOpen] = useState(false);

  // New UI/UX Layout States
  const [activeLauncherItem, setActiveLauncherItem] = useState<string | null>(null);
  const [activeDockTab, setActiveDockTab] = useState<string | null>(null);

  const appendLog = (msg: string, type: LogMessage['type'] = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setRearLogs(prev => [{ time, msg, type }, ...prev].slice(0, 60));
  };

  const callBridgeAPI = async (endpoint: string, method = 'GET', body?: unknown) => {
    try {
      const res = await fetch(`http://localhost:9999/api/${endpoint}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        mode: 'cors',
      });
      if (res.ok) {
        const ct = res.headers.get('content-type') ?? '';
        return ct.includes('application/json') ? await res.json() : await res.text();
      }
    } catch (err) {
      console.warn(`Bridge call failed [${endpoint}]:`, err);
    }
    return null;
  };

  const fetchOmegaHealth = async () => {
    setIsRefreshing(true);

    // Omega health
    const result = await checkOmegaStatus();
    setOmegaStatus(result);

    // NOVA local status
    try {
      const novaRes = await fetch('/api/nova/local-status');
      if (novaRes.ok) {
        const data = await novaRes.json();
        setNovaStatus({
          online: data.ollamaOnline || data.selectedProvider === 'openai',
          selectedProvider: data.selectedProvider,
        });
      }
    } catch {
      // NOVA backend not running — acceptable
    }

    // Bridge telemetry
    const pingRes = await callBridgeAPI('ping');
    const bridgeUp = pingRes === 'SYSTEM ONLINE';
    setBridgeOnline(bridgeUp);

    if (bridgeUp) {
      appendLog('Telemetry Poll: Bridge OK', 'system');

      const ramRes = await callBridgeAPI('sys');
      if (ramRes && !isNaN(parseFloat(ramRes))) setRamLoad(parseFloat(parseFloat(ramRes).toFixed(1)));

      const recruitStatus = await callBridgeAPI('recruit-status');
      setRecruitStat(recruitStatus?.isRunning ? 'ACTIVE' : 'OFFLINE');

      const apiStatus = await callBridgeAPI('api-server-status');
      setApiStat(apiStatus?.isRunning ? 'ACTIVE' : 'OFFLINE');

      const telStatus = await callBridgeAPI('telegram-status');
      if (telStatus) {
        setTelStat(telStatus.running ? 'ACTIVE' : 'STOPPED');
        if (telStatus.last_log_lines) {
          const errors: string[] = telStatus.last_log_lines.filter((l: string) =>
            l.toLowerCase().includes('error')
          );
          setTelegramError(
            errors.length > 0
              ? errors[errors.length - 1].replace(/\d{8,10}:[A-Za-z0-9_-]{35,45}/g, '<REDACTED>')
              : null
          );
        }
      }
    } else {
      appendLog('Telemetry Poll: Bridge OFFLINE', 'alert');
      setRecruitStat('UNAVAILABLE');
      setApiStat('UNAVAILABLE');
      setTelStat('UNAVAILABLE');
      setTelegramError('NEXUS Bridge Daemon is offline.');
    }

    appendLog(`Omega: ${result.status.toUpperCase()} ${result.responseMs != null ? `(${result.responseMs}ms)` : '(unreachable)'}`, result.status === 'online' ? 'info' : 'alert');
    setIsRefreshing(false);
  };

  // Clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase());
    };
    tick();
    const id = setInterval(tick, 1000);
    fetchOmegaHealth();
    return () => clearInterval(id);
  }, []);

  // 15s telemetry poll
  useEffect(() => {
    const id = setInterval(fetchOmegaHealth, 15000);
    return () => clearInterval(id);
  }, []);

  // CPU/NET flutter
  useEffect(() => {
    const id = setInterval(() => {
      setCpuUsage(p => Math.max(10, Math.min(90, parseFloat((p + (Math.random() - 0.5) * 4).toFixed(1)))));
      setNetUsage(p => Math.max(5,  Math.min(60, parseFloat((p + (Math.random() - 0.5) * 2).toFixed(1)))));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // Build alerts list
  const alerts: { msg: string; type: 'warn' | 'critical' | 'ok' }[] = [];
  if (!bridgeOnline) alerts.push({ msg: 'Bridge Daemon Offline', type: 'critical' });
  if (telegramError) alerts.push({ msg: telegramError, type: 'warn' });
  if (omegaStatus.status !== 'online') alerts.push({ msg: 'Omega Unreachable', type: 'warn' });

  return (
    <>
      <StarfieldBackground />

      <div className="nova-deck">
        {/* TOP BAR */}
        <NovaTopBar
          currentTime={currentTime}
          currentDate={currentDate}
          omegaStatus={omegaStatus}
          novaOnline={novaStatus.online}
          novaProvider={novaStatus.selectedProvider}
          isRefreshing={isRefreshing}
          onRefresh={fetchOmegaHealth}
          bridgeOnline={bridgeOnline}
        />

        {/* LEFT — Compact Launcher Rail */}
        <NovaLauncherRail
          activeItem={activeLauncherItem}
          setActiveItem={setActiveLauncherItem}
          omegaOnline={omegaStatus.status === 'online'}
          recruitStat={recruitStat}
          telStat={telStat}
          apiStat={apiStat}
          novaOnline={novaStatus.online}
          bridgeOnline={bridgeOnline}
        />

        {/* Launcher Preview HUD overlay */}
        <NovaLauncherPreview
          activeItem={activeLauncherItem}
          onClose={() => setActiveLauncherItem(null)}
          omegaOnline={omegaStatus.status === 'online'}
          recruitStat={recruitStat}
          telStat={telStat}
          apiStat={apiStat}
          novaOnline={novaStatus.online}
          bridgeOnline={bridgeOnline}
          cpuUsage={cpuUsage}
          ramLoad={ramLoad}
          diskUsage={diskUsage}
          netUsage={netUsage}
          alerts={alerts}
        />

        {/* CENTER — NOVA 3D Core + Minimized Chips */}
        <section className="nova-center-core">
          {/* 3D Canvas Host */}
          <div className="nova-3d-host">
            <Suspense fallback={null}>
              <NovaCore3D online={novaStatus.online} />
            </Suspense>
          </div>

          {/* NOVA Title */}
          <div className="nova-center-title">
            <div className="nova-center-h1">NOVA</div>
            <div className="nova-center-h3">STRATEGIC AI COMMAND ENGINE</div>
          </div>

          {/* 6 Minimized chips around core */}
          <NovaSystemLayers
            omegaOnline={omegaStatus.status === 'online'}
            recruitStat={recruitStat}
            telStat={telStat}
            apiStat={apiStat}
            onLayerClick={(id) => appendLog(`Layer selected: ${id.toUpperCase()}`, 'info')}
          />

          {/* Centered Phrase Block */}
          <div className="nova-phrase-block">
            <div className="nova-phrase-line">I SEE. I ANALYZE. I ADVISE.</div>
            <div className="nova-phrase-line secondary">YOU DECIDE. I EXECUTE.</div>
          </div>
        </section>

        {/* RIGHT — NOVA Assistant */}
        <NovaAssistantPanel
          novaOnline={novaStatus.online}
          novaProvider={novaStatus.selectedProvider}
          omegaStatus={omegaStatus}
          bridgeOnline={bridgeOnline}
          onOpenWorkspace={() => setBrainOpen(true)}
          chatLog={chatLog}
          setChatLog={setChatLog}
        />

        {/* COLLAPSIBLE TACTICAL DOCK (BOTTOM) */}
        <div className={`nova-tactical-dock ${activeDockTab ? 'expanded' : 'collapsed'}`}>
          {/* Centered handle/chevron notch */}
          <div
            className="dock-handle-tab"
            onClick={() => setActiveDockTab(activeDockTab ? null : 'timeline')}
          >
            <span>{activeDockTab ? '▼ DOCK OPEN' : '▲ OPEN TACTICAL DOCK'}</span>
          </div>

          {/* Dock Bar */}
          <div className="dock-bar glass">
            <div className="dock-triggers">
              <button
                className={`dock-tab-btn ${activeDockTab === 'timeline' ? 'active' : ''}`}
                onClick={() => setActiveDockTab(activeDockTab === 'timeline' ? null : 'timeline')}
              >
                <Terminal size={14} className="dock-tab-icon" />
                <div className="dock-tab-label-group">
                  <div className="dock-tab-title-row">
                    <span className="dock-tab-name">TIMELINE</span>
                    <span className="dock-tab-badge badge-blue">{chatLog.length}</span>
                  </div>
                  <span className="dock-tab-desc">Recent activity</span>
                </div>
              </button>

              <button
                className={`dock-tab-btn ${activeDockTab === 'logs' ? 'active' : ''}`}
                onClick={() => setActiveDockTab(activeDockTab === 'logs' ? null : 'logs')}
              >
                <Activity size={14} className="dock-tab-icon" />
                <div className="dock-tab-label-group">
                  <div className="dock-tab-title-row">
                    <span className="dock-tab-name">LOGS</span>
                    <span className="dock-tab-badge badge-blue">{rearLogs.length || 19}</span>
                  </div>
                  <span className="dock-tab-desc">System logs</span>
                </div>
              </button>

              <button
                className={`dock-tab-btn ${activeDockTab === 'narrative' ? 'active' : ''}`}
                onClick={() => setActiveDockTab(activeDockTab === 'narrative' ? null : 'narrative')}
              >
                <ShieldCheck size={14} className="dock-tab-icon" />
                <div className="dock-tab-label-group">
                  <div className="dock-tab-title-row">
                    <span className="dock-tab-name">NOVA MEMORY</span>
                    <span className="dock-tab-badge badge-blue">5</span>
                  </div>
                  <span className="dock-tab-desc">AI memory</span>
                </div>
              </button>

              <button
                className={`dock-tab-btn ${activeDockTab === 'alerts' ? 'active' : ''} ${alerts.length > 0 ? 'pulse-warn' : ''}`}
                onClick={() => setActiveDockTab(activeDockTab === 'alerts' ? null : 'alerts')}
              >
                <Bell size={14} className="dock-tab-icon" />
                <div className="dock-tab-label-group">
                  <div className="dock-tab-title-row">
                    <span className="dock-tab-name">ALERTS</span>
                    <span className={`dock-tab-badge ${alerts.length > 0 ? 'badge-red' : 'badge-blue'}`}>{alerts.length || 2}</span>
                  </div>
                  <span className="dock-tab-desc">Requires attention</span>
                </div>
              </button>

              <button
                className={`dock-tab-btn ${activeDockTab === 'reports' ? 'active' : ''}`}
                onClick={() => setActiveDockTab(activeDockTab === 'reports' ? null : 'reports')}
              >
                <FileText size={14} className="dock-tab-icon" />
                <div className="dock-tab-label-group">
                  <div className="dock-tab-title-row">
                    <span className="dock-tab-name">REPORTS</span>
                    <span className="dock-tab-badge badge-blue">3</span>
                  </div>
                  <span className="dock-tab-desc">Generated</span>
                </div>
              </button>

              <button
                className={`dock-tab-btn ${activeDockTab === 'approvals' ? 'active' : ''}`}
                onClick={() => setActiveDockTab(activeDockTab === 'approvals' ? null : 'approvals')}
              >
                <Settings size={14} className="dock-tab-icon" />
                <div className="dock-tab-label-group">
                  <div className="dock-tab-title-row">
                    <span className="dock-tab-name">APPROVALS</span>
                    <span className="dock-tab-badge badge-blue">1</span>
                  </div>
                  <span className="dock-tab-desc">Owner actions</span>
                </div>
              </button>
            </div>

            <button
              className="open-dock-btn"
              onClick={() => setActiveDockTab(activeDockTab ? null : 'timeline')}
            >
              <LayoutGrid size={12} className="open-dock-icon" />
              <span>OPEN TACTICAL DOCK</span>
            </button>
          </div>

          {/* Drawer Content */}
          {activeDockTab && (
            <div className="dock-drawer-content glass">
              {activeDockTab === 'timeline' && (
                <NovaTimeline entries={chatLog} isLoading={isNovaLoading} />
              )}
              {activeDockTab === 'logs' && (
                <NovaRearChannel logs={rearLogs} onClear={() => setRearLogs([])} />
              )}
              {activeDockTab === 'narrative' && (
                <NovaNarrative
                  omegaOnline={omegaStatus.status === 'online'}
                  novaOnline={novaStatus.online}
                  bridgeOnline={bridgeOnline}
                  novaProvider={novaStatus.selectedProvider}
                />
              )}
              {activeDockTab === 'alerts' && (
                <div className="dock-placeholder-view">
                  <h4>ALERTS</h4>
                  <div className="dock-alerts-list">
                    {alerts.length === 0 ? (
                      <div className="dock-alert-ok">All systems functioning nominally.</div>
                    ) : (
                      alerts.map((a, idx) => (
                        <div key={idx} className={`dock-alert-item alert-${a.type}`}>
                          <span>● {a.msg}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
              {activeDockTab === 'reports' && (
                <div className="dock-placeholder-view">
                  <h4>REPORTS</h4>
                  <p>All pipeline compilation nodes are fully compiled. 0 execution exceptions caught.</p>
                </div>
              )}
              {activeDockTab === 'approvals' && (
                <div className="dock-placeholder-view">
                  <h4>OWNER APPROVALS</h4>
                  <p>NOVA runtime is restricted to system advice. 0 authorization requests pending.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {brainOpen && <NexusBrainWorkspace onClose={() => setBrainOpen(false)} />}
      {kernelOpen && <KernelLibrary onClose={() => setKernelOpen(false)} />}
    </>
  );
}

export default App;
