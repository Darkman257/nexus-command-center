import { IModuleRegistry, Module } from './Registries';

export class ModuleRegistry implements IModuleRegistry {
  private modules = new Map<string, Module>();

  register(mod: Module): void {
    this.modules.set(mod.id, mod);
  }

  getModules(): Module[] {
    return Array.from(this.modules.values());
  }

  getModulesByApp(appId: string): Module[] {
    return Array.from(this.modules.values()).filter(m => m.appId === appId);
  }
}

export const globalModuleRegistry = new ModuleRegistry();
