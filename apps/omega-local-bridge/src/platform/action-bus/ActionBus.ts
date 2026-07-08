import * as fs from 'fs';
import * as path from 'path';
import { globalCapabilityResolver } from '../registries/CapabilityResolver';
import { systemClock } from '../../utils/SystemClock';

export interface ActionEnvelope {
  actionId: string;
  capabilityId: string;
  payload: Record<string, unknown>;
  timestamp: string;
  correlationId: string;
  status: 'pending' | 'resolved' | 'failed';
  error?: string;
}

export interface IActionBus {
  dispatch(action: Omit<ActionEnvelope, 'actionId' | 'timestamp' | 'status'>): Promise<any>;
  getHistory(): ActionEnvelope[];
}

export class DefaultActionBus implements IActionBus {
  private auditPath: string;
  private history: ActionEnvelope[] = [];

  constructor() {
    this.auditPath = path.join(__dirname, '..', '..', '..', 'data', 'action-audit.jsonl');
    const dir = path.dirname(this.auditPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async dispatch(actionInput: Omit<ActionEnvelope, 'actionId' | 'timestamp' | 'status'>): Promise<any> {
    const actionId = `act_${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = systemClock.now();
    
    const envelope: ActionEnvelope = {
      ...actionInput,
      actionId,
      timestamp,
      status: 'pending'
    };

    this.history.push(envelope);
    this.logAudit(envelope);

    console.log(`[ActionBus] Dispatching action ${actionId} for capability: ${actionInput.capabilityId}`);

    // Resolve best executor
    const executor = globalCapabilityResolver.resolveBestExecutor(actionInput.capabilityId);
    if (!executor) {
      const errorMsg = `No executor resolved for capability ${actionInput.capabilityId}`;
      envelope.status = 'failed';
      envelope.error = errorMsg;
      this.logAudit(envelope);
      throw new Error(errorMsg);
    }

    try {
      console.log(`[ActionBus] Action resolved to executor: ${executor.type}:${executor.id}`);
      
      // Handle Agent queue tracking
      if (executor.type === 'agent') {
        const { globalAgentRuntime } = require('../agent/AgentRuntime');
        globalAgentRuntime.incrementQueue(executor.id);
        setTimeout(() => {
          globalAgentRuntime.decrementQueue(executor.id);
        }, 1000);
      }

      // Handle Webhook capability execution
      if (executor.type === 'webhook' && executor.endpoint) {
        try {
          console.log(`[ActionBus] Posting action payload to webhook endpoint: ${executor.endpoint}`);
          // Node 18+ global fetch
          await fetch(executor.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actionId, capabilityId: actionInput.capabilityId, payload: actionInput.payload })
          });
        } catch (webhookErr: any) {
          console.warn(`[ActionBus] Webhook execution warned/failed: ${webhookErr.message}`);
        }
      }

      // Complete resolve status
      envelope.status = 'resolved';
      this.logAudit(envelope);
      return { status: 'RESOLVED', executor, actionId };
    } catch (err: any) {
      envelope.status = 'failed';
      envelope.error = err.message;
      this.logAudit(envelope);
      throw err;
    }
  }

  getHistory(): ActionEnvelope[] {
    return this.history;
  }

  private logAudit(envelope: ActionEnvelope) {
    try {
      fs.appendFileSync(this.auditPath, JSON.stringify(envelope) + '\n', 'utf8');
    } catch (err) {
      console.error('Failed to write action audit log:', err);
    }
  }
}

export const globalActionBus = new DefaultActionBus();
