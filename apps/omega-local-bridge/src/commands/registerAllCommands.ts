import { globalCommandRegistry } from './CommandRegistry';
import { FleetCommandHandlers } from '../domains/fleet/commands/FleetCommandHandlers';
import { RecruitmentCommandHandlers } from '../domains/recruitment/commands/RecruitmentCommandHandlers';
import { TaskCommandHandlers } from '../domains/task/commands/TaskCommandHandlers';
import { HousingCommandHandlers } from '../domains/housing/commands/HousingCommandHandlers';

export function registerAllCommands() {
  console.log('Registering system commands...');

  // 1. AssignDriver Command delegated to DDD Domain handler
  globalCommandRegistry.register(
    'AssignDriver',
    (payload) => {
      if (!payload.vehicleId) throw new Error('vehicleId is required');
      if (!payload.driverName) throw new Error('driverName is required');
    },
    async (payload) => {
      await FleetCommandHandlers.handleAssignDriver({
        vehicleId: String(payload.vehicleId),
        driverName: String(payload.driverName),
        expectedVersion: payload.expectedVersion !== undefined ? Number(payload.expectedVersion) : undefined
      });
      return null; // Return null event since the domain handler writes namespaced events to the store directly
    }
  );

  // 2. ApproveCandidate Command delegated to DDD Domain handler
  globalCommandRegistry.register(
    'ApproveCandidate',
    (payload) => {
      if (!payload.candidateId) throw new Error('candidateId is required');
      if (!payload.candidateName) throw new Error('candidateName is required');
    },
    async (payload) => {
      await RecruitmentCommandHandlers.handleApprove({
        candidateId: String(payload.candidateId),
        candidateName: String(payload.candidateName),
        expectedVersion: payload.expectedVersion !== undefined ? Number(payload.expectedVersion) : undefined
      });
      return null;
    }
  );

  // 3. RegisterVehicle Command delegated to DDD Domain handler
  globalCommandRegistry.register(
    'RegisterVehicle',
    (payload) => {
      if (!payload.vehicleId) throw new Error('vehicleId is required');
      if (!payload.name) throw new Error('name is required');
    },
    async (payload) => {
      await FleetCommandHandlers.handleRegister({
        vehicleId: String(payload.vehicleId),
        name: String(payload.name)
      });
      return null; // Return null event since the domain handler writes namespaced events to the store directly
    }
  );

  // 4. CreateTask Command delegated to DDD Domain handler
  globalCommandRegistry.register(
    'CreateTask',
    (payload) => {
      if (!payload.title) throw new Error('title is required');
    },
    async (payload) => {
      const taskId = payload.taskId || `task_${Math.random().toString(36).substring(2, 9)}`;
      await TaskCommandHandlers.handleCreate({
        taskId: String(taskId),
        title: String(payload.title),
        description: String(payload.description || ''),
        status: payload.status ? String(payload.status) : undefined
      });
      return null;
    }
  );

  // 5. RegisterHousingUnit Command delegated to DDD Domain handler
  globalCommandRegistry.register(
    'RegisterHousingUnit',
    (payload) => {
      if (!payload.unitId) throw new Error('unitId is required');
      if (!payload.name) throw new Error('name is required');
      if (!payload.roomsCount) throw new Error('roomsCount is required');
    },
    async (payload) => {
      await HousingCommandHandlers.handleRegisterUnit({
        unitId: String(payload.unitId),
        name: String(payload.name),
        roomsCount: Number(payload.roomsCount),
        location: String(payload.location || ''),
        projectId: String(payload.projectId || '')
      });
      return null;
    }
  );

  // 6. AssignStaffToUnit Command delegated to DDD Domain handler
  globalCommandRegistry.register(
    'AssignStaffToUnit',
    (payload) => {
      if (!payload.unitId) throw new Error('unitId is required');
      if (!payload.staffId) throw new Error('staffId is required');
    },
    async (payload) => {
      await HousingCommandHandlers.handleAssignStaff({
        unitId: String(payload.unitId),
        staffId: String(payload.staffId),
        expectedVersion: payload.expectedVersion !== undefined ? Number(payload.expectedVersion) : undefined
      });
      return null;
    }
  );

  // 7. ReleaseStaffFromUnit Command delegated to DDD Domain handler
  globalCommandRegistry.register(
    'ReleaseStaffFromUnit',
    (payload) => {
      if (!payload.unitId) throw new Error('unitId is required');
      if (!payload.staffId) throw new Error('staffId is required');
    },
    async (payload) => {
      await HousingCommandHandlers.handleReleaseStaff({
        unitId: String(payload.unitId),
        staffId: String(payload.staffId)
      });
      return null;
    }
  );
}
