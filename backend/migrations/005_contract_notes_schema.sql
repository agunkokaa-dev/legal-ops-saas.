-- Migration: Create Contract Notes Table for PDF Highlights
-- Description: Stores user highlights and comments attached to specific contracts

CREATE TABLE IF NOT EXISTS public.contract_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    quote TEXT,
    comment TEXT,
    position_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.contract_notes ENABLE ROW LEVEL SECURITY;

-- Create policy to isolate notes by tenant
CREATE POLICY "Tenant isolation for contract_notes"
ON public.contract_notes
FOR ALL
USING (tenant_id = current_setting('request.jwt.claims', true)::jsonb->>'org_id' OR tenant_id = auth.uid()::text);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_contract_notes_tenant ON public.contract_notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contract_notes_contract ON public.contract_notes(contract_id);
