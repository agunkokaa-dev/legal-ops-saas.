-- ============================================================
-- Migration 001: Matter Detail Page Schema
-- Project: CLAUSE Legal Ops SaaS
-- Date: 2026-02-28
-- Description: Extends matters table with financial/metadata
--              fields and creates matter_tasks table with
--              Clerk JWT-based Row Level Security.
-- ============================================================

-- -----------------------------------------------
-- 1. ALTER matters: Add new nullable columns
-- -----------------------------------------------
ALTER TABLE matters ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS lead_attorney text;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS claim_value bigint;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS liability_cap bigint;
ALTER TABLE matters ADD COLUMN IF NOT EXISTS legal_spend bigint;

-- -----------------------------------------------
-- 2. CREATE matter_tasks table
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS matter_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    matter_id uuid NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    tenant_id text NOT NULL,
    title text NOT NULL,
    description text,
    priority text DEFAULT 'normal',
    due_date date,
    is_completed boolean DEFAULT false,
    assigned_to text,
    created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------
-- 3. MANDATORY RLS: Clerk JWT Tenant Isolation
-- -----------------------------------------------
ALTER TABLE matter_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Strict Tenant Isolation for Matter Tasks"
    ON matter_tasks
    FOR ALL
    USING (
        tenant_id = auth.jwt()->>'org_id'
        OR
        tenant_id = auth.jwt()->>'sub'
    );

-- -----------------------------------------------
-- 4. PERMISSIONS
-- -----------------------------------------------
GRANT ALL ON TABLE matter_tasks TO postgres, anon, authenticated, service_role;

-- -----------------------------------------------
-- 5. SCHEMA CACHE: Prevent PGRST204 errors
-- -----------------------------------------------
NOTIFY pgrst, 'reload schema';
