-- =============================================================================
-- NEXUS / Omega Dashboard — Row-Level Security (RLS) Migration
-- Gap D: Cross-Project Isolation at the PostgreSQL level
-- Standard: SOC 2 Type II / ISO 27001 — Principle of Least Privilege
-- Version: 002
-- Date: 2026-07-07
-- Author: NEXUS Security Engineering
--
-- Strategy:
--   Three role classes via JWT claims:
--     - role = 'admin'          → full cross-project access (owner / Mohamed)
--     - auth.role() = 'service_role' → backend bypass (server-side processes)
--     - authenticated users    → scoped to JWT claim app.project_id only
--
-- How to apply:
--   1. Open Supabase project → SQL Editor
--   2. Paste and run this entire script
--   3. Verify via: the verification query block at the bottom
--
-- Rollback: see ROLLBACK block at the end of this file
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 0: HELPER FUNCTIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- Reads app.project_id from JWT claims (set by Supabase Auth + custom claims)
CREATE OR REPLACE FUNCTION auth.project_id() RETURNS text
  LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'app.project_id',
    current_setting('request.jwt.claims', true)::json->'app_metadata'->>'project_id',
    NULL
  );
$$;

-- Returns TRUE if the current request is from admin, system, or service_role
CREATE OR REPLACE FUNCTION auth.is_admin() RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT (
    current_setting('request.jwt.claims', true)::json->>'role' IN ('admin', 'system', 'service_role')
    OR auth.role() = 'service_role'
  );
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: TABLE — projects
--   Anchor table. project_id = id of this table itself.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_admin_all"     ON projects;
DROP POLICY IF EXISTS "projects_member_select" ON projects;

-- Admins: full access
CREATE POLICY "projects_admin_all"
  ON projects FOR ALL TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- Members: see only their project
