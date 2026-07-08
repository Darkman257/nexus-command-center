-- =============================================================================
-- NEXUS — Compliance Logs Archive Table
-- Gap E: Policy Compliance Ledger (Historical Archive)
-- Standard: SOC 2 Type II / ISO 27001 — Audit Trail Requirements
-- Version: 003
-- Date: 2026-07-07
-- =============================================================================
-- Run AFTER: 002_rls_project_isolation.sql, 002b_rls_supplement.sql
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: nexus_compliance_logs
--   Immutable historical archive of every violation detected and its remediation.
--   Rows are NEVER deleted — only the status is updated on remediation.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nexus_compliance_logs (
  -- Identity
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  violation_id        text NOT NULL UNIQUE,          -- stable ID from DecisionEngine (e.g. rec_veh_xxxxx)

  -- Classification
  category            text NOT NULL,                 -- 'FLEET' | 'RECRUITMENT' | 'HOUSING' | 'ATTENDANCE' | 'PAYROLL' | 'SECURITY' | 'SYSTEM'
  rule_code           text NOT NULL,                 -- machine-readable rule (e.g. 'FLEET_UNASSIGNED_VEHICLE')
  severity            text NOT NULL CHECK (severity IN ('info', 'warn', 'critical')),

  -- What was detected
  title               text NOT NULL,
  description         text NOT NULL,
  affected_entity_id  text,                          -- staff_id / vehicle_id / project_id etc.
  affected_entity_type text,                         -- 'vehicle' | 'staff' | 'project' etc.
  raw_context         jsonb,                         -- snapshot of data at detection time

  -- Source
  project_id          text,                          -- which project this violation belongs to
  workspace           text NOT NULL DEFAULT 'omega', -- 'omega' | system name
  detected_by         text NOT NULL DEFAULT 'DecisionEngine',  -- engine that detected it
  confidence          numeric(4,3),                  -- 0.000 to 1.000

  -- Lifecycle
  status              text NOT NULL DEFAULT 'OPEN'
                      CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'REMEDIATED', 'DISMISSED', 'ESCALATED')),
  detected_at         timestamptz NOT NULL DEFAULT now(),
  acknowledged_at     timestamptz,
  acknowledged_by     text,                          -- user who acknowledged
  remediated_at       timestamptz,
  remediated_by       text,                          -- user or system that resolved
  remediation_notes   text,                          -- what was done to fix it
  dismissed_reason    text,                          -- why it was dismissed (if applicable)

  -- Audit chain (links to event store)
  event_store_id      text,                          -- id from nexus_event_store if logged there too

  -- Timestamps
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES for fast querying
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_compliance_status
  ON nexus_compliance_logs (status, detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_compliance_project
  ON nexus_compliance_logs (project_id, detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_compliance_severity
  ON nexus_compliance_logs (severity, status, detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_compliance_category
  ON nexus_compliance_logs (category, detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_compliance_rule
  ON nexus_compliance_logs (rule_code, detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_compliance_entity
  ON nexus_compliance_logs (affected_entity_id, affected_entity_type);

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER: auto-update updated_at on every status change
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION nexus_compliance_logs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_compliance_logs_updated_at ON nexus_compliance_logs;
CREATE TRIGGER trg_compliance_logs_updated_at
  BEFORE UPDATE ON nexus_compliance_logs
  FOR EACH ROW EXECUTE FUNCTION nexus_compliance_logs_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: compliance logs visibility
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE nexus_compliance_logs ENABLE ROW LEVEL SECURITY;

-- Admins: full access
CREATE POLICY "compliance_admin_all"
  ON nexus_compliance_logs FOR ALL TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- Project members: see violations for their project only
CREATE POLICY "compliance_member_select"
  ON nexus_compliance_logs FOR SELECT TO authenticated
  USING (
    auth.is_admin()
    OR project_id::text = auth.project_id()
  );

-- Members can UPDATE status (acknowledge/remediate) for their project violations
CREATE POLICY "compliance_member_update"
  ON nexus_compliance_logs FOR UPDATE TO authenticated
  USING (project_id::text = auth.project_id())
  WITH CHECK (project_id::text = auth.project_id());

-- No DELETE allowed — compliance log is immutable
CREATE POLICY "compliance_no_delete"
  ON nexus_compliance_logs FOR DELETE TO authenticated
  USING (false);

-- ─────────────────────────────────────────────────────────────────────────────
-- STATS VIEW: quick summary for dashboard widgets
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW nexus_compliance_summary AS
SELECT
  project_id,
  category,
  severity,
  status,
  COUNT(*)                                          AS total,
  COUNT(*) FILTER (WHERE status = 'OPEN')           AS open_count,
  COUNT(*) FILTER (WHERE status = 'REMEDIATED')     AS remediated_count,
  COUNT(*) FILTER (WHERE status = 'ESCALATED')      AS escalated_count,
  MIN(detected_at)                                  AS oldest_open,
  MAX(detected_at)                                  AS latest_detected
FROM nexus_compliance_logs
GROUP BY project_id, category, severity, status;

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICATION
-- ─────────────────────────────────────────────────────────────────────────────
/*
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'nexus_compliance_logs') AS column_count,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'nexus_compliance_logs') AS rls_enabled,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'nexus_compliance_logs') AS index_count
FROM information_schema.tables
WHERE table_name = 'nexus_compliance_logs';
*/

-- ─────────────────────────────────────────────────────────────────────────────
-- ROLLBACK
-- ─────────────────────────────────────────────────────────────────────────────
/*
DROP VIEW  IF EXISTS nexus_compliance_summary;
DROP TABLE IF EXISTS nexus_compliance_logs CASCADE;
DROP FUNCTION IF EXISTS nexus_compliance_logs_updated_at();
*/
