export type WorkspaceNamespace = 'nexus' | 'omega' | 'recruitment' | 'supplier' | 'fleet' | 'housing';

export interface WorkspaceRuntimeScope {
  namespace: WorkspaceNamespace;
  label: string;
  enabled: boolean;
  eventTypes: string[];
  memoryLimit: number;
}

export const WORKSPACE_SCOPES: Record<WorkspaceNamespace, WorkspaceRuntimeScope> = {
  nexus: {
    namespace: 'nexus',
    label: 'NEXUS Command Center Core',
    enabled: true,
    eventTypes: ['nexus.*', 'system.*'],
    memoryLimit: 200
  },
  omega: {
    namespace: 'omega',
    label: 'Omega Operations Portal',
    enabled: true,
    eventTypes: ['omega.*', 'fleet.*', 'housing.*'],
    memoryLimit: 150
  },
  recruitment: {
    namespace: 'recruitment',
    label: 'Recruitment Intake Hub',
    enabled: true,
    eventTypes: ['recruitment.*'],
    memoryLimit: 100
  },
  supplier: {
    namespace: 'supplier',
    label: 'Supplier Intake Portal',
    enabled: true,
    eventTypes: ['supplier.*'],
    memoryLimit: 100
  },
  fleet: {
    namespace: 'fleet',
    label: 'Fleet Refuel Operations',
    enabled: true,
    eventTypes: ['fleet.*'],
    memoryLimit: 100
  },
  housing: {
    namespace: 'housing',
    label: 'Staff Housing Ingestion',
    enabled: true,
    eventTypes: ['housing.*'],
    memoryLimit: 100
  }
};