CREATE POLICY "projects_member_select"
  ON projects FOR SELECT TO authenticated
  USING (
    auth.is_admin()
    OR id::text = auth.project_id()
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: TABLE — staff
--   Column: project_id (text)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_admin_all"      ON staff;
DROP POLICY IF EXISTS "staff_member_select"  ON staff;
DROP POLICY IF EXISTS "staff_member_write"   ON staff;

CREATE POLICY "staff_admin_all"
  ON staff FOR ALL TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "staff_member_select"
  ON staff FOR SELECT TO authenticated
  USING (
    auth.is_admin()
    OR project_id::text = auth.project_id()
    OR project_id IS NULL   -- unassigned staff = onboarding pool, visible to all
  );

CREATE POLICY "staff_member_write"
  ON staff FOR UPDATE TO authenticated
  USING (project_id::text = auth.project_id())
  WITH CHECK (project_id::text = auth.project_id());


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: TABLE — vehicles
--   Column: project_id (text), may be NULL for pool vehicles
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vehicles_admin_all"     ON vehicles;
DROP POLICY IF EXISTS "vehicles_member_select" ON vehicles;
DROP POLICY IF EXISTS "vehicles_member_write"  ON vehicles;

CREATE POLICY "vehicles_admin_all"
  ON vehicles FOR ALL TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "vehicles_member_select"
  ON vehicles FOR SELECT TO authenticated
  USING (
    auth.is_admin()
    OR project_id::text = auth.project_id()
    OR project_id IS NULL   -- pool vehicles visible to all projects
  );

CREATE POLICY "vehicles_member_write"
  ON vehicles FOR UPDATE TO authenticated
  USING (project_id::text = auth.project_id())
  WITH CHECK (project_id::text = auth.project_id());


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4: TABLE — housing_units
--   Column: project_id (text)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE housing_units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "housing_units_admin_all"     ON housing_units;
DROP POLICY IF EXISTS "housing_units_member_select" ON housing_units;
DROP POLICY IF EXISTS "housing_units_member_write"  ON housing_units;

CREATE POLICY "housing_units_admin_all"
  ON housing_units FOR ALL TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "housing_units_member_select"
  ON housing_units FOR SELECT TO authenticated
  USING (
    auth.is_admin()
    OR project_id::text = auth.project_id()
  );

CREATE POLICY "housing_units_member_write"
  ON housing_units FOR UPDATE TO authenticated
  USING (project_id::text = auth.project_id())
  WITH CHECK (project_id::text = auth.project_id());


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5: TABLE — payroll_records
--   Scoped via staff.project_id (no direct project_id column on payroll)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payroll_admin_all"      ON payroll_records;
DROP POLICY IF EXISTS "payroll_member_select"  ON payroll_records;

CREATE POLICY "payroll_admin_all"
  ON payroll_records FOR ALL TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "payroll_member_select"
  ON payroll_records FOR SELECT TO authenticated
  USING (
    auth.is_admin()
    OR EXISTS (
      SELECT 1 FROM staff s
      WHERE s.id::text = payroll_records.staff_id::text
        AND s.project_id::text = auth.project_id()
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 6: TABLE — site_admin_tasks
--   Column: project_id (text)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE site_admin_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_tasks_admin_all"    ON site_admin_tasks;
DROP POLICY IF EXISTS "site_tasks_member_all"   ON site_admin_tasks;

CREATE POLICY "site_tasks_admin_all"
  ON site_admin_tasks FOR ALL TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "site_tasks_member_all"
  ON site_admin_tasks FOR ALL TO authenticated
  USING (
    auth.is_admin()
    OR project_id::text = auth.project_id()
  )
  WITH CHECK (project_id::text = auth.project_id());


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 7: TABLE — documents
--   Column: project_id (text) if set; otherwise scoped via staff_id
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documents_admin_all"     ON documents;
DROP POLICY IF EXISTS "documents_member_select" ON documents;

CREATE POLICY "documents_admin_all"
  ON documents FOR ALL TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "documents_member_select"
  ON documents FOR SELECT TO authenticated
  USING (
    auth.is_admin()
    OR (project_id IS NOT NULL AND project_id::text = auth.project_id())
    OR (
      project_id IS NULL
      AND staff_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM staff s
        WHERE s.id::text = documents.staff_id::text
          AND s.project_id::text = auth.project_id()
      )
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 8: TABLE — employee_clearance_items
--   Scoped via staff_id → staff.project_id
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE employee_clearance_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clearance_admin_all"     ON employee_clearance_items;
DROP POLICY IF EXISTS "clearance_member_select" ON employee_clearance_items;
DROP POLICY IF EXISTS "clearance_member_write"  ON employee_clearance_items;

CREATE POLICY "clearance_admin_all"
  ON employee_clearance_items FOR ALL TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "clearance_member_select"
  ON employee_clearance_items FOR SELECT TO authenticated
  USING (
    auth.is_admin()
    OR EXISTS (
      SELECT 1 FROM staff s
      WHERE s.id::text = employee_clearance_items.staff_id::text
        AND s.project_id::text = auth.project_id()
    )
  );

CREATE POLICY "clearance_member_write"
  ON employee_clearance_items FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.id::text = employee_clearance_items.staff_id::text
        AND s.project_id::text = auth.project_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.id::text = employee_clearance_items.staff_id::text
        AND s.project_id::text = auth.project_id()
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 9: TABLE — nexus_event_store
--   TAMPER-PROOF: UPDATE and DELETE are denied for ALL non-service-role users.
--   Members can INSERT events scoped to their project only.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE nexus_event_store ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_admin_all"      ON nexus_event_store;
DROP POLICY IF EXISTS "events_member_insert"  ON nexus_event_store;
DROP POLICY IF EXISTS "events_member_select"  ON nexus_event_store;
DROP POLICY IF EXISTS "events_no_update"      ON nexus_event_store;
DROP POLICY IF EXISTS "events_no_delete"      ON nexus_event_store;

CREATE POLICY "events_admin_all"
  ON nexus_event_store FOR ALL TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- Members: can only INSERT events for their own project
CREATE POLICY "events_member_insert"
  ON nexus_event_store FOR INSERT TO authenticated
  WITH CHECK (
    auth.is_admin()
    OR (metadata->>'tenantId')::text = auth.project_id()
  );

-- Members: can only SELECT events for their own project
CREATE POLICY "events_member_select"
  ON nexus_event_store FOR SELECT TO authenticated
  USING (
    auth.is_admin()
    OR (metadata->>'tenantId')::text = auth.project_id()
  );

-- CRITICAL: Block UPDATE for all non-admin users — tamper protection
CREATE POLICY "events_no_update"
  ON nexus_event_store FOR UPDATE TO authenticated
  USING (false);

-- CRITICAL: Block DELETE for all non-admin users — tamper protection
CREATE POLICY "events_no_delete"
  ON nexus_event_store FOR DELETE TO authenticated
  USING (false);


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 10: TABLE — nexus_outbox  (server/service-role only)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE nexus_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "outbox_admin_only" ON nexus_outbox;

CREATE POLICY "outbox_admin_only"
  ON nexus_outbox FOR ALL TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 11: TABLE — nexus_dead_letter_queue  (admin review only)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE nexus_dead_letter_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dlq_admin_only" ON nexus_dead_letter_queue;

CREATE POLICY "dlq_admin_only"
  ON nexus_dead_letter_queue FOR ALL TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 12: TABLE — applicants  (sensitive PII — admin only)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "applicants_admin_only" ON applicants;

CREATE POLICY "applicants_admin_only"
  ON applicants FOR ALL TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 13: TABLE — attendance
--   Scoped via staff_id → staff.project_id
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance_admin_all"     ON attendance;
DROP POLICY IF EXISTS "attendance_member_select" ON attendance;

CREATE POLICY "attendance_admin_all"
  ON attendance FOR ALL TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "attendance_member_select"
  ON attendance FOR SELECT TO authenticated
  USING (
    auth.is_admin()
    OR EXISTS (
      SELECT 1 FROM staff s
      WHERE s.id::text = attendance.staff_id::text
        AND s.project_id::text = auth.project_id()
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 14: TABLE — attendance_logs
--   Scoped via staff_id → staff.project_id
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance_logs_admin_all"     ON attendance_logs;
DROP POLICY IF EXISTS "attendance_logs_member_select" ON attendance_logs;

CREATE POLICY "attendance_logs_admin_all"
  ON attendance_logs FOR ALL TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "attendance_logs_member_select"
  ON attendance_logs FOR SELECT TO authenticated
  USING (
    auth.is_admin()
    OR EXISTS (
      SELECT 1 FROM staff s
      WHERE s.id::text = attendance_logs.staff_id::text
        AND s.project_id::text = auth.project_id()
    )
  );


-- =============================================================================
-- VERIFICATION — Run this after applying to confirm correct setup
-- =============================================================================
/*
SELECT
  t.tablename,
  t.rowsecurity                                          AS rls_enabled,
  COUNT(p.policyname)                                    AS policy_count,
  STRING_AGG(p.policyname, ', ' ORDER BY p.policyname)  AS policies
FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'projects', 'staff', 'vehicles', 'housing_units',
    'payroll_records', 'site_admin_tasks', 'documents',
    'employee_clearance_items', 'nexus_event_store',
    'nexus_outbox', 'nexus_dead_letter_queue',
    'applicants', 'attendance', 'attendance_logs'
  )
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;
*/


-- =============================================================================
-- ROLLBACK — apply only when reverting this migration
-- =============================================================================
/*
DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'projects', 'staff', 'vehicles', 'housing_units',
    'payroll_records', 'site_admin_tasks', 'documents',
    'employee_clearance_items', 'nexus_event_store',
    'nexus_outbox', 'nexus_dead_letter_queue',
    'applicants', 'attendance', 'attendance_logs'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS auth.project_id();
DROP FUNCTION IF EXISTS auth.is_admin();
*/
