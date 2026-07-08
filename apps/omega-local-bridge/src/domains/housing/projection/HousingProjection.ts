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

export class HousingProjection {
  static async project(event: NexusEvent): Promise<void> {
    const { type, payload } = event;

    if (type === 'Housing.HousingUnitRegistered' || type === 'HousingUnitRegistered') {
      const unitId = String(payload.unitId);
      const name = String(payload.unitName);
      const roomsCount = Number(payload.roomsCount || 0);
      const location = String(payload.location || '');
      const projectId = String(payload.projectId || '');
      const version = payload.version !== undefined ? Number(payload.version) : 1;

      // Project locally to memory repository
      const unitEntity = {
        id: unitId,
        type: 'housing_unit',
        name: name,
        roomsCount: roomsCount,
        capacity: roomsCount * 2,
        location: location,
        projectId: projectId,
        version: version,
      };
      globalMemoryRepository.saveEntity(unitEntity);

      // Project to Supabase housing_units table
      if (supabase) {
        try {
          await supabase
            .from('housing_units')
            .upsert([{
              id: unitId,
              unit_name: name,
              rooms_count: roomsCount,
              capacity: roomsCount * 2,
              location: location,
              project_id: projectId,
              status: 'Active'
            }]);
        } catch (dbErr: any) {
          console.warn(`[HousingProjection] Supabase housing_units sync failed: ${dbErr.message}`);
        }
      }
    }

    if (type === 'Housing.StaffAssignedToUnit' || type === 'StaffAssignedToUnit') {
      const unitId = String(payload.unitId);
      const staffId = String(payload.staffId);
      const projectId = String(payload.projectId || '');
      const newVersion = payload.newVersion !== undefined ? Number(payload.newVersion) : 1;

      // Project locally: add relationship in memory repository
      globalMemoryRepository.saveRelationship({
        id: `${unitId}_${staffId}`,
        from: unitId,
        to: staffId,
        type: 'housed_in'
      });

      // Update unit entity version
      const entities = globalMemoryRepository.getEntities();
      const existing = entities.find(e => e.id === unitId);
      if (existing) {
        existing.version = newVersion;
        globalMemoryRepository.saveEntity(existing);
      }

      // Project to Supabase housing_assignments table
      if (supabase) {
        try {
          await supabase
            .from('housing_assignments')
            .upsert([{
              unit_id: unitId,
              staff_id: staffId,
              project_id: projectId
            }]);
        } catch (dbErr: any) {
          console.warn(`[HousingProjection] Supabase housing_assignments sync failed: ${dbErr.message}`);
        }
      }
    }

    if (type === 'Housing.StaffReleasedFromUnit' || type === 'StaffReleasedFromUnit') {
      const unitId = String(payload.unitId);
      const staffId = String(payload.staffId);
      const newVersion = payload.newVersion !== undefined ? Number(payload.newVersion) : 1;

      // Project locally: delete relationship in memory repository
      globalMemoryRepository.deleteRelationship(`${unitId}_${staffId}`);

      // Update unit entity version
      const entities = globalMemoryRepository.getEntities();
      const existing = entities.find(e => e.id === unitId);
      if (existing) {
        existing.version = newVersion;
        globalMemoryRepository.saveEntity(existing);
      }

      // Project to Supabase housing_assignments table
      if (supabase) {
        try {
          await supabase
            .from('housing_assignments')
            .delete()
            .eq('unit_id', unitId)
            .eq('staff_id', staffId);
        } catch (dbErr: any) {
          console.warn(`[HousingProjection] Supabase housing_assignments delete failed: ${dbErr.message}`);
        }
      }
    }
  }
}
