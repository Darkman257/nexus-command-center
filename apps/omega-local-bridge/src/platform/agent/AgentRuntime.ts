export interface AgentRuntimeRecord {
  id: string;
  name: string;
  capabilities: string[];
  permissions: string[];
  enabled: boolean;
  health: 'healthy' | 'unhealthy';
  latencyMs: number;
  costScore: number; // e.g. 1-10 (token expense estimate)
  maxConcurrency: number;
  activeQueueSize: number;
  lastHeartbeat: string;
}

export class AgentRuntime {
  private agents = new Map<string, AgentRuntimeRecord>();

  constructor() {
    // Auto-register default agents
    this.register({
      id: 'sally',
      name: 'Sally (Recruitment intake Assistant)',
      capabilities: ['Recruitment.ApproveCandidate'],
      permissions: ['recruitment:write'],
      enabled: true,
      health: 'healthy',
      latencyMs: 1200,
      costScore: 3,
      maxConcurrency: 5,
      activeQueueSize: 0,
      lastHeartbeat: new Date().toISOString()
    });

    this.register({
      id: 'nova-copilot',
      name: 'NOVA (Fleet Co-Pilot)',
      capabilities: ['Fleet.AssignDriver', 'Fleet.RegisterVehicle'],
      permissions: ['fleet:write'],
      enabled: true,
      health: 'healthy',
      latencyMs: 400,
      costScore: 2,
      maxConcurrency: 10,
      activeQueueSize: 0,
      lastHeartbeat: new Date().toISOString()
    });
  }

  register(agent: AgentRuntimeRecord): void {
    this.agents.set(agent.id, agent);
  }

  getAgents(): AgentRuntimeRecord[] {
    return Array.from(this.agents.values());
  }

  getAgent(id: string): AgentRuntimeRecord | undefined {
    return this.agents.get(id);
  }

  updateHeartbeat(id: string): void {
    const agent = this.agents.get(id);
    if (agent) {
      agent.lastHeartbeat = new Date().toISOString();
      agent.health = 'healthy';
    }
  }

  incrementQueue(id: string): void {
    const agent = this.agents.get(id);
    if (agent) {
      agent.activeQueueSize++;
    }
  }

  decrementQueue(id: string): void {
    const agent = this.agents.get(id);
    if (agent && agent.activeQueueSize > 0) {
      agent.activeQueueSize--;
    }
  }
}

export const globalAgentRuntime = new AgentRuntime();
