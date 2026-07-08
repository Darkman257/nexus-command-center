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

export class FleetProjection {
  static async project(event: NexusEvent): Promise<void> {
    const { type, payload } = event;

    if (type === 'Fleet.VehicleRegistered' || type === 'VehicleRegistered') {
      const vehicleId = String(payload.vehicleId);
      const name = String(payload.name);
      const driver = String(payload.driver || '');
      const version = payload.version !== undefined ? Number(payload.version) : 1;

      const vehicle = {
        id: vehicleId,
        type: 'vehicle',
        name: name,
        driver: driver,
        version: version,
      };

      globalMemoryRepository.saveEntity(vehicle);

      // Dynamic Supabase sync
      if (supabase) {
        try {
          await supabase
            .from('vehicles')
            .upsert([{
              id: vehicleId,
              car_name: name,
              status: 'Active',
              driver: driver
            }]);
        } catch (dbErr: any) {
          console.warn(`[FleetProjection] Database sync failed: ${dbErr.message}`);
        }
      }
    }

    if (type === 'Fleet.DriverAssigned' || type === 'DriverAssigned') {
      const vehicleId = String(payload.vehicleId);
      const driverName = String(payload.driverName);
      const newVersion = payload.newVersion !== undefined ? Number(payload.newVersion) : 1;

      const entities = globalMemoryRepository.getEntities();
      const existing = entities.find(e => e.id === vehicleId);
      const vehicleName = existing?.name || 'Vehicle';

      const updated = {
        id: vehicleId,
        type: 'vehicle',
        name: vehicleName,
        driver: driverName,
        version: newVersion,
      };

      globalMemoryRepository.saveEntity(updated);

      // Dynamic Supabase sync
      if (supabase) {
        try {
          await supabase
            .from('vehicles')
            .update({ driver: driverName })
            .eq('id', vehicleId);
        } catch (dbErr: any) {
          console.warn(`[FleetProjection] Database sync failed: ${dbErr.message}`);
        }
      }
    }
  }
}
