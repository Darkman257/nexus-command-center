import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName: string) {
  const { count, error } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
  if (error) {
    return `${tableName}: ${error.message}`;
  }
  return `${tableName}: ${count} rows`;
}

async function run() {
  const tables = [
    'recruitment_candidates',
    'recruitment_job_positions',
    'recruitment_interviews',
    'recruitment_onboarding_queue',
    'recruitment_profiles',
    'recruitment_call_logs',
    'recruitment_status_history',
    'recruitment_documents'
  ];
  
  for (const table of tables) {
    console.log(await checkTable(table));
  }
}

run();
