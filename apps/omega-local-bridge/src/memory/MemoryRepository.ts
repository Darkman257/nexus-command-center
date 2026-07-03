import * as fs from 'fs';
import * as path from 'path';

export class MemoryRepository {
  private baseDir: string;

  constructor() {
    this.baseDir = path.join(__dirname, '..', '..', 'data', 'memory-kernel');
    const dirs = ['entities', 'relationships', 'timeline', 'policies', 'decisions', 'tasks', 'facts'];
    dirs.forEach(d => {
      const p = path.join(this.baseDir, d);
      if (!fs.existsSync(p)) {
        fs.mkdirSync(p, { recursive: true });
      }
    });
  }

  private readAll<T>(subDir: string): T[] {
    const p = path.join(this.baseDir, subDir);
    if (!fs.existsSync(p)) return [];
    const files = fs.readdirSync(p);
    const items: T[] = [];
    files.forEach(f => {
      if (f.endsWith('.json')) {
        try {
          const content = fs.readFileSync(path.join(p, f), 'utf8');
          items.push(JSON.parse(content));
        } catch (e) {
          console.error(`Failed to parse file ${f} in ${subDir}:`, e);
        }
      }
    });
    return items;
  }

  private saveOne<T>(subDir: string, filename: string, data: T) {
    const p = path.join(this.baseDir, subDir, filename);
    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
  }

  getEntities(): any[] { return this.readAll('entities'); }
  saveEntity(entity: any) { this.saveOne('entities', `${entity.id}.json`, entity); }

  getRelationships(): any[] { return this.readAll('relationships'); }
  saveRelationship(rel: any) { this.saveOne('relationships', `${rel.from}_${rel.to}.json`, rel); }

  getTimeline(): any[] { return this.readAll('timeline'); }
  saveTimeline(timeline: any) { this.saveOne('timeline', `${timeline.id}.json`, timeline); }

  getPolicies(): any[] { return this.readAll('policies'); }
  savePolicy(policy: any) { this.saveOne('policies', `${policy.id}.json`, policy); }

  getDecisions(): any[] { return this.readAll('decisions'); }
  saveDecision(decision: any) { this.saveOne('decisions', `${decision.id}.json`, decision); }

  getTasks(): any[] { return this.readAll('tasks'); }
  saveTask(task: any) { this.saveOne('tasks', `${task.id}.json`, task); }

  getFacts(): any[] { return this.readAll('facts'); }
  saveFact(fact: any) { this.saveOne('facts', `${fact.id}.json`, fact); }

}

export const globalMemoryRepository = new MemoryRepository();
