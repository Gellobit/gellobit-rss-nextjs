-- ============================================
-- Add UNIQUE constraint on prompt_templates.opportunity_type
-- Only one custom prompt per opportunity type allowed
-- ============================================

-- Add unique constraint to prevent duplicate prompts per type
ALTER TABLE public.prompt_templates
ADD CONSTRAINT unique_prompt_per_opportunity_type UNIQUE (opportunity_type);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_prompt_templates_opportunity_type ON public.prompt_templates(opportunity_type);

COMMENT ON CONSTRAINT unique_prompt_per_opportunity_type ON public.prompt_templates IS 'Only one custom prompt per opportunity type allowed';
