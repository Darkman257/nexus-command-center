export interface ApplicationManifest {
  id: string;
  version: string;
  permissions: string[];
  capabilities: string[];
  routes: { path: string; method: 'GET' | 'POST' }[];
  menus?: { label: string; route: string }[];
  icons?: string[];
  healthChecks?: string[];
}

export interface Application {
  id: string;
  name: string;
  manifest: ApplicationManifest;
  health: 'healthy' | 'unhealthy';
}

export interface IApplicationRegistry {
  register(app: Application): void;
  getApps(): Application[];
  getApp(id: string): Application | undefined;
}

export interface ExecutorRef {
  type: 'agent' | 'app' | 'human' | 'webhook';
  id: string;
  priority: number;
  weight: number;
  enabled: boolean;
  health: 'healthy' | 'unhealthy';
  latencyMs: number;
  costScore: number;
  maxConcurrency: number;
  endpoint?: string;
}

export interface Capability {
  id: string; // e.g. "Fleet.AssignDriver"
  name: string;
  executors: ExecutorRef[];
}

export interface ICapabilityRegistry {
  register(cap: Capability): void;
  getCapabilities(): Capability[];
  getCapability(id: string): Capability | undefined;
}

export interface Module {
  id: string;
  appId: string;
  name: string;
  enabled: boolean;
  capabilities: string[];
}

export interface IModuleRegistry {
  register(mod: Module): void;
  getModules(): Module[];
  getModulesByApp(appId: string): Module[];
}

export interface ServiceAdapter {
  id: string;
  type: 'database' | 'llm' | 'messenger' | 'automation' | 'ocr';
  endpoint: string;
  version: string;
  health: 'healthy' | 'unhealthy';
  capabilities: string[];
  authentication: 'none' | 'token' | 'basic' | 'oauth';
  lastHeartbeat: string;
}

export interface IServiceRegistry {
  register(srv: ServiceAdapter): void;
  getServices(): ServiceAdapter[];
  getService(id: string): ServiceAdapter | undefined;
}

export interface Workspace {
  id: string;
  name: string;
  tenant: string;
  environment: 'development' | 'production' | 'sandbox';
  applications: string[];
  policies: string[];
  featureFlags: Record<string, boolean>;
}

export interface IWorkspaceRegistry {
  register(ws: Workspace): void;
  getWorkspaces(): Workspace[];
  getWorkspace(id: string): Workspace | undefined;
}
