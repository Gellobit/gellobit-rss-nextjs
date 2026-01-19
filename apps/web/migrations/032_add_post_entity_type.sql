-- ============================================
-- Add 'post' to media_files entity_type constraint
-- Enables image storage for blog posts
-- ============================================

-- Drop existing constraint
ALTER TABLE public.media_files
DROP CONSTRAINT IF EXISTS media_files_entity_type_check;

-- Add new constraint with 'post' included
ALTER TABLE public.media_files
ADD CONSTRAINT media_files_entity_type_check
CHECK (entity_type IN ('opportunity', 'feed', 'setting', 'post'));

COMMENT ON COLUMN public.media_files.entity_type IS 'Type of entity this image belongs to: opportunity, feed, setting, or post';
