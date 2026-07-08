/**
 * ComplianceLogger.ts
 *
 * Persistent archive layer for policy violations detected by the DecisionEngine.
 *
 * Responsibilities:
 *  - Convert `Recommendation` objects from DecisionEngine into compliance log entries
 *  - Persist them to `nexus_compliance_logs` in Supabase (with local file fallback)
 *  - Allow status transitions: OPEN → ACKNOWLEDGED → REMEDIATED | DISMISSED | ESCALATED
 *  - Never delete records — compliance archive is immutable by design
 *
 * Architecture:
 *  DecisionEngine.evaluate()
 *       ↓
 *  ComplianceLogger.logViolations(recommendations[])
 *       ↓
 *  Supabase: nexus_compliance_logs (upsert by violation_id)
 *       ↓ fallback
 *  Local: nexus-compliance.jsonl
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { Recommendation } from '../decision-engine/DecisionEngine';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
  : null;

// ─── Types ──────────────────────────────────────────────────────────────────

export type ComplianceStatus =
  | 'OPEN'
  | 'ACKNOWLEDGED'
  | 'REMEDIATED'
  | 'DISMISSED'
  | 'ESCALATED';

export type ComplianceCategory =
  | 'FLEET'
  | 'RECRUITMENT'
  | 'HOUSING'
  | 'ATTENDANCE'
  | 'PAYROLL'
  | 'SECURITY'
  | 'SYSTEM';

export interface ComplianceLogEntry {
  id?: string;
  violation_id: string;
  category: ComplianceCategory;
  rule_code: string;
  severity: 'info' | 'warn' | 'critical';
  title: string;
  description: string;
  affected_entity_id?: string;
  affected_entity_type?: string;
  raw_context?: Record<string, unknown>;
  project_id?: string;
  workspace: string;
  detected_by: string;
  confidence?: number;
  status: ComplianceStatus;
  detected_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  remediated_at?: string;
  remediated_by?: string;
  remediation_notes?: string;
  dismissed_reason?: string;
  event_store_id?: string;
}

export interface RemediationPatch {
  status: ComplianceStatus;
  actor: string;
  notes?: string;
}

// ─── Category Resolver ───────────────────────────────────────────────────────

const RULE_CODE_MAP: Record<string, { category: ComplianceCategory; rule_code: string }> = {
  FLEET:       { category: 'FLEET',       rule_code: 'FLEET_UNASSIGNED_VEHICLE' },
  RECRUITMENT: { category: 'RECRUITMENT', rule_code: 'RECRUITMENT_PENDING_APPROVAL' },
  HOUSING:     { category: 'HOUSING',     rule_code: 'HOUSING_OVERCAPACITY' },
  ATTENDANCE:  { category: 'ATTENDANCE',  rule_code: 'ATTENDANCE_HIGH_ABSENTEEISM' },
  PAYROLL:     { category: 'PAYROLL',     rule_code: 'PAYROLL_ANOMALY' },
  SECURITY:    { category: 'SECURITY',    rule_code: 'SECURITY_VIOLATION' },
};

function resolveCategory(reason: string): { category: ComplianceCategory; rule_code: string } {
  const upperReason = reason.toUpperCase();
  for (const [key, value] of Object.entries(RULE_CODE_MAP)) {
    if (upperReason.includes(key)) return value;
  }
  return { category: 'SYSTEM', rule_code: 'SYSTEM_GENERIC_VIOLATION' };
}

// ─── Local Fallback Path ─────────────────────────────────────────────────────

function getLocalPath(): string {
  const filePath = path.join(__dirname, '..', '..', 'data', 'nexus-compliance.jsonl');
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return filePath;
}

function writeLocalFallback(entry: ComplianceLogEntry): void {
  const line = JSON.stringify(entry) + '\n';
  fs.appendFileSync(getLocalPath(), line, 'utf8');
}

function readLocalFallback(): ComplianceLogEntry[] {
  const filePath = getLocalPath();
  if (!fs.existsSync(filePath)) return [];

  const entries: ComplianceLogEntry[] = [];
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { entries.push(JSON.parse(line) as ComplianceLogEntry); }
    catch { /* skip corrupted lines */ }
  }
  return entries;
}

// ─── Core: Log Violations ────────────────────────────────────────────────────

/**
 * Converts DecisionEngine recommendations into compliance log entries and
 * persists them. Uses UPSERT to avoid duplicating the same ongoing violation.
 */
