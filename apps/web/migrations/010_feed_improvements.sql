-- ============================================
-- Feed Improvements: Additional Fields
-- ============================================

-- Add missing columns to rss_feeds table
ALTER TABLE rss_feeds
ADD COLUMN IF NOT EXISTS quality_threshold DECIMAL(3,2) DEFAULT 0.6 CHECK (quality_threshold >= 0 AND quality_threshold <= 1),
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
ADD COLUMN IF NOT EXISTS cron_interval VARCHAR(50) DEFAULT 'hourly' CHECK (cron_interval IN ('every_5_minutes', 'every_15_minutes', 'every_30_minutes', 'hourly', 'every_2_hours', 'every_6_hours', 'every_12_hours', 'daily')),
ADD COLUMN IF NOT EXISTS fallback_featured_image_url TEXT,
ADD COLUMN IF NOT EXISTS allow_republishing BOOLEAN DEFAULT false;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_rss_feeds_priority ON rss_feeds(priority DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_rss_feeds_cron_interval ON rss_feeds(cron_interval) WHERE status = 'active';

-- Add comments
COMMENT ON COLUMN rss_feeds.quality_threshold IS 'Minimum AI confidence score (0-1) required to accept content. Default 0.6';
COMMENT ON COLUMN rss_feeds.priority IS 'Processing priority 1-10 (10 = highest). Higher priority feeds are processed first.';
COMMENT ON COLUMN rss_feeds.cron_interval IS 'How often to check this feed for new items.';
COMMENT ON COLUMN rss_feeds.fallback_featured_image_url IS 'Default image URL to use when no featured image is found in scraped content.';
COMMENT ON COLUMN rss_feeds.allow_republishing IS 'If true, allows processing duplicate URLs (useful for updated content).';
