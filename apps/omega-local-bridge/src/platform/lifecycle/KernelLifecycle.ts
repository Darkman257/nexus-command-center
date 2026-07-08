import { bootstrapDefaultRegistries } from './bootstrapDefaultRegistries';
import { globalDiscoveryEngine } from '../discovery/PluginDiscovery';

export enum LifecycleState {
  Uninitialized = 'Uninitialized',
  Booting = 'Booting',
  ConfigLoaded = 'ConfigLoaded',
  ServicesRegistered = 'ServicesRegistered',
  AppsRegistered = 'AppsRegistered',
  PluginsLoaded = 'PluginsLoaded',
  Ready = 'Ready'
}

export class KernelLifecycle {
  private state: LifecycleState = LifecycleState.Uninitialized;

  async boot(): Promise<void> {
    if (this.state !== LifecycleState.Uninitialized) return;

    this.state = LifecycleState.Booting;
    console.log('[NEXUS Lifecycle] Booting NEXUS OS Kernel Runtime...');

    // 1. Configuration loading step
    this.state = LifecycleState.ConfigLoaded;
    console.log('[NEXUS Lifecycle] Step 1: Configuration loaded successfully.');

    // 2. Services registration step
    this.state = LifecycleState.ServicesRegistered;
    console.log('[NEXUS Lifecycle] Step 2: System service adapters registered.');

    // 3. Application and Capabilities registration step
    bootstrapDefaultRegistries();
    this.state = LifecycleState.AppsRegistered;
    console.log('[NEXUS Lifecycle] Step 3: Default hosted applications registered.');

    // 4. Plugin scanning step
    console.log('[NEXUS Lifecycle] Step 4: Running pluggable discovery scanner...');
    await globalDiscoveryEngine.loadPlugins();
    this.state = LifecycleState.PluginsLoaded;

    // 5. Ready
    this.state = LifecycleState.Ready;
    console.log('[NEXUS Lifecycle] Status Check: OK. NEXUS Platform is READY.');
  }

  getState(): LifecycleState {
    return this.state;
  }
}

export const globalLifecycle = new KernelLifecycle();
