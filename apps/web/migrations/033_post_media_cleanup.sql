-- ============================================
-- Post Media Cleanup Trigger
-- Cleans up media_files records when a post is deleted
-- ============================================

-- Function to delete media when post is deleted
CREATE OR REPLACE FUNCTION delete_post_media()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete associated media records
    -- Note: Actual file deletion from storage should be handled by the app
    DELETE FROM public.media_files
    WHERE entity_type = 'post' AND entity_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to clean up media when post is deleted
DROP TRIGGER IF EXISTS cleanup_post_media ON public.posts;
CREATE TRIGGER cleanup_post_media
    BEFORE DELETE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION delete_post_media();

COMMENT ON FUNCTION delete_post_media() IS 'Cleans up media_files records when a post is deleted';
