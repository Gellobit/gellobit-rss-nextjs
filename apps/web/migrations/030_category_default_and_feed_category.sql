-- Migration: Add default category support and category to feeds
-- Allows setting a default category and assigning categories to RSS feeds for blog posts

-- ============================================================================
-- Add is_default column to categories
-- ============================================================================
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Create unique partial index to ensure only one default category
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_single_default
ON categories (is_default)
WHERE is_default = true;

-- Set "News" as the default category initially
UPDATE categories SET is_default = true WHERE slug = 'news';

-- ============================================================================
-- Add blog_category_id to rss_feeds table
-- ============================================================================
ALTER TABLE rss_feeds
ADD COLUMN IF NOT EXISTS blog_category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Create index for category lookup on feeds
CREATE INDEX IF NOT EXISTS idx_rss_feeds_blog_category_id ON rss_feeds(blog_category_id);

-- Comment on columns
COMMENT ON COLUMN categories.is_default IS 'If true, this category is used as default for new blog posts';
COMMENT ON COLUMN rss_feeds.blog_category_id IS 'Category to assign when feed output_type is blog_post';
