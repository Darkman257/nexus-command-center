import { globalCapabilityRegistry } from './CapabilityRegistry';
import { ExecutorRef } from './Registries';
import { globalAgentRuntime } from '../agent/AgentRuntime';

export class CapabilityResolver {
  resolveBestExecutor(capabilityId: string): ExecutorRef | undefined {
    const cap = globalCapabilityRegistry.getCapability(capabilityId);
    if (!cap || cap.executors.length === 0) return undefined;

    // Filter and map static registry executors to dynamic runtime state
    const resolvedExecutors = cap.executors.map(exec => {
      if (exec.type === 'agent') {
        const liveAgent = globalAgentRuntime.getAgent(exec.id);
        if (liveAgent) {
          return {
            ...exec,
            enabled: liveAgent.enabled,
            health: liveAgent.health,
            latencyMs: liveAgent.latencyMs,
            costScore: liveAgent.costScore,
            // Track load dynamics: queue size weighs into executor decision
            weight: exec.weight - (liveAgent.activeQueueSize * 10),
            // Custom dynamic properties
            activeQueueSize: liveAgent.activeQueueSize
          };
        }
      }
      return { ...exec, activeQueueSize: 0 };
    });

    // Filter enabled & healthy executors
    const active = resolvedExecutors.filter(e => e.enabled && e.health === 'healthy');
    if (active.length === 0) return undefined;

    // Sort by dynamic metrics: active queue size first (load balance), then priority, then cost, then latency
    return active.sort((a, b) => {
      if (a.activeQueueSize !== b.activeQueueSize) {
        return a.activeQueueSize - b.activeQueueSize;
      }
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      if (a.costScore !== b.costScore) {
        return a.costScore - b.costScore;
      }
      return a.latencyMs - b.latencyMs;
    })[0];
  }
}

export const globalCapabilityResolver = new CapabilityResolver();
