import { useState, useEffect } from 'react';
import './App.css';
import { checkOmegaStatus } from '../../../packages/connectors/src/omegaConnector';
import type { SystemStatus } from '../../../packages/shared-types/src/systemStatus';
import { KernelLibrary } from './kernel/KernelLibrary';
import { NexusBrainWorkspace } from './brain/NexusBrainWorkspace';

import { StarfieldBackground } from './components/nova/StarfieldBackground';
import { NovaLauncherRail } from './components/nova/NovaLauncherRail';

// Bridge imports
import './runtime/adapters/omegaRuntimeBridge';
import { SituationRoom } from './pages/SituationRoom';
import { Workspaces } from './pages/Workspaces';
import { NovaPage } from './pages/NovaPage';
import { Intelligence } from './pages/Intelligence';
import { Reports } from './pages/Reports';
import { Automations } from './pages/Automations';
import { NexusCore } from './pages/NexusCore';
import { Settings as SettingsPage } from './pages/Settings';
import { RuntimeServicesPanel } from './pages/RuntimeServicesPanel';
import { NovaFloatingAssistant } from './components/nova/NovaFloatingAssistant';
import { mockRuntimeFeed } from './runtime/mock/mockRuntimeFeed';
import './runtime/testing/runtimeTestHarness';

interface LogMessage {
  time: string;
  msg: string;
  type: 'info' | 'system' | 'alert';
}

export function App() {
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
  const [operationalIntelligence, setOperationalIntelligence] = useState<any>(null);

  const [recruitStat, setRecruitStat] = useState('STANDBY');
  const [apiStat, setApiStat] = useState('OFFLINE');
  const [telStat, setTelStat] = useState('STANDBY');

  const [chatLog, setChatLog] = useState<any[]>([
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

  const [kernelOpen, setKernelOpen] = useState(false);
  const [brainOpen, setBrainOpen] = useState(false);

  // New UI/UX Layout States
  const [activeLauncherItem, setActiveLauncherItem] = useState<string | null>(null);

  // Ask NOVA bridge — called from SystemGraph3D
  const navigateToNova = (prompt: string) => {
    try { sessionStorage.setItem('nexus_nova_pending_prompt', prompt); } catch {}
    setActiveLauncherItem('nova');
  };

  const appendLog = (msg: string, type: LogMessage['type'] = 'info') => {
    console.log(`[SYSTEM LOG - ${type.toUpperCase()}] ${msg}`);
  };

  const callBridgeAPI = async (endpoint: string, method = 'GET', body?: unknown) => {
    try {
      const res = await fetch(`http://localhost:5057/api/${endpoint}`, {
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

      const opIntel = await callBridgeAPI('analytics/operational-intelligence');
      if (opIntel && opIntel.ok) {
        setOperationalIntelligence(opIntel.analytics);
      } else {
        setOperationalIntelligence(null);
      }

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
  };

  // Clock & Runtime Feed Loop
  useEffect(() => {
    fetchOmegaHealth();
    
    // Start local operational event nervous system feed
    mockRuntimeFeed.start(6000);
    
    return () => {
      mockRuntimeFeed.stop();
    };
  }, []);

  // 15s telemetry poll
  useEffect(() => {
    const id = setInterval(fetchOmegaHealth, 15000);
    return () => clearInterval(id);
  }, []);

  // Hidden route for technical control
  useEffect(() => {
    if (window.location.pathname === '/runtime-services') {
      setActiveLauncherItem('runtime-services');
    }
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
        {/* LEFT — Labeled Operational Sidebar */}
        <NovaLauncherRail
          activeItem={activeLauncherItem}
          setActiveItem={setActiveLauncherItem}
          omegaOnline={omegaStatus.status === 'online'}
          recruitStat={recruitStat}
          telStat={telStat}
          novaOnline={novaStatus.online}
          bridgeOnline={bridgeOnline}
        />

        {/* Dynamic system energy circulating vein */}
        <div className="energy-vein-v" style={{ height: '100vh', opacity: 0.4 }} />

        {/* RIGHT — Active Full-Page Content Router */}
        <div className="nexus-main-content">
          <div className="hologram-transition" key={activeLauncherItem || 'cc'} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {(() => {
              switch (activeLauncherItem) {
                case 'workspaces':     return <Workspaces />;
                case 'nova':           return <NovaPage />;
                case 'intelligence':   return <Intelligence />;
                case 'reports':        return <Reports />;
                case 'automations':    return <Automations />;
                case 'nexus-core':     return <NexusCore onAskNova={navigateToNova} />;
                case 'settings':       return <SettingsPage />;
                case 'runtime-services': return <RuntimeServicesPanel />;
                case 'cc':
                default:
                  return (
                    <SituationRoom
                      novaStatus={novaStatus}
                      omegaStatus={omegaStatus}
                      bridgeOnline={bridgeOnline}
                      recruitStat={recruitStat}
                      telStat={telStat}
                      apiStat={apiStat}
                      chatLog={chatLog}
                      setChatLog={setChatLog}
                      appendLog={appendLog}
                      setBrainOpen={setBrainOpen}
                      operationalIntelligence={operationalIntelligence}
                    />
                  );
              }
            })()}
          </div>
        </div>
      </div>

      {/* Global Collapsible Floating NOVA Assistant Overlay */}
      <NovaFloatingAssistant
        activeLauncherItem={activeLauncherItem}
        chatLog={chatLog}
        setChatLog={setChatLog}
      />
      {brainOpen && <NexusBrainWorkspace onClose={() => setBrainOpen(false)} />}
      {kernelOpen && <KernelLibrary onClose={() => setKernelOpen(false)} />}
    </>
  );
}

export default App;
