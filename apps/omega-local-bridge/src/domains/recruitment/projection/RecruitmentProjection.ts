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

export class RecruitmentProjection {
  static async project(event: NexusEvent): Promise<void> {
    const { type, payload } = event;

    if (type === 'Recruitment.CandidateApproved' || type === 'CandidateApproved') {
      const candidateId = String(payload.candidateId);
      const candidateName = String(payload.candidateName);
      const status = String(payload.status || 'Approved');
      const newVersion = payload.newVersion !== undefined ? Number(payload.newVersion) : 1;

      const updatedCandidate = {
        id: candidateId,
        type: 'candidate',
        name: candidateName,
        status: status,
        version: newVersion,
      };

      globalMemoryRepository.saveEntity(updatedCandidate);

      // Dynamic Supabase sync
      if (supabase) {
        try {
          await supabase
            .from('recruitment_candidates')
            .update({ status: 'Approved' })
            .eq('id', candidateId);
        } catch (dbErr: any) {
          console.warn(`[RecruitmentProjection] Database sync failed: ${dbErr.message}`);
        }
      }
    }
  }
}
