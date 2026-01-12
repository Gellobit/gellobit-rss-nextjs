-- ============================================
-- Add AI Provider Settings Per Feed
-- ============================================

-- Add AI configuration columns to rss_feeds table
ALTER TABLE rss_feeds
ADD COLUMN IF NOT EXISTS ai_provider VARCHAR(50) CHECK (ai_provider IS NULL OR ai_provider IN ('openai', 'anthropic', 'deepseek', 'gemini')),
ADD COLUMN IF NOT EXISTS ai_model VARCHAR(100),
ADD COLUMN IF NOT EXISTS ai_api_key TEXT;

-- Create index for AI provider filtering
CREATE INDEX IF NOT EXISTS idx_rss_feeds_ai_provider ON rss_feeds(ai_provider) WHERE ai_provider IS NOT NULL;

-- Add comment
COMMENT ON COLUMN rss_feeds.ai_provider IS 'AI provider for this feed. NULL means use global settings.';
COMMENT ON COLUMN rss_feeds.ai_model IS 'AI model for this feed. NULL means use global settings.';
COMMENT ON COLUMN rss_feeds.ai_api_key IS 'API key for this feed. NULL means use global settings.';
