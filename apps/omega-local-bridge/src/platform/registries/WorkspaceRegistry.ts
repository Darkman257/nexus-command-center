import { IWorkspaceRegistry, Workspace } from './Registries';

export class WorkspaceRegistry implements IWorkspaceRegistry {
  private workspaces = new Map<string, Workspace>();

  register(ws: Workspace): void {
    this.workspaces.set(ws.id, ws);
  }

  getWorkspaces(): Workspace[] {
    return Array.from(this.workspaces.values());
  }

  getWorkspace(id: string): Workspace | undefined {
    return this.workspaces.get(id);
  }
}

export const globalWorkspaceRegistry = new WorkspaceRegistry();
