-- Migration: Create pages table for static public pages
-- Pages are for static content like About, Terms, Privacy etc.

-- Create pages table
CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Content
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,

    -- Media
    featured_image_url TEXT,

    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,

    -- Display options
    show_in_footer BOOLEAN DEFAULT true,
    show_in_menu BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),

    -- Author
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

    -- Timestamps
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);
CREATE INDEX IF NOT EXISTS idx_pages_sort_order ON pages(sort_order);
CREATE INDEX IF NOT EXISTS idx_pages_show_in_footer ON pages(show_in_footer) WHERE show_in_footer = true;
CREATE INDEX IF NOT EXISTS idx_pages_show_in_menu ON pages(show_in_menu) WHERE show_in_menu = true;

-- Enable RLS
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read published pages (public content)
CREATE POLICY "Public can read published pages" ON pages
    FOR SELECT
    USING (status = 'published');

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage all pages" ON pages
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pages_updated_at_trigger
    BEFORE UPDATE ON pages
    FOR EACH ROW
    EXECUTE FUNCTION update_pages_updated_at();

-- Comment on table
COMMENT ON TABLE pages IS 'Public static pages (About, Terms, Privacy, etc.)';
