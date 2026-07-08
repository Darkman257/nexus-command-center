import * as fs from 'fs';
import * as path from 'path';
import { globalApplicationRegistry } from '../registries/ApplicationRegistry';
import { globalCapabilityRegistry } from '../registries/CapabilityRegistry';
import { globalModuleRegistry } from '../registries/ModuleRegistry';

export interface IPluginDiscoveryProvider {
  discover(): Promise<any[]>;
}

export class FilesystemPluginProvider implements IPluginDiscoveryProvider {
  private scanDir: string;

  constructor(scanDir: string) {
    this.scanDir = scanDir;
  }

  async discover(): Promise<any[]> {
    const plugins: any[] = [];
    if (!fs.existsSync(this.scanDir)) return plugins;

    try {
      const dirs = fs.readdirSync(this.scanDir);
      for (const d of dirs) {
        const fullPath = path.join(this.scanDir, d);
        if (fs.statSync(fullPath).isDirectory()) {
          const pluginJsonPath = path.join(fullPath, 'plugin.json');
          if (fs.existsSync(pluginJsonPath)) {
            try {
              const content = fs.readFileSync(pluginJsonPath, 'utf8');
              const parsed = JSON.parse(content);
              parsed.dirPath = fullPath; // Save dirPath for executing main entry file
              plugins.push(parsed);
            } catch (err) {
              console.error(`Failed to parse plugin.json at ${pluginJsonPath}:`, err);
            }
          }
        }
      }
    } catch (err) {
      console.error(`Failed to scan plugin directory ${this.scanDir}:`, err);
    }

    return plugins;
  }
}

export class PluginDiscoveryEngine {
  constructor(private provider: IPluginDiscoveryProvider) {}

  async loadPlugins(): Promise<void> {
    const vm = require('vm');
    const manifests = await this.provider.discover();
    for (const manifest of manifests) {
      if (!manifest.id || !manifest.name) continue;

      // 1. Register Application
      globalApplicationRegistry.register({
        id: manifest.id,
        name: manifest.name,
        manifest: {
          id: manifest.id,
          version: manifest.version || '1.0.0',
          permissions: manifest.permissions || [],
          capabilities: manifest.capabilities || [],
          routes: manifest.routes || []
        },
        health: 'healthy'
      });

      // 2. Register Modules
      if (manifest.modules && Array.isArray(manifest.modules)) {
        for (const mod of manifest.modules) {
          globalModuleRegistry.register({
            id: mod.id,
            appId: manifest.id,
            name: mod.name,
            enabled: mod.enabled !== false,
            capabilities: mod.capabilities || []
          });
        }
      }

      // 3. Register Capabilities
      if (manifest.capabilitiesList && Array.isArray(manifest.capabilitiesList)) {
        for (const cap of manifest.capabilitiesList) {
          globalCapabilityRegistry.register({
            id: cap.id,
            name: cap.name,
            executors: cap.executors || []
          });
        }
      }

      // 4. Run Plugin Entry code in isolated VM Sandbox context
      if (manifest.main) {
        const entryFile = path.join(manifest.dirPath || '', manifest.main);
        if (fs.existsSync(entryFile)) {
          try {
            console.log(`[PluginDiscovery] Spawning isolated VM sandbox for plugin "${manifest.id}"`);
            const code = fs.readFileSync(entryFile, 'utf8');
            const sandbox = {
              console: {
                log: (...args: any[]) => console.log(`[Plugin VM:${manifest.id}]`, ...args),
                error: (...args: any[]) => console.error(`[Plugin VM:${manifest.id}]`, ...args),
                warn: (...args: any[]) => console.warn(`[Plugin VM:${manifest.id}]`, ...args),
              },
              process: {
                env: { NODE_ENV: process.env.NODE_ENV }
              },
              setTimeout,
              setInterval
            };
            vm.createContext(sandbox);
            const script = new vm.Script(code, { filename: entryFile });
            script.runInContext(sandbox, { timeout: 1000 }); // limit execution to 1 second
          } catch (vmErr: any) {
            console.error(`[PluginDiscovery] Sandbox error running plugin "${manifest.id}":`, vmErr.message);
          }
        }
      }
    }
  }
}

// Default instance scanning the apps folder
const defaultScanPath = path.join(__dirname, '..', '..', '..', '..'); // Root of monorepo apps/
export const globalDiscoveryEngine = new PluginDiscoveryEngine(
  new FilesystemPluginProvider(path.join(defaultScanPath, 'apps'))
);
