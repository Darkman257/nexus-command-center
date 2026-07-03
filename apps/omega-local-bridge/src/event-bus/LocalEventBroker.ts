import * as fs from 'fs';
import * as path from 'path';
import { systemClock } from '../utils/SystemClock';
import type { NexusEvent } from './EventContracts';

export class LocalEventBroker {
  private logPath: string;

  constructor() {
    this.logPath = path.join(__dirname, '..', '..', 'data', 'nexus-events.jsonl');
    const dir = path.dirname(this.logPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async publish(eventInput: Omit<NexusEvent, 'id' | 'timestamp'>): Promise<NexusEvent> {
    const event: NexusEvent = {
      ...eventInput,
      id: `evt_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: systemClock.now(),
    };

    // Append to jsonl file
    const line = JSON.stringify(event) + '\n';
    fs.appendFileSync(this.logPath, line, 'utf8');

    return event;
  }

  async getHistory(limit = 50, sinceTimestamp?: string): Promise<NexusEvent[]> {
    if (!fs.existsSync(this.logPath)) {
      return [];
    }

    const content = fs.readFileSync(this.logPath, 'utf8');
    const events: NexusEvent[] = [];

    const lines = content.split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event: NexusEvent = JSON.parse(line);
        if (sinceTimestamp && new Date(event.timestamp) <= new Date(sinceTimestamp)) {
          continue;
        }
        events.push(event);
      } catch (err) {
        console.error('Failed to parse event log line:', err);
      }
    }

    // Sort by timestamp descending and apply limit
    const sorted = events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return sorted.slice(0, limit);
  }
}

export const globalEventBroker = new LocalEventBroker();
