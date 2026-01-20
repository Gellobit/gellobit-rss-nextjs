-- Migration: Add source_type support to rss_feeds
-- Allows feeds to use either RSS or a list of URLs as source

-- Step 1: Create enum type for source_type
DO $$ BEGIN
    CREATE TYPE feed_source_type AS ENUM ('rss', 'url_list');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add source_type column (defaults to 'rss' for backwards compatibility)
ALTER TABLE public.rss_feeds
ADD COLUMN IF NOT EXISTS source_type feed_source_type DEFAULT 'rss' NOT NULL;

-- Step 3: Add url_list column to store URLs (one per line)
-- Using TEXT to store newline-separated URLs for simplicity
ALTER TABLE public.rss_feeds
ADD COLUMN IF NOT EXISTS url_list TEXT DEFAULT NULL;

-- Step 4: Add index for source_type
CREATE INDEX IF NOT EXISTS idx_rss_feeds_source_type
ON public.rss_feeds(source_type);

-- Step 5: Add comments
COMMENT ON COLUMN public.rss_feeds.source_type IS 'Source type: rss (RSS feed) or url_list (list of URLs to scrape)';
COMMENT ON COLUMN public.rss_feeds.url_list IS 'Newline-separated list of URLs to scrape (used when source_type is url_list)';

-- Step 6: Add constraint to ensure url_list is provided when source_type is url_list
-- Note: This is a soft constraint - the application should validate this
ALTER TABLE public.rss_feeds
ADD CONSTRAINT rss_feeds_url_list_check
CHECK (
    (source_type = 'rss') OR
    (source_type = 'url_list' AND url_list IS NOT NULL AND url_list != '')
);
