export interface SessionMemory {
  recentChats: { role: 'user' | 'assistant' | 'nova'; content: string; timestamp: string }[];
  generatedCommands: string[];
  recentAlerts: string[];
  recentReports: string[];
  lastActions: string[];
}

export interface ProjectContext {
  id: string; // 'cc' | 'omega' | 'recruit'
  name: string;
  currentObjective: string;
  currentStatus: string;
  lastAudit: string;
  activeIssues: string[];
  recommendedNextStep: string;
}

export interface OperationalState {
  ollamaStatus: string;
  bridgeDaemonState: string;
  pendingApprovals: number;
  unresolvedAlerts: string[];
  recentAudits: string[];
}

export interface OwnerContext {
  lastRequestedGoal: string;
  currentOperationalFocus: string;
  currentPhase: string;
}

export interface NovaMemoryState {
  session: SessionMemory;
  projects: Record<string, ProjectContext>;
  operational: OperationalState;
  owner: OwnerContext;
  pinnedItems: string[];
}
