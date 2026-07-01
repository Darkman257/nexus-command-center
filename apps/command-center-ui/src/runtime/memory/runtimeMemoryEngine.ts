import { runtimePersistence } from './runtimePersistence';
import { WORKSPACE_SCOPES } from '../contracts/workspaceRuntime';
import type { WorkspaceNamespace } from '../contracts/workspaceRuntime';

export interface MemoryObservation {
  memory_id: string;
  workspace: string;
  observation: string;
  timestamp: string;
  source_refs: string[];
  linked_signals: string[];
}

class RuntimeMemoryEngine {
  private memoryCache: MemoryObservation[] = [];

  constructor() {
    this.memoryCache = runtimePersistence.loadObservations();
  }

  appendMemory(
    workspace: string,
    observation: string,
    sourceRefs: string[]
  ): MemoryObservation {
    const memoryId = `mem-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // 1. Enforce Scoped FIFO bounds based on WORKSPACE_SCOPES limits
    const wsNamespace = workspace as WorkspaceNamespace;
    const wsScope = WORKSPACE_SCOPES[wsNamespace];
    const maxLimit = wsScope ? wsScope.memoryLimit : 100; // default safe fallback limit

    const currentWSObservations = this.memoryCache.filter(m => m.workspace === workspace);
    if (currentWSObservations.length >= maxLimit) {
      // Purge oldest chronological observation for this specific workspace
      const oldestRecord = currentWSObservations[0];
      this.memoryCache = this.memoryCache.filter(m => m.memory_id !== oldestRecord.memory_id);
    }

    const entry: MemoryObservation = {
      memory_id: memoryId,
      workspace,
      observation,
      timestamp,
      source_refs: sourceRefs,
      linked_signals: []
    };

    this.memoryCache.push(entry);
    runtimePersistence.saveObservations(this.memoryCache);
    return entry;
  }

  getWorkspaceMemory(workspace: string): MemoryObservation[] {
    return this.memoryCache.filter(m => m.workspace === workspace);
  }

  linkRelatedSignals(memoryId: string, signalId: string) {
    const match = this.memoryCache.find(m => m.memory_id === memoryId);
    if (match) {
      if (!match.linked_signals.includes(signalId)) {
        match.linked_signals.push(signalId);
        runtimePersistence.saveObservations(this.memoryCache);
      }
    }
  }

  getAllMemory(): MemoryObservation[] {
    return this.memoryCache;
  }

  clear() {
    this.memoryCache = [];
    runtimePersistence.clearObservations();
  }
}

export const globalRuntimeMemoryEngine = new RuntimeMemoryEngine();
export default globalRuntimeMemoryEngine;
