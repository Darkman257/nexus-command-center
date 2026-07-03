import { globalCommandRegistry } from './CommandRegistry';
import { globalMemoryRepository } from '../memory/MemoryRepository';

export function registerAllCommands() {
  console.log('Registering system commands...');

  // 1. AssignDriver Command
  globalCommandRegistry.register(
    'AssignDriver',
    (payload) => {
      if (!payload.vehicleId) throw new Error('vehicleId is required');
      if (!payload.driverName) throw new Error('driverName is required');
    },
    async (payload) => {
      const entities = globalMemoryRepository.getEntities();
      const vehicle = entities.find(e => e.id === payload.vehicleId);
      const currentVersion = vehicle && vehicle.version !== undefined ? Number(vehicle.version) : 1;

      const updatedVehicle = {
        id: payload.vehicleId,
        type: 'vehicle',
        name: vehicle?.name || 'Vehicle',
        driver: payload.driverName,
        version: currentVersion + 1,
      };

      globalMemoryRepository.saveEntity(updatedVehicle);

      return {
        type: 'DriverAssigned',
        entityType: 'vehicle',
        entityId: payload.vehicleId,
        entityName: payload.driverName,
        payload: {
          vehicleId: payload.vehicleId,
          driverName: payload.driverName,
          newVersion: currentVersion + 1,
        }
      };
    }
  );

  // 2. ApproveCandidate Command
  globalCommandRegistry.register(
    'ApproveCandidate',
    (payload) => {
      if (!payload.candidateId) throw new Error('candidateId is required');
      if (!payload.candidateName) throw new Error('candidateName is required');
    },
    async (payload) => {
      const entities = globalMemoryRepository.getEntities();
      const candidate = entities.find(e => e.id === payload.candidateId);
      const currentVersion = candidate && candidate.version !== undefined ? Number(candidate.version) : 1;

      const updatedCandidate = {
        id: payload.candidateId,
        type: 'candidate',
        name: payload.candidateName,
        status: 'Approved',
        version: currentVersion + 1,
      };

      globalMemoryRepository.saveEntity(updatedCandidate);

      return {
        type: 'CandidateApproved',
        entityType: 'candidate',
        entityId: payload.candidateId,
        entityName: payload.candidateName,
        payload: {
          candidateId: payload.candidateId,
          candidateName: payload.candidateName,
          status: 'Approved',
          newVersion: currentVersion + 1,
        }
      };
    }
  );
}
