export type JournalEntryType = 'false_positive' | 'useful_signal' | 'ignored_telemetry' | 'suppression_issue';

export interface JournalEntry {
  id: string;
  type: JournalEntryType;
  timestamp: string;
  context: Record<string, any>;
}

const JOURNAL_STORAGE_KEY = 'nexus_operational_journal';
const MAX_JOURNAL_ENTRIES = 500;

class OperationalJournal {
  private entries: JournalEntry[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(JOURNAL_STORAGE_KEY);
      if (stored) {
        this.entries = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('NEXUS: Failed to load operational journal from localStorage', e);
    }
  }

  private saveToStorage() {
    try {
      // Keep only the most recent N entries to prevent memory leaks and localStorage limits
      if (this.entries.length > MAX_JOURNAL_ENTRIES) {
        this.entries = this.entries.slice(this.entries.length - MAX_JOURNAL_ENTRIES);
      }
      localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(this.entries));
    } catch (e) {
      console.warn('NEXUS: Failed to save operational journal to localStorage', e);
    }
  }

  private logEvent(type: JournalEntryType, context: Record<string, any>) {
    const entry: JournalEntry = {
      id: `jnl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      timestamp: new Date().toISOString(),
      context
    };
    
    this.entries.push(entry);
    this.saveToStorage();
    
    // Optional: could emit to runtimeBus here if real-time awareness is needed
  }

  public logFalsePositive(context: Record<string, any>) {
    this.logEvent('false_positive', context);
  }

  public logUsefulSignal(context: Record<string, any>) {
    this.logEvent('useful_signal', context);
  }

  public logIgnoredTelemetry(context: Record<string, any>) {
    this.logEvent('ignored_telemetry', context);
  }

  public logSuppressionIssue(context: Record<string, any>) {
    this.logEvent('suppression_issue', context);
  }

  public getOperationalPatterns(): JournalEntry[] {
    return this.entries;
  }

  public clear() {
    this.entries = [];
    this.saveToStorage();
  }
}

export const globalOperationalJournal = new OperationalJournal();
export default globalOperationalJournal;
