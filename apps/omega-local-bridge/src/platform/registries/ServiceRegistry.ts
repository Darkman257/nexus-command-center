import { IServiceRegistry, ServiceAdapter } from './Registries';

export class ServiceRegistry implements IServiceRegistry {
  private services = new Map<string, ServiceAdapter>();

  register(srv: ServiceAdapter): void {
    this.services.set(srv.id, srv);
  }

  getServices(): ServiceAdapter[] {
    return Array.from(this.services.values());
  }

  getService(id: string): ServiceAdapter | undefined {
    return this.services.get(id);
  }
}

export const globalServiceRegistry = new ServiceRegistry();
