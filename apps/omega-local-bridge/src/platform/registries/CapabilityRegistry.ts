import { ICapabilityRegistry, Capability } from './Registries';

export class CapabilityRegistry implements ICapabilityRegistry {
  private capabilities = new Map<string, Capability>();

  register(cap: Capability): void {
    this.capabilities.set(cap.id, cap);
  }

  getCapabilities(): Capability[] {
    return Array.from(this.capabilities.values());
  }

  getCapability(id: string): Capability | undefined {
    return this.capabilities.get(id);
  }
}

export const globalCapabilityRegistry = new CapabilityRegistry();
