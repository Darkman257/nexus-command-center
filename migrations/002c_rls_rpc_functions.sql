-- =============================================================================
-- NEXUS — RLS Support RPC Functions
-- Version: 002c
-- Date: 2026-07-07
-- Run AFTER 002_rls_project_isolation.sql
-- =============================================================================
-- These functions are called by the frontend (RLSSessionHelper.ts)
-- to inject project context into the PostgreSQL session.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: set_rls_project_context
-- Called by RLSSessionHelper.initRLSSession() after user login.
-- Sets app.project_id in the current session so auth.project_id() works.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_rls_project_context(p_project_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  -- runs as the function owner, not the caller
AS $$
BEGIN
  -- Validate input: project_id must exist in projects table
  IF NOT EXISTS (SELECT 1 FROM projects WHERE id::text = p_project_id) THEN
    RAISE EXCEPTION 'Invalid project_id: %', p_project_id
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- Set the session-local variable that auth.project_id() reads
  PERFORM set_config('app.project_id', p_project_id, true);  -- true = local to current transaction
END;
$$;

-- Grant execute to authenticated users only
REVOKE EXECUTE ON FUNCTION public.set_rls_project_context(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.set_rls_project_context(text) TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: get_rls_project_context (debug helper — returns current scoped project)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_rls_project_context()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT current_setting('app.project_id', true);
$$;

REVOKE EXECUTE ON FUNCTION public.get_rls_project_context() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_rls_project_context() TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICATION
-- ─────────────────────────────────────────────────────────────────────────────
/*
-- Check functions were created:
SELECT routine_name, routine_type, security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('set_rls_project_context', 'get_rls_project_context');

-- Test (replace 'YOUR_PROJECT_ID' with a real project id from your DB):
SELECT public.set_rls_project_context('YOUR_PROJECT_ID');
SELECT public.get_rls_project_context();
*/
