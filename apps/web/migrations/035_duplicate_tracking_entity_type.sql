-- Migration: Add entity_type support to duplicate_tracking
-- This allows tracking duplicates for both opportunities and blog posts

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE public.duplicate_tracking
DROP CONSTRAINT IF EXISTS duplicate_tracking_opportunity_id_fkey;

-- Step 2: Rename opportunity_id to entity_id for clarity
ALTER TABLE public.duplicate_tracking
RENAME COLUMN opportunity_id TO entity_id;

-- Step 3: Add entity_type column
ALTER TABLE public.duplicate_tracking
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20) DEFAULT 'opportunity';

-- Step 4: Update existing records to have entity_type = 'opportunity'
UPDATE public.duplicate_tracking
SET entity_type = 'opportunity'
WHERE entity_type IS NULL;

-- Step 5: Make entity_type NOT NULL
ALTER TABLE public.duplicate_tracking
ALTER COLUMN entity_type SET NOT NULL;

-- Step 6: Add check constraint for entity_type
ALTER TABLE public.duplicate_tracking
ADD CONSTRAINT duplicate_tracking_entity_type_check
CHECK (entity_type IN ('opportunity', 'post'));

-- Step 7: Create index on entity_type for faster queries
CREATE INDEX IF NOT EXISTS idx_duplicate_tracking_entity_type
ON public.duplicate_tracking(entity_type);

-- Step 8: Create composite index for lookups
CREATE INDEX IF NOT EXISTS idx_duplicate_tracking_entity
ON public.duplicate_tracking(entity_id, entity_type);

-- Add comments
COMMENT ON COLUMN public.duplicate_tracking.entity_id IS 'ID of the opportunity or post';
COMMENT ON COLUMN public.duplicate_tracking.entity_type IS 'Type of entity: opportunity or post';
