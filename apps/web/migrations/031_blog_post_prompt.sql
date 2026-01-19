-- ============================================
-- Add blog_post entry to prompt_templates table
-- Enables customization of AI prompts for blog post generation
-- ============================================

-- Insert blog_post prompt entry
INSERT INTO public.prompt_templates (opportunity_type, unified_prompt, default_prompt, is_customized)
VALUES ('blog_post', '', '', false)
ON CONFLICT (opportunity_type) DO NOTHING;

-- Also ensure 'evergreen' type exists (might be missing from initial seed)
INSERT INTO public.prompt_templates (opportunity_type, unified_prompt, default_prompt, is_customized)
VALUES ('evergreen', '', '', false)
ON CONFLICT (opportunity_type) DO NOTHING;

COMMENT ON TABLE public.prompt_templates IS 'Custom AI prompts by opportunity type and blog_post';
