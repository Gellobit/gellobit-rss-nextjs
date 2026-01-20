-- Migration: Add linked_opportunity_type to pages table
-- Allows pages to function as pillar pages for specific opportunity types

-- Add linked_opportunity_type column
ALTER TABLE pages ADD COLUMN IF NOT EXISTS linked_opportunity_type VARCHAR(50);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_pages_linked_opportunity_type ON pages(linked_opportunity_type) WHERE linked_opportunity_type IS NOT NULL;

-- Comment
COMMENT ON COLUMN pages.linked_opportunity_type IS 'When set, this page becomes a pillar page for the specified opportunity type and displays opportunities of that type';
