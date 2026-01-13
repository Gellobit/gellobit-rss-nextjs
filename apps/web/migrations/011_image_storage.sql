-- ============================================
-- Image Storage and Tracking System
-- ============================================

-- Create table for tracking uploaded images
CREATE TABLE IF NOT EXISTS public.media_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    bucket VARCHAR(100) DEFAULT 'images',
    -- Reference to what this image belongs to
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('opportunity', 'feed', 'setting')),
    entity_id UUID,
    -- Metadata
    width INTEGER,
    height INTEGER,
    alt_text TEXT,
    is_featured BOOLEAN DEFAULT false,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_media_files_entity ON public.media_files(entity_type, entity_id);
CREATE INDEX idx_media_files_created_at ON public.media_files(created_at DESC);

-- Enable RLS
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage media files" ON public.media_files
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Public can view media files" ON public.media_files
    FOR SELECT USING (true);

-- Trigger to update updated_at
CREATE TRIGGER update_media_files_updated_at BEFORE UPDATE ON public.media_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to delete orphaned media when opportunity is deleted
CREATE OR REPLACE FUNCTION delete_opportunity_media()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete associated media records (actual file deletion should be handled by the app)
    DELETE FROM public.media_files
    WHERE entity_type = 'opportunity' AND entity_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to clean up media when opportunity is deleted
CREATE TRIGGER cleanup_opportunity_media
    BEFORE DELETE ON public.opportunities
    FOR EACH ROW EXECUTE FUNCTION delete_opportunity_media();

-- Comment
COMMENT ON TABLE public.media_files IS 'Tracks uploaded images for opportunities, feeds, and settings with cleanup support.';
