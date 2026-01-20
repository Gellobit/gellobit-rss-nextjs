-- ============================================
-- Add email and push categories to system_settings
-- ============================================

-- Drop the existing CHECK constraint
ALTER TABLE public.system_settings DROP CONSTRAINT IF EXISTS check_category;

-- Add the new CHECK constraint with email and push categories
ALTER TABLE public.system_settings
ADD CONSTRAINT check_category
CHECK (category IN ('general', 'ai', 'prompts', 'scraping', 'advanced', 'analytics', 'personalization', 'email', 'membership', 'push'));
