import { systemClock } from '../utils/SystemClock';

export interface RegisteredAgent {
  id: string;
  name: string;
  capabilities: string[];
  permissions: string[];
  status: 'idle' | 'working' | 'offline';
  workspace: string;
  lastHeartbeat: string;
  expiresAt: string;
}

export class AgentRegistry {
  private agents: Record<string, RegisteredAgent> = {};

  register(agentInput: Omit<RegisteredAgent, 'status' | 'lastHeartbeat' | 'expiresAt'>): RegisteredAgent {
    const now = new Date(systemClock.now());
    const expires = new Date(now.getTime() + 30000); // 30 seconds lifetime

    const agent: RegisteredAgent = {
      ...agentInput,
      status: 'idle',
      lastHeartbeat: now.toISOString(),
      expiresAt: expires.toISOString(),
    };

    this.agents[agent.id] = agent;
    return agent;
  }

  heartbeat(id: string): RegisteredAgent {
    const agent = this.agents[id];
    if (!agent) {
      throw new Error(`Agent not registered: ${id}`);
    }

    const now = new Date(systemClock.now());
    const expires = new Date(now.getTime() + 30000);

    agent.lastHeartbeat = now.toISOString();
    agent.expiresAt = expires.toISOString();
    
    if (agent.status === 'offline') {
      agent.status = 'idle';
    }

    return agent;
  }

  getAgents(): RegisteredAgent[] {
    const nowStr = systemClock.now();
    const now = new Date(nowStr).getTime();

    // Dynamically mark expired agents as offline
    return Object.values(this.agents).map(agent => {
      const expires = new Date(agent.expiresAt).getTime();
      if (expires < now && agent.status !== 'offline') {
        agent.status = 'offline';
      }
      return agent;
    });
  }
}

export const globalAgentRegistry = new AgentRegistry();
