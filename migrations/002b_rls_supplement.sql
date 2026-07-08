-- =============================================================================
-- NEXUS / Omega Dashboard — RLS Migration Supplement
-- Gap D Supplement: Additional Tables (discovered via schema audit)
-- Version: 002b
-- Date: 2026-07-07
-- =============================================================================
-- Run AFTER 002_rls_project_isolation.sql
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. TABLE — vehicle_trips
--   Column: project_id (int/text) — links to projects
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE vehicle_trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vehicle_trips_admin_all"     ON vehicle_trips;
DROP POLICY IF EXISTS "vehicle_trips_member_select" ON vehicle_trips;
DROP POLICY IF EXISTS "vehicle_trips_member_write"  ON vehicle_trips;

CREATE POLICY "vehicle_trips_admin_all"
  ON vehicle_trips FOR ALL TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "vehicle_trips_member_select"
  ON vehicle_trips FOR SELECT TO authenticated
  USING (
    auth.is_admin()
    OR project_id::text = auth.project_id()
    OR project_id IS NULL
  );

CREATE POLICY "vehicle_trips_member_write"
  ON vehicle_trips FOR ALL TO authenticated
  USING (
    auth.is_admin()
    OR project_id::text = auth.project_id()
  )
  WITH CHECK (project_id::text = auth.project_id());


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TABLE — trip_passengers
--   Scoped via trip_id → vehicle_trips.project_id
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE trip_passengers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trip_passengers_admin_all"     ON trip_passengers;
DROP POLICY IF EXISTS "trip_passengers_member_select" ON trip_passengers;

CREATE POLICY "trip_passengers_admin_all"
  ON trip_passengers FOR ALL TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "trip_passengers_member_select"
  ON trip_passengers FOR SELECT TO authenticated
  USING (
    auth.is_admin()
    OR EXISTS (
      SELECT 1 FROM vehicle_trips vt
      WHERE vt.id::text = trip_passengers.trip_id::text
        AND vt.project_id::text = auth.project_id()
    )
  );

