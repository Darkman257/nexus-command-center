import { NexusEvent } from '../../event-bus/EventContracts';

export interface ApplicationPlugin {
  id: string;
  manifest: any;
  initialize(): Promise<void>;
}

export interface DomainPlugin {
  domainName: string;
  initialize(): Promise<void>;
}

export interface CapabilityProvider {
  capabilityId: string;
  execute(payload: Record<string, unknown>, context?: Record<string, unknown>): Promise<any>;
}

export interface ProjectionProvider {
  supportedEvents: string[];
  project(event: NexusEvent): Promise<void>;
}

export interface PolicyProvider {
  evaluate(): Promise<any[]>;
}
