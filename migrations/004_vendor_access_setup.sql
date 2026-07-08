-- =============================================================================
-- NEXUS — Vendor & Partner Access Setup
-- Gap: JWT Claims Automation & Vendor Role Provisioning
-- Standard: SOC 2 Type II / ISO 27001
-- Version: 004
-- Date: 2026-07-07
-- =============================================================================
-- Description:
--   This script automates the assignment of roles and project restrictions.
--   When an Admin assigns a user in `public.user_roles`, this script uses
--   a database trigger to automatically update the JWT claims (app_metadata)
--   in `auth.users`. This ensures the RLS policies apply instantly and securely.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ENHANCE user_roles TABLE
--    Add project_id column to strictly bind vendors to specific projects.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS project_id uuid NULL;
-- (Assuming projects.id is uuid. If it's text/int, adjust accordingly. We cast to text in our trigger to be safe).

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CREATE AUTOMATION TRIGGER (Sync to JWT Claims)
--    Automatically pushes role and project_id from user_roles to auth.users
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_user_roles_to_jwt_claims()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Must run as superuser/postgres to modify auth.users
AS $$
BEGIN
  -- We update raw_app_meta_data directly.
  -- Supabase Auth uses this to generate the JWT token.
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'role', NEW.role,
      'project_id', NEW.project_id::text
    )
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any, then recreate
DROP TRIGGER IF EXISTS trg_sync_user_roles_to_jwt ON public.user_roles;

CREATE TRIGGER trg_sync_user_roles_to_jwt
  AFTER INSERT OR UPDATE OF role, project_id ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_roles_to_jwt_claims();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. PROVISIONING PLAYBOOK (Admin Cheatsheet)
--    How to setup Tamara and Vendors (Run these steps in Supabase SQL Editor)
-- ─────────────────────────────────────────────────────────────────────────────

/*
=============================================================================
  >> STEP A: CREATE THE USER (TAMARA) <<
  Normally done via the Supabase Dashboard UI (Authentication -> Invite User)
  Or via the Admin API.
  Let's assume Tamara's Auth User ID is: '11111111-2222-3333-4444-555555555555'
=============================================================================
*/

/*
=============================================================================
  >> STEP B: ASSIGN ROLE & PROJECT (TAMARA - PROJECT ADMIN) <<
  Replace the UUIDs with the actual Auth ID, Employee ID, and Project ID.
=============================================================================

INSERT INTO public.user_roles (user_id, employee_id, role, project_id)
VALUES (
  '11111111-2222-3333-4444-555555555555', -- Auth ID from Supabase
  'EMP-TMR-001',                          -- Her staff ID in your DB
  'project_admin',                        -- The SLA role
  'PROJ-LUMIA-001'                        -- The specific project she manages
)
ON CONFLICT (user_id) 
DO UPDATE SET 
  role = EXCLUDED.role, 
  project_id = EXCLUDED.project_id;

-- Wait 1 second... The trigger above automatically updates her JWT claims!
-- She is now restricted to PROJ-LUMIA-001 in all 23 tables.
*/

/*
=============================================================================
  >> STEP C: ASSIGN ROLE & PROJECT (VENDOR / SHEREKA HOLOL) <<
=============================================================================

INSERT INTO public.user_roles (user_id, employee_id, role, project_id)
VALUES (
  '99999999-8888-7777-6666-555555555555', -- Auth ID of the Vendor
  NULL,                                   -- Vendors might not be in staff table
  'project_member',                       -- The Read-Heavy Vendor role
  'PROJ-LUMIA-001'                        -- The specific project they are contracted for
)
ON CONFLICT (user_id) 
DO UPDATE SET 
  role = EXCLUDED.role, 
  project_id = EXCLUDED.project_id;

-- Done! Vendor is now locked in via Row-Level Security.
*/

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICATION QUERY
-- ─────────────────────────────────────────────────────────────────────────────
/*
-- Run this to check if the claims synced properly to Supabase Auth:
SELECT id, email, raw_app_meta_data
FROM auth.users
WHERE id IN (
  SELECT user_id FROM public.user_roles WHERE role IN ('project_admin', 'project_member')
);
*/
