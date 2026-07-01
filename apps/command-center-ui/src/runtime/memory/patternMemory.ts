import type { RuntimeEvent } from '../contracts/runtimeEvent';

export interface ClusteredPattern {
  id: string;
  eventType: string;
  workspace: string;
  frequency: number;
  firstObserved: string;
  lastObserved: string;
  confidence: number;
}

const PATTERN_MEMORY_KEY = 'nexus_pattern_memory';
const MAX_STORED_EVENTS = 1000;
const CLUSTER_TIME_WINDOW_MS = 60 * 60 * 1000; // 1 hour rolling window for clusters

class PatternMemory {
  private eventHistory: RuntimeEvent[] = [];
  private knownPatterns: ClusteredPattern[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(PATTERN_MEMORY_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.eventHistory = data.eventHistory || [];
        this.knownPatterns = data.knownPatterns || [];
      }
    } catch (e) {
      console.warn('NEXUS: Failed to load pattern memory from localStorage', e);
    }
  }

  private saveToStorage() {
    try {
      // Keep array sizes in check
      if (this.eventHistory.length > MAX_STORED_EVENTS) {
        this.eventHistory = this.eventHistory.slice(this.eventHistory.length - MAX_STORED_EVENTS);
      }
      
      const payload = {
        eventHistory: this.eventHistory,
        knownPatterns: this.knownPatterns
      };
      localStorage.setItem(PATTERN_MEMORY_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('NEXUS: Failed to save pattern memory to localStorage', e);
    }
  }

  public registerPattern(event: RuntimeEvent) {
    this.eventHistory.push(event);
    this.detectClusteredBehavior(event.event_type, event.workspace);
    this.saveToStorage();
  }

  public getRecurringPatterns(): ClusteredPattern[] {
    return this.knownPatterns;
  }

  public calculatePatternFrequency(eventType: string, timeWindowMs: number = CLUSTER_TIME_WINDOW_MS): number {
    const now = Date.now();
    return this.eventHistory.filter(e => {
      const eTime = new Date(e.timestamp).getTime();
      return e.event_type === eventType && (now - eTime) <= timeWindowMs;
    }).length;
  }

  public detectClusteredBehavior(eventType: string, workspace: string) {
    const frequency = this.calculatePatternFrequency(eventType, CLUSTER_TIME_WINDOW_MS);
    
    // Simple clustering logic: if an event happens 3 or more times in the window, it's a cluster.
    if (frequency >= 3) {
      const existingPattern = this.knownPatterns.find(p => p.eventType === eventType && p.workspace === workspace);
      
      if (existingPattern) {
        existingPattern.frequency = frequency;
        existingPattern.lastObserved = new Date().toISOString();
        // Slightly increase confidence on repeated clustering
        existingPattern.confidence = Math.min(100, existingPattern.confidence + 5);
      } else {
        this.knownPatterns.push({
          id: `pat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          eventType,
          workspace,
          frequency,
          firstObserved: new Date().toISOString(),
          lastObserved: new Date().toISOString(),
          confidence: 60 // Baseline confidence for a new cluster
        });
      }
    }
  }

  public clear() {
    this.eventHistory = [];
    this.knownPatterns = [];
    this.saveToStorage();
  }
}

export const globalPatternMemory = new PatternMemory();
export default globalPatternMemory;
