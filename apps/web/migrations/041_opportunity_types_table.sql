-- Migration: 041_opportunity_types_table.sql
-- Description: Create opportunity_types table for dynamic opportunity type management
-- This allows adding new opportunity types from the admin panel without code changes

-- Create opportunity_types table
CREATE TABLE IF NOT EXISTS opportunity_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',  -- Hex color for UI display
    icon VARCHAR(50),                     -- Lucide icon name (optional)
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,      -- System types cannot be deleted
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for active types lookup
CREATE INDEX IF NOT EXISTS idx_opportunity_types_active ON opportunity_types(is_active);
CREATE INDEX IF NOT EXISTS idx_opportunity_types_order ON opportunity_types(display_order);

-- Insert default opportunity types (matching existing hardcoded types)
INSERT INTO opportunity_types (slug, name, description, color, is_active, is_system, display_order) VALUES
    ('contest', 'Contest', 'Competitions with prizes for winners', '#EF4444', true, true, 1),
    ('giveaway', 'Giveaway', 'Free items or services given away', '#22C55E', true, true, 2),
    ('sweepstakes', 'Sweepstakes', 'Random draw prize opportunities', '#8B5CF6', true, true, 3),
    ('dream_job', 'Dream Job', 'Exceptional job opportunities', '#F59E0B', true, true, 4),
    ('get_paid_to', 'Get Paid To', 'Earn money for tasks or activities', '#10B981', true, true, 5),
    ('instant_win', 'Instant Win', 'Immediate prize notifications', '#EC4899', true, true, 6),
    ('job_fair', 'Job Fair', 'Employment events and career fairs', '#6366F1', true, true, 7),
    ('scholarship', 'Scholarship', 'Educational funding opportunities', '#0EA5E9', true, true, 8),
    ('volunteer', 'Volunteer', 'Volunteer and community service opportunities', '#14B8A6', true, true, 9),
    ('free_training', 'Free Training', 'Free courses and training programs', '#F97316', true, true, 10),
    ('promo', 'Promo', 'Promotional offers and deals', '#A855F7', true, true, 11)
ON CONFLICT (slug) DO NOTHING;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_opportunity_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_opportunity_types_updated_at ON opportunity_types;
CREATE TRIGGER trigger_opportunity_types_updated_at
    BEFORE UPDATE ON opportunity_types
    FOR EACH ROW
    EXECUTE FUNCTION update_opportunity_types_updated_at();

-- Enable RLS
ALTER TABLE opportunity_types ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read active opportunity types
CREATE POLICY "Anyone can read active opportunity types"
    ON opportunity_types FOR SELECT
    USING (is_active = true);

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage opportunity types"
    ON opportunity_types FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
