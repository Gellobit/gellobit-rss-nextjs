-- ============================================
-- Add AI Provider Tracking to Opportunities
-- ============================================

-- Add ai_provider column to track which AI provider was used for each opportunity
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS ai_provider VARCHAR(50) DEFAULT 'default';

-- Create index for filtering by AI provider
CREATE INDEX IF NOT EXISTS idx_opportunities_ai_provider ON opportunities(ai_provider);

COMMIT;
