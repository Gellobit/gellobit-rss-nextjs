-- Migration: 039_opportunities_seo_fields.sql
-- Add SEO fields and public visibility flag to opportunities table
-- This allows publishers to make their opportunities indexable by search engines

-- Add meta_title for custom SEO titles
ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255) DEFAULT NULL;

-- Add meta_description for custom SEO descriptions
ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS meta_description TEXT DEFAULT NULL;

-- Add is_public flag to control whether opportunity is indexable
-- When true: opportunity can be indexed by search engines, has Open Graph, etc.
-- When false (default): opportunity is protected, noindex, no social preview
ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Add comment explaining the columns
COMMENT ON COLUMN public.opportunities.meta_title IS 'Custom SEO title for search engines. Falls back to title if null.';
COMMENT ON COLUMN public.opportunities.meta_description IS 'Custom SEO description for search engines. Falls back to excerpt if null.';
COMMENT ON COLUMN public.opportunities.is_public IS 'When true, opportunity is indexable by search engines and has full social sharing support. Used for publisher memberships.';

-- Create index for public opportunities (for efficient querying of indexable content)
CREATE INDEX IF NOT EXISTS idx_opportunities_is_public ON public.opportunities(is_public) WHERE is_public = TRUE;
