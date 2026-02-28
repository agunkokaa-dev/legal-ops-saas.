-- ============================================================
-- Migration 002: Document Management Module
-- Project: CLAUSE Legal Ops SaaS
-- Date: 2026-02-28
-- Description: Creates matter_documents table with Clerk JWT
--              RLS, a private storage bucket 'matter-files',
--              and storage-level RLS policies.
-- ============================================================

-- -----------------------------------------------
-- 1. CREATE matter_documents table
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS matter_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    matter_id uuid NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    tenant_id text NOT NULL,
    name text NOT NULL,
    file_url text NOT NULL,
    file_type text,
    file_size bigint,
    created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------
-- 2. MANDATORY RLS: Clerk JWT Tenant Isolation
-- -----------------------------------------------
ALTER TABLE matter_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Strict Tenant Isolation for Matter Documents"
    ON matter_documents
    FOR ALL
    USING (
        tenant_id = auth.jwt()->>'org_id'
        OR
        tenant_id = auth.jwt()->>'sub'
    );

-- -----------------------------------------------
-- 3. CREATE STORAGE BUCKET (Private)
-- -----------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('matter-files', 'matter-files', false)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------
-- 4. STORAGE RLS POLICIES (Clerk JWT validation)
-- -----------------------------------------------
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated Clerk users to manage matter-files"
    ON storage.objects
    FOR ALL
    USING (
        bucket_id = 'matter-files'
        AND (
            auth.jwt()->>'org_id' IS NOT NULL
            OR
            auth.jwt()->>'sub' IS NOT NULL
        )
    )
    WITH CHECK (
        bucket_id = 'matter-files'
        AND (
            auth.jwt()->>'org_id' IS NOT NULL
            OR
            auth.jwt()->>'sub' IS NOT NULL
        )
    );

-- -----------------------------------------------
-- 5. PERMISSIONS & SCHEMA CACHE
-- -----------------------------------------------
GRANT ALL ON TABLE matter_documents TO postgres, anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
