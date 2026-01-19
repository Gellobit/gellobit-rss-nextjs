-- Migration: Create blog categories system
-- Categories for organizing blog posts with SEO-friendly URLs

-- ============================================================================
-- Create categories table
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic info
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,

    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,

    -- Display
    color VARCHAR(7) DEFAULT '#FFDE59', -- Hex color for UI
    icon VARCHAR(50), -- Optional icon name
    display_order INT DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active categories (public)
CREATE POLICY "Public can read active categories" ON categories
    FOR SELECT
    USING (is_active = true);

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage all categories" ON categories
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER categories_updated_at_trigger
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_categories_updated_at();

-- ============================================================================
-- Add category_id to posts table
-- ============================================================================
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Create index for category lookup
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id);

-- ============================================================================
-- Insert default categories (common blog categories)
-- ============================================================================
INSERT INTO categories (name, slug, description, color, display_order) VALUES
    ('News', 'news', 'Latest news and updates', '#3B82F6', 1),
    ('Tips & Guides', 'tips-guides', 'Helpful tips, tutorials, and how-to guides', '#10B981', 2),
    ('Lifestyle', 'lifestyle', 'Lifestyle articles and inspiration', '#F59E0B', 3),
    ('Finance', 'finance', 'Money-saving tips and financial advice', '#6366F1', 4),
    ('Technology', 'technology', 'Tech news and digital trends', '#8B5CF6', 5)
ON CONFLICT (slug) DO NOTHING;

-- Comment on table
COMMENT ON TABLE categories IS 'Blog post categories for content organization and SEO';
COMMENT ON COLUMN posts.category_id IS 'Optional category for blog post organization';
