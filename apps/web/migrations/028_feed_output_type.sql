-- Migration: Add output_type column to rss_feeds table
-- This allows feeds to output content to either opportunities or blog posts

-- Create enum type for output_type
DO $$ BEGIN
    CREATE TYPE feed_output_type AS ENUM ('opportunity', 'blog_post');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add output_type column to rss_feeds table with default 'opportunity'
ALTER TABLE rss_feeds
ADD COLUMN IF NOT EXISTS output_type feed_output_type DEFAULT 'opportunity' NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN rss_feeds.output_type IS 'Determines where processed content is published: opportunity (opportunities table) or blog_post (posts table)';

-- Create index for filtering by output_type
CREATE INDEX IF NOT EXISTS idx_rss_feeds_output_type ON rss_feeds(output_type);