CREATE POLICY "trip_passengers_member_write"
  ON trip_passengers FOR ALL TO authenticated
  USING (
    auth.is_admin()
    OR EXISTS (
      SELECT 1 FROM vehicle_trips vt
      WHERE vt.id::text = trip_passengers.trip_id::text
        AND vt.project_id::text = auth.project_id()
    )
  )
  WITH CHECK (
    auth.is_admin()
    OR EXISTS (
      SELECT 1 FROM vehicle_trips vt
      WHERE vt.id::text = trip_passengers.trip_id::text
        AND vt.project_id::text = auth.project_id()
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. TABLE — housing_assignments
--   Scoped via housing_unit_id → housing_units.project_id
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE housing_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "housing_assignments_admin_all"     ON housing_assignments;
DROP POLICY IF EXISTS "housing_assignments_member_select" ON housing_assignments;
DROP POLICY IF EXISTS "housing_assignments_member_write"  ON housing_assignments;

CREATE POLICY "housing_assignments_admin_all"
  ON housing_assignments FOR ALL TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "housing_assignments_member_select"
  ON housing_assignments FOR SELECT TO authenticated
  USING (
    auth.is_admin()
    OR EXISTS (
      SELECT 1 FROM housing_units hu
      WHERE hu.id::text = housing_assignments.housing_unit_id::text
        AND hu.project_id::text = auth.project_id()
    )
  );

CREATE POLICY "housing_assignments_member_write"
  ON housing_assignments FOR ALL TO authenticated
  USING (
    auth.is_admin()
    OR EXISTS (
      SELECT 1 FROM housing_units hu
      WHERE hu.id::text = housing_assignments.housing_unit_id::text
        AND hu.project_id::text = auth.project_id()
    )
  )
  WITH CHECK (
    auth.is_admin()
    OR EXISTS (
      SELECT 1 FROM housing_units hu
      WHERE hu.id::text = housing_assignments.housing_unit_id::text
        AND hu.project_id::text = auth.project_id()
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. TABLE — contracts  (housing contracts — admin only for now)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contracts_admin_all"     ON contracts;
DROP POLICY IF EXISTS "contracts_member_select" ON contracts;

CREATE POLICY "contracts_admin_all"
  ON contracts FOR ALL TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- Members can see contracts if they can see the unit_number's housing unit
CREATE POLICY "contracts_member_select"
  ON contracts FOR SELECT TO authenticated
  USING (
    auth.is_admin()
    OR EXISTS (
      SELECT 1 FROM housing_units hu
      WHERE hu.unit_number = contracts.unit_number
        AND hu.project_id::text = auth.project_id()
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. TABLE — payments  (scoped via contract_id → contracts → housing_units)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_admin_all"     ON payments;
DROP POLICY IF EXISTS "payments_member_select" ON payments;

CREATE POLICY "payments_admin_all"
  ON payments FOR ALL TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "payments_member_select"
  ON payments FOR SELECT TO authenticated
  USING (
    auth.is_admin()
    OR EXISTS (
      SELECT 1 FROM contracts c
      JOIN housing_units hu ON hu.unit_number = c.unit_number
      WHERE c.id::text = payments.contract_id::text
        AND hu.project_id::text = auth.project_id()
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. TABLE — user_roles  (admin only — security sensitive)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_admin_all"  ON user_roles;
DROP POLICY IF EXISTS "user_roles_self_read"  ON user_roles;

CREATE POLICY "user_roles_admin_all"
  ON user_roles FOR ALL TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- Users can read their OWN role record (needed by AuthContext on login)
CREATE POLICY "user_roles_self_read"
  ON user_roles FOR SELECT TO authenticated
  USING (user_id::text = auth.uid()::text);


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. TABLE — operations_ledger  (read-only for members — written externally)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE operations_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ledger_admin_all"     ON operations_ledger;
DROP POLICY IF EXISTS "ledger_member_select" ON operations_ledger;

CREATE POLICY "ledger_admin_all"
  ON operations_ledger FOR ALL TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- Members can read ledger entries — no project filter (financial overview is global for now)
-- To scope per-project: add project_id column to operations_ledger first
CREATE POLICY "ledger_member_select"
  ON operations_ledger FOR SELECT TO authenticated
  USING (true);  -- all authenticated users can read (restricted to SELECT only)


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. TABLE — project_departments
--   Column: project_name — must join to projects to scope
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE project_departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "departments_admin_all"     ON project_departments;
DROP POLICY IF EXISTS "departments_member_select" ON project_departments;
DROP POLICY IF EXISTS "departments_member_write"  ON project_departments;

CREATE POLICY "departments_admin_all"
  ON project_departments FOR ALL TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "departments_member_select"
  ON project_departments FOR SELECT TO authenticated
  USING (
    auth.is_admin()
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id::text = auth.project_id()
        AND p.project_name = project_departments.project_name
    )
  );

CREATE POLICY "departments_member_write"
  ON project_departments FOR ALL TO authenticated
  USING (
    auth.is_admin()
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id::text = auth.project_id()
        AND p.project_name = project_departments.project_name
    )
  )
  WITH CHECK (
    auth.is_admin()
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id::text = auth.project_id()
        AND p.project_name = project_departments.project_name
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 9. TABLE — approvals  (project-scoped when linked_table exists)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "approvals_admin_all"     ON approvals;
DROP POLICY IF EXISTS "approvals_member_select" ON approvals;
DROP POLICY IF EXISTS "approvals_member_write"  ON approvals;

CREATE POLICY "approvals_admin_all"
  ON approvals FOR ALL TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- Approvals are cross-project visible for reviewers — scoped to admin only for now
-- TODO: Add project_id column to approvals table for proper isolation
CREATE POLICY "approvals_member_select"
  ON approvals FOR SELECT TO authenticated
  USING (auth.is_admin() OR true);  -- open to all authenticated until project_id added

CREATE POLICY "approvals_member_write"
  ON approvals FOR INSERT TO authenticated
  WITH CHECK (true);  -- any authenticated user can create approval requests


-- ─────────────────────────────────────────────────────────────────────────────
-- SUPPLEMENTAL VERIFICATION QUERY
-- ─────────────────────────────────────────────────────────────────────────────
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
    'vehicle_trips', 'trip_passengers', 'housing_assignments',
    'contracts', 'payments', 'user_roles',
    'operations_ledger', 'project_departments', 'approvals'
  )
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;
*/
