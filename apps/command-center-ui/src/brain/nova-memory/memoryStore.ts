import type { NovaMemoryState } from './memoryTypes';
import { memoryPersistence } from './memoryPersistence';

const DEFAULT_STATE: NovaMemoryState = {
  session: {
    recentChats: [],
    generatedCommands: [],
    recentAlerts: [],
    recentReports: [],
    lastActions: []
  },
  projects: {
    cc: {
      id: 'cc',
      name: 'NEXUS Command Center',
      currentObjective: 'Establish permanent local memory context for NOVA.',
      currentStatus: 'Operational deck online.',
      lastAudit: '2026-05-23: Hamada bridge scripts verified and syntax checked.',
      activeIssues: ['Bridge Daemon status is offline'],
      recommendedNextStep: 'Execute Hamada status audit on Bridge Daemon.'
    },
    omega: {
      id: 'omega',
      name: 'Omega Ops',
      currentObjective: 'Complete Phase 1E operational dashboard integration.',
      currentStatus: 'Ready, pending gateway configuration.',
      lastAudit: '2026-05-23: Clean build, pnpm verified.',
      activeIssues: ['Omega Gateway status is unknown', 'Dashboard status is unknown'],
      recommendedNextStep: 'Verify local gateway port connectivity and check status.'
    },
    recruit: {
      id: 'recruit',
      name: 'Recruitment Hub',
      currentObjective: 'Refine applicant media asset onboarding flow rules.',
      currentStatus: 'Candidate importer verified locally.',
      lastAudit: '2026-05-23: Safe recruitment paths confirmed.',
      activeIssues: ['Recruitment Hub status is unknown'],
      recommendedNextStep: 'Check recruitment ingestion pipeline triggers.'
    }
  },
  operational: {
    ollamaStatus: 'ONLINE',
    bridgeDaemonState: 'OFFLINE',
    pendingApprovals: 1,
    unresolvedAlerts: ['Bridge Daemon is offline'],
    recentAudits: ['Hamada Bridge Syntax Audit']
  },
  owner: {
    lastRequestedGoal: 'Harden NOVA operations response formatting',
    currentOperationalFocus: 'Polishing NOVA operational memory and context layer',
    currentPhase: 'Phase 1E'
  },
  pinnedItems: []
};

export class MemoryStore {
  private state: NovaMemoryState;
  private listeners: (() => void)[] = [];

  constructor(initialState?: NovaMemoryState) {
    this.state = initialState || { ...DEFAULT_STATE };
  }

  getState(): NovaMemoryState {
    return this.state;
  }

  setState(newState: Partial<NovaMemoryState>) {
    this.state = { ...this.state, ...newState };
    this.notify();
  }

  notify() {
    this.listeners.forEach(l => l());
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  addChat(role: 'user' | 'assistant' | 'nova', content: string) {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const chat = { role, content: this.sanitize(content), timestamp };
    const recentChats = [...this.state.session.recentChats, chat].slice(-20);
    this.setState({
      session: { ...this.state.session, recentChats }
    });
  }

  addCommand(cmd: string) {
    const sanitizedCmd = this.sanitize(cmd);
    const generatedCommands = [...this.state.session.generatedCommands, sanitizedCmd].slice(-10);
    const lastActions = [...this.state.session.lastActions, `Generated command: ${sanitizedCmd.split('\n')[0]}`].slice(-10);
    this.setState({
      session: { ...this.state.session, generatedCommands, lastActions }
    });
  }

  addAlert(alert: string) {
    const recentAlerts = [...this.state.session.recentAlerts, this.sanitize(alert)].slice(-10);
    this.setState({
      session: { ...this.state.session, recentAlerts }
    });
  }

  addReport(report: string) {
    const recentReports = [...this.state.session.recentReports, this.sanitize(report)].slice(-10);
    this.setState({
      session: { ...this.state.session, recentReports }
    });
  }

  setProjectObjective(projectId: string, objective: string) {
    if (this.state.projects[projectId]) {
      const projects = { ...this.state.projects };
      projects[projectId] = { ...projects[projectId], currentObjective: objective };
      this.setState({ projects });
    }
  }

  resolveIssue(projectId: string, issue: string) {
    if (this.state.projects[projectId]) {
      const projects = { ...this.state.projects };
      projects[projectId] = {
        ...projects[projectId],
        activeIssues: projects[projectId].activeIssues.filter(i => i !== issue)
      };
      
      // Update unresolved alerts list as well
      const unresolvedAlerts = this.state.operational.unresolvedAlerts.filter(a => !a.includes(issue));
      
      this.setState({ 
        projects,
        operational: { ...this.state.operational, unresolvedAlerts }
      });
    }
  }

  pinItem(item: string) {
    if (!this.state.pinnedItems.includes(item)) {
      this.setState({ pinnedItems: [...this.state.pinnedItems, item] });
    }
  }

  unpinItem(item: string) {
    this.setState({ pinnedItems: this.state.pinnedItems.filter(i => i !== item) });
  }

  clearSession() {
    this.setState({
      session: {
        recentChats: [],
        generatedCommands: [],
        recentAlerts: [],
        recentReports: [],
        lastActions: []
      }
    });
  }

  resetAll() {
    this.state = { ...DEFAULT_STATE };
    this.notify();
  }

  sanitize(text: string): string {
    if (!text) return '';
    return text
      .replace(/sk-[a-zA-Z0-9]{48}/gi, '<REDACTED_OPENAI_KEY>')
      .replace(/[0-9]{8,10}:[a-zA-Z0-9_-]{35}/gi, '<REDACTED_TELEGRAM_TOKEN>')
      .replace(/VITE_[A-Z0-9_]+/gi, '<REDACTED_VITE_ENV>')
      .replace(/SUPABASE_[A-Z0-9_]+/gi, '<REDACTED_SUPABASE_ENV>')
      .replace(/(openai_api_key|api_key|secret|bot_token|supabase_key|jwt_secret|private_key|token)\s*[:=]\s*["']?[a-zA-Z0-9_\-\.\/]+["']?/gi, '$1: <REDACTED_CREDENTIAL>')
      .replace(/(bearer\s+)[a-zA-Z0-9_\-\.\/]+/gi, '$1<REDACTED_BEARER>')
      .replace(/db_password\s*[:=]\s*["']?[a-zA-Z0-9_\-\.]+["']?/gi, 'db_password: <REDACTED_DB_PWD>');
  }
}

// Global shared store instance initialized from localStorage if available
const savedState = memoryPersistence.load();
export const globalMemoryStore = new MemoryStore(savedState);

// Auto-save changes to localStorage
globalMemoryStore.subscribe(() => {
  memoryPersistence.save(globalMemoryStore.getState());
});
