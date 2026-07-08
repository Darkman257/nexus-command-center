import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { NexusEvent } from './EventContracts';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
  : null;

export async function readEventsForAggregate(aggregateId: string): Promise<NexusEvent[]> {
  // 1. Attempt database load if configured
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('nexus_event_store')
        .select('*')
        .or(`entity_id.eq.${aggregateId},payload->>vehicleId.eq.${aggregateId},payload->>candidateId.eq.${aggregateId},payload->>id.eq.${aggregateId}`);

      if (!error && data && data.length > 0) {
        const events: NexusEvent[] = data.map(row => ({
          id: row.id,
          timestamp: row.timestamp,
          workspace: row.workspace,
          source: row.source,
          type: row.event_type,
          entity: {
            type: row.entity_type,
            id: row.entity_id,
            name: row.entity_name
          },
          payload: row.payload,
          severity: row.severity as any,
          correlationId: row.correlation_id,
          version: row.version,
          metadata: row.metadata
        }));
        return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      }
    } catch (dbErr: any) {
      console.warn(`[EventStore] Supabase read failed, falling back to local file. Error: ${dbErr.message}`);
    }
  }

  // 2. Local File Fallback
  const logPath = path.join(__dirname, '..', '..', 'data', 'nexus-events.jsonl');
  if (!fs.existsSync(logPath)) return [];

  const content = fs.readFileSync(logPath, 'utf8');
  const events: NexusEvent[] = [];

  const lines = content.split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const event: NexusEvent = JSON.parse(line);
      if (
        event.payload?.vehicleId === aggregateId ||
        event.payload?.candidateId === aggregateId ||
        event.payload?.id === aggregateId ||
        event.entity?.id === aggregateId
      ) {
        events.push(event);
      }
    } catch (err) {
      // Ignore parse errors on empty/corrupted lines
    }
  }

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export async function getLastEventSignature(): Promise<string | undefined> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('nexus_event_store')
        .select('metadata')
        .order('timestamp', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        return data[0].metadata?.signature;
      }
    } catch (dbErr: any) {
      // Ignore and fallback to file
    }
  }

  const logPath = path.join(__dirname, '..', '..', 'data', 'nexus-events.jsonl');
  if (!fs.existsSync(logPath)) return undefined;

  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length === 0) return undefined;

  try {
    const lastEvent: NexusEvent = JSON.parse(lines[lines.length - 1]);
    return lastEvent.metadata?.signature;
  } catch (err) {
    return undefined;
  }
}

export function computeEventSignature(event: NexusEvent): string {
  const payloadToSign = JSON.stringify({
    id: event.id,
    timestamp: event.timestamp,
    type: event.type,
    payload: event.payload,
    previousSignature: event.metadata.previousSignature || 'GENESIS'
  });
  
  const secret = process.env.EVENT_STORE_SECRET || 'nexus-default-secret-key-2024';
  return crypto.createHmac('sha256', secret).update(payloadToSign).digest('hex');
}

export async function appendEvent(event: NexusEvent): Promise<void> {
  const previousSignature = await getLastEventSignature();
  
  if (!event.metadata) {
    event.metadata = {} as any;
  }
  event.metadata.previousSignature = previousSignature || 'GENESIS';
  event.metadata.signature = computeEventSignature(event);

  // 1. Attempt database write
  if (supabase) {
    try {
      const { error } = await supabase
        .from('nexus_event_store')
        .insert([{
          workspace: event.workspace,
          source: event.source,
          event_type: event.type,
          entity_type: event.entity.type,
          entity_id: event.entity.id,
          entity_name: event.entity.name,
          payload: event.payload,
          severity: event.severity,
          correlation_id: event.correlationId,
          version: event.version,
          metadata: event.metadata,
          timestamp: event.timestamp
        }]);

      if (!error) {
        console.log(`[EventStore] Successfully persisted event "${event.type}" to Supabase.`);
        return;
      }
      console.warn(`[EventStore] Supabase insert failed: ${error.message}. Falling back to file append.`);
    } catch (dbErr: any) {
      console.warn(`[EventStore] Supabase write failed, falling back to file. Error: ${dbErr.message}`);
    }
  }

  // 2. Local File Fallback
  const logPath = path.join(__dirname, '..', '..', 'data', 'nexus-events.jsonl');
  const line = JSON.stringify(event) + '\n';
  fs.appendFileSync(logPath, line, 'utf8');
}
