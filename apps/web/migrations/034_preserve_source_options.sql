-- ============================================
-- Add options to preserve source slug and title for blog posts
-- ============================================

-- Add columns to rss_feeds table
ALTER TABLE public.rss_feeds
ADD COLUMN IF NOT EXISTS preserve_source_slug BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS preserve_source_title BOOLEAN DEFAULT false;

-- Comments
COMMENT ON COLUMN public.rss_feeds.preserve_source_slug IS 'Use the original URL slug from source instead of generating a new one';
COMMENT ON COLUMN public.rss_feeds.preserve_source_title IS 'Use the original title from source instead of AI-generated title';
