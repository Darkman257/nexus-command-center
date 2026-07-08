import { globalApplicationRegistry } from '../registries/ApplicationRegistry';
import { globalCapabilityRegistry } from '../registries/CapabilityRegistry';
import { globalModuleRegistry } from '../registries/ModuleRegistry';
import { globalServiceRegistry } from '../registries/ServiceRegistry';
import { globalWorkspaceRegistry } from '../registries/WorkspaceRegistry';

export function bootstrapDefaultRegistries() {
  // 1. Register Omega ERP Application
  globalApplicationRegistry.register({
    id: 'omega-erp',
    name: 'Omega Operations App',
    manifest: {
      id: 'omega-erp',
      version: '1.0.0',
      permissions: ['fleet:write', 'tasks:write', 'recruitment:write'],
      capabilities: ['Fleet.AssignDriver', 'Fleet.RegisterVehicle', 'Recruitment.ApproveCandidate', 'Task.Create'],
      routes: [
        { path: '/omega/snapshot', method: 'GET' },
        { path: '/api/sync/omega-memory', method: 'GET' }
      ]
    },
    health: 'healthy'
  });

  // 2. Register Sub-Modules inside Omega ERP
  globalModuleRegistry.register({
    id: 'fleet-mod',
    appId: 'omega-erp',
    name: 'Fleet Management Module',
    enabled: true,
    capabilities: ['Fleet.AssignDriver', 'Fleet.RegisterVehicle']
  });

  globalModuleRegistry.register({
    id: 'recruitment-mod',
    appId: 'omega-erp',
    name: 'Recruitment Intake Module',
    enabled: true,
    capabilities: ['Recruitment.ApproveCandidate']
  });

  // 3. Register Namespaced capabilities with priority, weight, health metadata
  globalCapabilityRegistry.register({
    id: 'Fleet.AssignDriver',
    name: 'Assign Driver to Vehicle',
    executors: [
      {
        type: 'app',
        id: 'omega-erp',
        priority: 1,
        weight: 100,
        enabled: true,
        health: 'healthy',
        latencyMs: 80,
        costScore: 0,
        maxConcurrency: 15
      }
    ]
  });

  globalCapabilityRegistry.register({
    id: 'Fleet.RegisterVehicle',
    name: 'Register a new vehicle',
    executors: [
      {
        type: 'app',
        id: 'omega-erp',
        priority: 1,
        weight: 100,
        enabled: true,
        health: 'healthy',
        latencyMs: 90,
        costScore: 0,
        maxConcurrency: 5
      }
    ]
  });

  globalCapabilityRegistry.register({
    id: 'Recruitment.ApproveCandidate',
    name: 'Approve a candidate',
    executors: [
      {
        type: 'agent',
        id: 'sally',
        priority: 1,
        weight: 100,
        enabled: true,
        health: 'healthy',
        latencyMs: 1500,
        costScore: 10,
        maxConcurrency: 3
      }
    ]
  });

  globalCapabilityRegistry.register({
    id: 'Task.Create',
    name: 'Create a task',
    executors: [
      {
        type: 'app',
        id: 'omega-erp',
        priority: 1,
        weight: 100,
        enabled: true,
        health: 'healthy',
        latencyMs: 50,
        costScore: 0,
        maxConcurrency: 50
      }
    ]
  });

  // 4. Register Services
  globalServiceRegistry.register({
    id: 'supabase-main',
    type: 'database',
    endpoint: 'https://kbdvcrjifqlunzawkobg.supabase.co',
    version: 'PostgreSQL 15',
    health: 'healthy',
    capabilities: ['data:store', 'auth:store'],
    authentication: 'token',
    lastHeartbeat: new Date().toISOString()
  });

  globalServiceRegistry.register({
    id: 'ollama-local',
    type: 'llm',
    endpoint: 'http://127.0.0.1:11434',
    version: '0.1.48',
    health: 'healthy',
    capabilities: ['llm:complete', 'llm:embeddings'],
    authentication: 'none',
    lastHeartbeat: new Date().toISOString()
  });

  // 5. Register Workspaces (for multi-tenancy support)
  globalWorkspaceRegistry.register({
    id: 'omega-workspace',
    name: 'Omega Operations Hub',
    tenant: 'default-tenant',
    environment: 'development',
    applications: ['omega-erp'],
    policies: ['driver-age-limit', 'vehicle-maintenance-schedule'],
    featureFlags: {
      enableAiAssistance: true,
      enableTelegramIntegration: true
    }
  });
}
