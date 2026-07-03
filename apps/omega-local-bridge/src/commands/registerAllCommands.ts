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

  // 3. RegisterVehicle Command
  globalCommandRegistry.register(
    'RegisterVehicle',
    (payload) => {
      if (!payload.vehicleId) throw new Error('vehicleId is required');
      if (!payload.name) throw new Error('name is required');
    },
    async (payload) => {
      return {
        type: 'VehicleRegistered',
        entityType: 'vehicle',
        entityId: payload.vehicleId,
        entityName: payload.name,
        payload: {
          vehicleId: payload.vehicleId,
          name: payload.name,
          driver: payload.driver || '',
          version: 1
        }
      };
    }
  );

  // 4. CreateTask Command
  globalCommandRegistry.register(
    'CreateTask',
    (payload) => {
      if (!payload.title) throw new Error('title is required');
    },
    async (payload) => {
      const taskId = payload.taskId || `task_${Math.random().toString(36).substring(2, 9)}`;
      return {
        type: 'TaskCreated',
        entityType: 'task',
        entityId: taskId,
        entityName: payload.title,
        payload: {
          id: taskId,
          title: payload.title,
          description: payload.description || '',
          status: payload.status || 'Pending',
          version: 1
        }
      };
    }
  );
}
