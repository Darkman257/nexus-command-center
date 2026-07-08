import * as fs from 'fs';
import * as path from 'path';
import { systemClock } from '../utils/SystemClock';
import { globalCommandRegistry } from './CommandRegistry';
import { globalEventBroker } from '../event-bus/LocalEventBroker';
import { globalMemoryRepository } from '../memory/MemoryRepository';
import { globalProjectionEngine } from '../projections/ProjectionEngine';
import type { NexusCommand, CommandAuditRecord } from './CommandContracts';

export function verifyResourceScope(issuerProjects: string[] | undefined, targetProjectId: string | undefined): boolean {
  if (!targetProjectId) return true;
  const projects = issuerProjects || [];
  return projects.includes('admin') || projects.includes(targetProjectId);
}

export class CommandBus {
  private auditPath: string;
  private executedCommandIds: Set<string> = new Set();

  constructor() {
    this.auditPath = path.join(__dirname, '..', '..', 'data', 'command-audit.jsonl');
    const dir = path.dirname(this.auditPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.loadExecutedIds();
  }

  private loadExecutedIds() {
    if (!fs.existsSync(this.auditPath)) return;
    try {
      const content = fs.readFileSync(this.auditPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const record: CommandAuditRecord = JSON.parse(line);
          if (record.status === 'Succeeded') {
            this.executedCommandIds.add(record.commandId);
          }
        } catch (err) {
          // Ignore malformed line
        }
      }
    } catch (err) {
      console.error('Failed to load executed command IDs from audit logs:', err);
    }
  }

  private logAudit(record: Omit<CommandAuditRecord, 'timestamp'>) {
    const fullRecord: CommandAuditRecord = {
      ...record,
      timestamp: systemClock.now(),
    };
    fs.appendFileSync(this.auditPath, JSON.stringify(fullRecord) + '\n', 'utf8');
  }

