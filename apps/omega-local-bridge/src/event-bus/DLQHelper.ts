import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { NexusEvent } from './EventContracts';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
  : null;

// Maximum number of attempts before an outbox event is moved to the DLQ
export const DLQ_MAX_ATTEMPTS = 5;

export interface DLQEntry {
  event_id: string;
  event_data: NexusEvent;
  original_outbox_id: string;
  failure_reason: string;
  attempts: number;
  first_failed_at: string;
  quarantined_at: string;
}

/**
 * Moves a permanently failing outbox event into the Dead Letter Queue.
 * Attempts Supabase first, then falls back to a local .jsonl file.
 */
export async function sendToDLQ(
  outboxId: string,
  event: NexusEvent,
  attempts: number,
  failureReason: string
): Promise<void> {
  const entry: DLQEntry = {
    event_id: event.id,
    event_data: event,
    original_outbox_id: outboxId,
    failure_reason: failureReason,
    attempts,
    first_failed_at: event.timestamp,
    quarantined_at: new Date().toISOString(),
  };

  console.error(
    `[DLQ] ⚠️  Event "${event.type}" (id: ${event.id}) permanently failed after ${attempts} attempts. Moving to Dead Letter Queue.`
  );

  // 1. Attempt Supabase DLQ insert
  if (supabase) {
    try {
      const { error } = await supabase
        .from('nexus_dead_letter_queue')
        .insert([{
          event_id: entry.event_id,
          event_data: entry.event_data,
          original_outbox_id: entry.original_outbox_id,
          failure_reason: entry.failure_reason,
          attempts: entry.attempts,
          first_failed_at: entry.first_failed_at,
          quarantined_at: entry.quarantined_at,
          status: 'QUARANTINED',
        }]);

      if (!error) {
        console.log(`[DLQ] Event "${event.id}" quarantined in Supabase nexus_dead_letter_queue.`);
        triggerDLQAlert(entry);
        return;
      }

      console.warn(`[DLQ] Supabase DLQ insert failed: ${error.message}. Falling back to local file.`);
    } catch (dbErr: any) {
      console.warn(`[DLQ] Supabase DLQ write error: ${dbErr.message}. Falling back to local file.`);
    }
  }

  // 2. Local file fallback: nexus-dlq.jsonl
  const dlqPath = path.join(__dirname, '..', '..', 'data', 'nexus-dlq.jsonl');
  const dir = path.dirname(dlqPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const line = JSON.stringify(entry) + '\n';
  fs.appendFileSync(dlqPath, line, 'utf8');
  console.log(`[DLQ] Event "${event.id}" quarantined in local nexus-dlq.jsonl.`);

  triggerDLQAlert(entry);
}

/**
 * Emits a structured alert to stdout (and optionally future notification channels).
 * This is where n8n / Webhook / Slack alerts would hook in.
 */
function triggerDLQAlert(entry: DLQEntry): void {
  const alert = {
    level: 'CRITICAL',
    system: 'NEXUS-DLQ',
    message: `Dead Letter Queue Alert: Event permanently quarantined`,
    event_id: entry.event_id,
    event_type: entry.event_data.type,
    entity: entry.event_data.entity,
    attempts: entry.attempts,
    failure_reason: entry.failure_reason,
    quarantined_at: entry.quarantined_at,
    action_required: 'Manual inspection and replay required',
  };

  // Structured log for external monitoring systems (Datadog, CloudWatch, etc.)
  console.error(`[DLQ-ALERT] ${JSON.stringify(alert)}`);

  // TODO: integrate n8n webhook call for operator notification when ready:
  // await fetch(process.env.N8N_DLQ_WEBHOOK_URL, { method: 'POST', body: JSON.stringify(alert) });
}

/**
 * Reads all quarantined DLQ entries from the local fallback file.
 * Used for admin inspection or manual replay tooling.
 */
export function readLocalDLQ(): DLQEntry[] {
  const dlqPath = path.join(__dirname, '..', '..', 'data', 'nexus-dlq.jsonl');
  if (!fs.existsSync(dlqPath)) return [];

  const content = fs.readFileSync(dlqPath, 'utf8');
  const entries: DLQEntry[] = [];

  for (const line of content.split('\n')) {
    if (!line.trim()) continue;
    try {
      entries.push(JSON.parse(line) as DLQEntry);
    } catch {
      // skip corrupted lines
    }
  }

  return entries;
}
