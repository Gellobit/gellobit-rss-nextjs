-- ============================================
-- Add View Tracking to Opportunities
-- ============================================

-- Add view_count column to opportunities table
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

-- Create index for better performance on sorting by views
CREATE INDEX IF NOT EXISTS idx_opportunities_view_count ON opportunities(view_count DESC);

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_opportunities_created_at_type ON opportunities(created_at, opportunity_type);

COMMIT;
