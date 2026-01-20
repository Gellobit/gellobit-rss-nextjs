-- Migration: 040_opportunities_apply_url.sql
-- Add apply_url field for direct application links extracted by AI

ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS apply_url TEXT DEFAULT NULL;

COMMENT ON COLUMN public.opportunities.apply_url IS 'Direct URL to apply/enter the opportunity, extracted by AI from content. Falls back to source_url if not available.';
