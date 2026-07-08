import { IApplicationRegistry, Application } from './Registries';

export class ApplicationRegistry implements IApplicationRegistry {
  private apps = new Map<string, Application>();

  register(app: Application): void {
    this.apps.set(app.id, app);
  }

  getApps(): Application[] {
    return Array.from(this.apps.values());
  }

  getApp(id: string): Application | undefined {
    return this.apps.get(id);
  }
}

export const globalApplicationRegistry = new ApplicationRegistry();
