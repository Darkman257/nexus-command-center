import { NexusEvent } from './EventContracts';
import { sendToDLQ, DLQ_MAX_ATTEMPTS } from './DLQHelper';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
  : null;

export class OutboxProcessor {
  private localQueue: NexusEvent[] = [];
  private processing = false;

  async enqueue(event: NexusEvent): Promise<void> {
    // 1. If Supabase is configured, write to db outbox table
    if (supabase) {
      try {
        const { error } = await supabase
          .from('nexus_outbox')
          .insert([{
            event_id: event.id,
            event_data: event,
            status: 'PENDING',
            attempts: 0
          }]);

        if (!error) {
          console.log(`[Outbox] Event "${event.id}" written to Supabase transactional outbox.`);
          // Trigger asynchronous processing
          this.triggerProcess();
          return;
        }
      } catch (dbErr: any) {
        console.warn(`[Outbox] Supabase insert failed, falling back to memory queue: ${dbErr.message}`);
      }
    }

    // 2. Memory queue fallback
    this.localQueue.push(event);
    this.triggerProcess();
  }

  private triggerProcess(): void {
    if (this.processing) return;
    this.processing = true;

    // Run outbox loop asynchronously to keep it decoupled from thread lifecycle
    setImmediate(() => {
      this.processOutbox()
        .catch(err => console.error('[Outbox Processor Loop Error]', err))
        .finally(() => {
          this.processing = false;
        });
    });
  }

  private async processOutbox(): Promise<void> {
    // Process local in-memory fallback queue first
    while (this.localQueue.length > 0) {
      const event = this.localQueue.shift();
      if (event) {
        console.log(`[Outbox Processor] Dispatching local memory queue event: ${event.type}`);
        // Here we could publish to dynamic webhook executors or projections
      }
    }

    // Process database queue if Supabase is connected
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('nexus_outbox')
          .select('*')
          .eq('status', 'PENDING')
          .limit(10);

        if (!error && data && data.length > 0) {
          for (const item of data) {
            try {
              // Simulates message dispatching to remote capability receivers
              console.log(`[Outbox Processor] Dynamic dispatching outbox event: ${item.event_data.type}`);
              
              // Mark as processed successfully
              await supabase
                .from('nexus_outbox')
                .update({ status: 'PROCESSED', processed_at: new Date().toISOString() })
                .eq('id', item.id);
            } catch (dispatchErr: any) {
              const nextAttempts = item.attempts + 1;

              if (nextAttempts >= DLQ_MAX_ATTEMPTS) {
                // Move permanently failed event to Dead Letter Queue
                await sendToDLQ(
                  String(item.id),
                  item.event_data as NexusEvent,
                  nextAttempts,
                  dispatchErr?.message || 'Unknown dispatch failure'
                );

                // Mark outbox row as DLQ so it won't be retried
                await supabase
                  .from('nexus_outbox')
                  .update({ status: 'DLQ', attempts: nextAttempts })
                  .eq('id', item.id);
              } else {
                // Still within retry budget — keep as PENDING
                await supabase
                  .from('nexus_outbox')
                  .update({ status: 'PENDING', attempts: nextAttempts })
                  .eq('id', item.id);
              }
            }
          }
        }
      } catch (dbErr: any) {
        // Suppress DB queue poll warnings if table does not exist
      }
    }
  }
}

export const globalOutboxProcessor = new OutboxProcessor();