export async function logViolations(
  recommendations: Recommendation[],
  context: { projectId?: string; workspace?: string } = {}
): Promise<void> {
  if (recommendations.length === 0) return;

  const entries: ComplianceLogEntry[] = recommendations.map(rec => {
    const { category, rule_code } = resolveCategory(rec.reason);

    // Extract affected entity from first action payload if available
    const firstPayload = rec.actions[0]?.payload ?? {};
    const affectedEntityId = (
      firstPayload['vehicleId'] ||
      firstPayload['candidateId'] ||
      firstPayload['staffId'] ||
      firstPayload['id']
    ) as string | undefined;

    const affectedEntityType = category === 'FLEET' ? 'vehicle'
      : category === 'RECRUITMENT' ? 'candidate'
      : category === 'HOUSING' ? 'housing_unit'
      : undefined;

    return {
      violation_id: rec.id,
      category,
      rule_code,
      severity: rec.severity,
      title: `[${category}] ${rule_code.replace(/_/g, ' ')}`,
      description: rec.reason,
      affected_entity_id: affectedEntityId,
      affected_entity_type: affectedEntityType,
      raw_context: {
        actions: rec.actions,
        confidence: rec.confidence,
        expiresAt: rec.expiresAt,
      },
      project_id: context.projectId,
      workspace: context.workspace ?? 'omega',
      detected_by: 'DecisionEngine',
      confidence: rec.confidence,
      status: 'OPEN',
      detected_at: rec.generatedAt,
    };
  });

  if (supabase) {
    try {
      const { error } = await supabase
        .from('nexus_compliance_logs')
        .upsert(entries, {
          onConflict: 'violation_id',
          ignoreDuplicates: false,  // allow updating status if it was previously dismissed
        });

      if (!error) {
        console.log(`[ComplianceLogger] ✅ Logged ${entries.length} violation(s) to Supabase.`);
        return;
      }
      console.warn(`[ComplianceLogger] Supabase upsert failed: ${error.message}. Writing to local file.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[ComplianceLogger] Supabase error: ${msg}. Writing to local file.`);
    }
  }

  // Fallback: write to local .jsonl
  entries.forEach(writeLocalFallback);
  console.log(`[ComplianceLogger] 📄 Logged ${entries.length} violation(s) to local file.`);
}

// ─── Status Transitions ───────────────────────────────────────────────────────

/**
 * Updates the status of a compliance log entry (acknowledge / remediate / dismiss).
 * Used by admin/UI actions.
 */
export async function updateViolationStatus(
  violationId: string,
  patch: RemediationPatch
): Promise<void> {
  const now = new Date().toISOString();

  const dbUpdate: Partial<ComplianceLogEntry> & Record<string, unknown> = {
    status: patch.status,
  };

  if (patch.status === 'ACKNOWLEDGED') {
    dbUpdate.acknowledged_at = now;
    dbUpdate.acknowledged_by = patch.actor;
  } else if (patch.status === 'REMEDIATED') {
    dbUpdate.remediated_at = now;
    dbUpdate.remediated_by = patch.actor;
    dbUpdate.remediation_notes = patch.notes ?? '';
  } else if (patch.status === 'DISMISSED') {
    dbUpdate.dismissed_reason = patch.notes ?? 'No reason provided';
  }

  if (supabase) {
    try {
      const { error } = await supabase
        .from('nexus_compliance_logs')
        .update(dbUpdate)
        .eq('violation_id', violationId);

      if (!error) {
        console.log(`[ComplianceLogger] ✅ Updated violation "${violationId}" → ${patch.status}`);
        return;
      }
      console.warn(`[ComplianceLogger] Failed to update violation: ${error.message}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[ComplianceLogger] Update error: ${msg}`);
    }
  }

  // Local fallback: rewrite file with updated entry
  const existing = readLocalFallback();
  const updated = existing.map(e =>
    e.violation_id === violationId ? { ...e, ...dbUpdate } : e
  );
  fs.writeFileSync(
    getLocalPath(),
    updated.map(e => JSON.stringify(e)).join('\n') + '\n',
    'utf8'
  );
  console.log(`[ComplianceLogger] 📄 Updated local violation "${violationId}" → ${patch.status}`);
}

// ─── Query Helpers ────────────────────────────────────────────────────────────

/**
 * Fetches open violations from Supabase for a given project.
 * Falls back to local file if Supabase is unavailable.
 */
export async function getOpenViolations(
  projectId?: string,
  limit = 50
): Promise<ComplianceLogEntry[]> {
  if (supabase) {
    try {
      let query = supabase
        .from('nexus_compliance_logs')
        .select('*')
        .in('status', ['OPEN', 'ACKNOWLEDGED', 'ESCALATED'])
        .order('detected_at', { ascending: false })
        .limit(limit);

      if (projectId) query = query.eq('project_id', projectId);

      const { data, error } = await query;
      if (!error && data) return data as ComplianceLogEntry[];
    } catch { /* fallback below */ }
  }

  const local = readLocalFallback();
  return local
    .filter(e =>
      ['OPEN', 'ACKNOWLEDGED', 'ESCALATED'].includes(e.status) &&
      (!projectId || e.project_id === projectId)
    )
    .slice(0, limit);
}
