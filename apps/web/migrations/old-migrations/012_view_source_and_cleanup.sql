-- ============================================
-- Migration: View Source Link and Cleanup Settings
-- ============================================

-- Add show_source_link column to rss_feeds
-- This allows admin to control whether "View Original Source" link is shown per feed
ALTER TABLE rss_feeds
ADD COLUMN IF NOT EXISTS show_source_link BOOLEAN DEFAULT false;

COMMENT ON COLUMN rss_feeds.show_source_link IS 'If true, shows "View Original Source" link on the opportunity page.';

-- Add index on deadline for expiration queries
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON opportunities(deadline) WHERE status = 'published';

-- Add system setting for auto-cleanup
INSERT INTO system_settings (key, value, type, description, category)
VALUES
  ('cleanup.auto_expire_enabled', 'true', 'boolean', 'Automatically remove expired opportunities', 'cleanup'),
  ('cleanup.days_after_deadline', '7', 'number', 'Days after deadline before removing opportunity', 'cleanup'),
  ('cleanup.run_interval_hours', '24', 'number', 'How often to run the cleanup job (in hours)', 'cleanup')
ON CONFLICT (key) DO NOTHING;
