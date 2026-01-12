-- ============================================
-- Add UNIQUE constraint on ai_settings.provider
-- ============================================

-- Add unique constraint to prevent duplicate providers
ALTER TABLE public.ai_settings
ADD CONSTRAINT unique_ai_provider UNIQUE (provider);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_settings_provider_unique ON public.ai_settings(provider);

COMMENT ON CONSTRAINT unique_ai_provider ON public.ai_settings IS 'Only one configuration per AI provider type allowed';