  async dispatch(command: NexusCommand): Promise<{ status: string; commandId: string }> {
    const { commandId, type, payload, expectedVersion } = command;

    // 1. Audit Received
    this.logAudit({ commandId, command, status: 'Received' });

    // 2. Idempotency Check
    if (this.executedCommandIds.has(commandId)) {
      const errorMsg = `Command rejected: Duplicate commandId ${commandId} detected (Idempotency failure).`;
      this.logAudit({ commandId, command, status: 'Failed', reason: errorMsg });
      throw new Error(errorMsg);
    }

    try {
      // 3. Resolve Validator and run it
      const validator = globalCommandRegistry.getValidator(type);
      validator(payload);
      this.logAudit({ commandId, command, status: 'Validated' });

      // 3.5 Security / Permission RBAC Check (Global & Resource-Scoped)
      const requiredScopes: Record<string, string[]> = {
        'AssignDriver': ['fleet:write', 'admin'],
        'RegisterVehicle': ['fleet:write', 'admin'],
        'ApproveCandidate': ['recruitment:write', 'admin'],
        'CreateTask': ['tasks:write', 'admin'],
        'RegisterHousingUnit': ['housing:write', 'admin'],
        'AssignStaffToUnit': ['housing:write', 'admin'],
        'ReleaseStaffFromUnit': ['housing:write', 'admin'],
      };

      const commandScopes = requiredScopes[type];
      if (commandScopes) {
        const issuer = command.issuedBy || 'unknown';
        
        // 1. Global Scope Check
        // Default scopes if not provided (e.g. system context or local boot)
        const activeScopes = command.scopes || 
          (issuer === 'system' || issuer === 'bootstrap' || issuer === 'admin' || issuer === 'nova-copilot' 
            ? ['fleet:write', 'housing:write', 'recruitment:write', 'tasks:write', 'admin'] 
            : issuer === 'sally' ? ['recruitment:write'] : []);
        
        const hasPermission = activeScopes.some(p => commandScopes.includes(p));
        if (!hasPermission) {
          const authError = `Security Violation: Unauthorized issuer "${issuer}" lacks scopes required for command "${type}".`;
          this.logAudit({ commandId, command, status: 'Failed', reason: authError });
          throw new Error(authError);
        }

        // 2. Resource-Scoped RBAC Check (Cross-Project Isolation)
        const targetProjectId = (payload.projectId || payload.targetProjectId || payload.project_id) as string | undefined;
        if (targetProjectId) {
          const activeProjects = command.issuerProjects || 
            (issuer === 'system' || issuer === 'bootstrap' || issuer === 'admin' ? ['admin'] : []);
          
          const hasProjectAccess = verifyResourceScope(activeProjects, String(targetProjectId));
          if (!hasProjectAccess) {
            const authError = `Security Violation: Access Denied. Issuer "${issuer}" is not authorized to modify resources in project "${targetProjectId}".`;
            this.logAudit({ commandId, command, status: 'Failed', reason: authError });
            throw new Error(authError);
          }
        }
      }

      // 4. Optimistic Concurrency Check
      const entityId = (payload.vehicleId || payload.candidateId || payload.id) as string | undefined;
      if (entityId && expectedVersion !== undefined) {
        const entities = globalMemoryRepository.getEntities();
        const entity = entities.find(e => e.id === entityId);
        if (entity) {
          const actualVersion = entity.version !== undefined ? Number(entity.version) : 1;
          if (actualVersion !== expectedVersion) {
            const conflictMsg = `Concurrency Conflict: Aggregate ${entityId} is at version ${actualVersion}, but expected version ${expectedVersion}.`;
            this.logAudit({ commandId, command, status: 'Failed', reason: conflictMsg });
            throw new Error(conflictMsg);
          }
        }
      }

      // 5. Execute Handler
      this.logAudit({ commandId, command, status: 'Executed' });
      const handler = globalCommandRegistry.getHandler(type);
      const eventParams = await handler(payload, {
        commandId,
        issuedBy: command.issuedBy,
        expectedVersion,
      });

      // 6. Publish resulting immutable event to Broker if returned by handler
      if (eventParams) {
        const eventMetadata = {
          environment: (process.env.NODE_ENV === 'production' ? 'production' : 'local') as 'local' | 'production',
          tenantId: (payload.tenantId as string) || 'default-tenant',
          sessionId: (payload.sessionId as string) || 'system-session',
          traceId: `tr_${Math.random().toString(36).substring(2, 11)}`,
        };

        const eventType = eventParams.type ? String(eventParams.type) : `${type}ed`;
        const eventSource = command.issuedBy || 'command-bus';

        const entityType = payload.vehicleId ? 'vehicle' : payload.candidateId ? 'candidate' : 'generic';
        const entityName = (payload.driverName || payload.candidateName || payload.name || entityId || 'unknown') as string;

        const publishedEvent = await globalEventBroker.publish({
          workspace: command.workspace,
          source: eventSource,
          type: eventType,
          entity: {
            type: String(eventParams.entityType || entityType),
            id: String(eventParams.entityId || entityId || 'unknown'),
            name: String(eventParams.entityName || entityName),
          },
          payload: eventParams.payload ? (eventParams.payload as Record<string, unknown>) : payload,
          severity: (eventParams.severity as any) || 'info',
          correlationId: commandId,
          version: 1,
          metadata: eventMetadata,
        });

        // Synchronously project into Memory Repository (Read Model)
        await globalProjectionEngine.project(publishedEvent);
      }

      // 7. Audit Succeeded & Cache executed Command ID
      this.executedCommandIds.add(commandId);
      this.logAudit({ commandId, command, status: 'Succeeded' });

      return { status: 'SUCCESS', commandId };
    } catch (err: any) {
      this.logAudit({ commandId, command, status: 'Failed', reason: err.message });
      throw err;
    }
  }
}

export const globalCommandBus = new CommandBus();
