import { NexusEvent } from '../../../event-bus/EventContracts';
import { globalMemoryRepository } from '../../../memory/MemoryRepository';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
  : null;

export class TaskProjection {
  static async project(event: NexusEvent): Promise<void> {
    const { type, payload } = event;

    if (type === 'Task.TaskCreated' || type === 'TaskCreated') {
      const taskId = String(payload.id);
      const title = String(payload.title);
      const description = String(payload.description || '');
      const status = String(payload.status || 'Pending');
      const version = payload.version !== undefined ? Number(payload.version) : 1;

      const task = {
        id: taskId,
        title: title,
        description: description,
        status: status,
        version: version,
      };

      globalMemoryRepository.saveTask(task);

      // Dynamic Supabase sync
      if (supabase) {
        try {
          await supabase
            .from('site_admin_tasks')
            .upsert([{
              id: taskId,
              title: title,
              status: status
            }]);
        } catch (dbErr: any) {
          console.warn(`[TaskProjection] Database sync failed: ${dbErr.message}`);
        }
      }
    }
  }
}
